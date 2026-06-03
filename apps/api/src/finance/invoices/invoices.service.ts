import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { CustomLoggerService } from '../../common/services/custom-logger.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { JournalsService } from '../journals/journals.service';
import { InvoiceType, InvoiceStatus, Invoice } from '@atlas/database';

@Injectable()
export class InvoicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: CustomLoggerService,
    private readonly journalsService: JournalsService,
  ) {}

  async create(workspaceId: string, userId: string, createDto: CreateInvoiceDto): Promise<Invoice> {
    this.logger.log(`Creating invoice: ${createDto.invoiceNumber}`, 'InvoicesService');

    // 1. Calculate totals
    let subtotal = 0;
    let taxAmount = 0;
    let total = 0;

    const items = createDto.items.map((item) => {
      const lineAmount = item.quantity * item.unitPrice;
      const lineTax = lineAmount * ((item.taxRate || 0) / 100);
      const finalAmount = lineAmount + lineTax; // Simplified: adding tax

      subtotal += lineAmount;
      taxAmount += lineTax;
      total += finalAmount;

      return {
        ...item,
        amount: finalAmount,
      };
    });

    // 2. Create invoice in transaction
    return this.prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.create({
        data: {
          workspaceId,
          invoiceNumber: createDto.invoiceNumber,
          invoiceType: createDto.invoiceType,
          customerId: createDto.customerId,
          vendorId: createDto.vendorId,
          invoiceDate: new Date(createDto.invoiceDate),
          dueDate: new Date(createDto.dueDate),
          currencyCode: createDto.currencyCode || 'USD',
          subtotal,
          taxAmount,
          total,
          status: InvoiceStatus.DRAFT,
          terms: createDto.terms,
          notes: createDto.notes,
          createdBy: userId,
          items: {
            create: items,
          },
        },
        include: {
          items: true,
        },
      });

      return invoice;
    });
  }

  async postInvoice(workspaceId: string, userId: string, id: string): Promise<Invoice> {
    this.logger.log(`Posting invoice: ${id}`, 'InvoicesService');

    const invoice = await this.prisma.invoice.findFirst({
      where: { id, workspaceId },
      include: { items: true },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    if (invoice.status !== InvoiceStatus.DRAFT) {
      throw new BadRequestException('Only DRAFT invoices can be posted');
    }

    // 1. Find relevant accounts (Hardcoded for now based on seed)
    const arAccount = await this.prisma.account.findFirst({
      where: { workspaceId, accountNumber: '1300' }, // Accounts Receivable
    });

    const salesAccount = await this.prisma.account.findFirst({
      where: { workspaceId, accountNumber: '4100' }, // Sales Revenue
    });

    const apAccount = await this.prisma.account.findFirst({
      where: { workspaceId, accountNumber: '2100' }, // Accounts Payable
    });

    const expenseAccount = await this.prisma.account.findFirst({
      where: { workspaceId, accountNumber: '5100' }, // COGS
    });

    if (!arAccount || !salesAccount || !apAccount || !expenseAccount) {
      throw new BadRequestException('Required accounting COA (1300, 4100, 2100, 5100) not found. Please run db:seed.');
    }

    // 2. Generate Journal Entry
    const lines: any[] = [];
    if (invoice.invoiceType === InvoiceType.SALES) {
      // Debit A/R, Credit Revenue
      lines.push({ accountId: arAccount.id, debit: Number(invoice.total), credit: 0, description: `Invoice ${invoice.invoiceNumber}` });
      lines.push({ accountId: salesAccount.id, debit: 0, credit: Number(invoice.total), description: `Invoice ${invoice.invoiceNumber}` });
    } else {
      // Debit Expense, Credit A/P
      lines.push({ accountId: expenseAccount.id, debit: Number(invoice.total), credit: 0, description: `Bill ${invoice.invoiceNumber}` });
      lines.push({ accountId: apAccount.id, debit: 0, credit: Number(invoice.total), description: `Bill ${invoice.invoiceNumber}` });
    }

    await this.journalsService.create(workspaceId, userId, {
      entryNumber: `JE-INV-${invoice.invoiceNumber}`,
      postingDate: invoice.invoiceDate.toISOString(),
      description: `GL Entry for Invoice ${invoice.invoiceNumber}`,
      referenceType: 'INVOICE',
      referenceId: invoice.id,
      lines,
    });

    // 3. Update Invoice Status
    return this.prisma.invoice.update({
      where: { id },
      data: { status: InvoiceStatus.SENT },
    });
  }

  async findAll(workspaceId: string): Promise<Invoice[]> {
    return this.prisma.invoice.findMany({
      where: { workspaceId },
      include: { items: true },
      orderBy: { invoiceDate: 'desc' },
    });
  }

  async findOne(workspaceId: string, id: string): Promise<Invoice> {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, workspaceId },
      include: { items: true },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return invoice;
  }
}
