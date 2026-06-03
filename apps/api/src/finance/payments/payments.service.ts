import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { CustomLoggerService } from '../../common/services/custom-logger.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { JournalsService } from '../journals/journals.service';
import { PaymentType, PaymentStatus, InvoiceStatus, Payment } from '@atlas/database';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: CustomLoggerService,
    private readonly journalsService: JournalsService,
  ) {}

  async create(workspaceId: string, userId: string, createDto: CreatePaymentDto): Promise<Payment> {
    this.logger.log(`Creating payment: ${createDto.paymentNumber}`, 'PaymentsService');

    // 1. Validate accounts (Hardcoded for now based on seed)
    const arAccount = await this.prisma.account.findFirst({
      where: { workspaceId, accountNumber: '1300' }, // Accounts Receivable
    });

    const apAccount = await this.prisma.account.findFirst({
      where: { workspaceId, accountNumber: '2100' }, // Accounts Payable
    });

    if (!arAccount || !apAccount) {
      throw new BadRequestException('Required accounting COA (1300, 2100) not found. Please run db:seed.');
    }

    // 2. Process in transaction
    return this.prisma.$transaction(async (tx) => {
      // a. Create Payment record
      const payment = await tx.payment.create({
        data: {
          workspaceId,
          paymentNumber: createDto.paymentNumber,
          paymentType: createDto.paymentType,
          partyId: createDto.partyId,
          invoiceId: createDto.invoiceId,
          paymentDate: new Date(createDto.paymentDate),
          amount: createDto.amount,
          currencyCode: createDto.currencyCode || 'USD',
          paymentMethod: createDto.paymentMethod,
          referenceNumber: createDto.referenceNumber,
          remarks: createDto.remarks,
          status: PaymentStatus.SUBMITTED,
        },
      });

      // b. Generate Journal Entry
      const lines: any[] = [];
      if (createDto.paymentType === PaymentType.RECEIVED) {
        // Debit Bank/Cash, Credit A/R
        lines.push({ accountId: createDto.accountId, debit: Number(createDto.amount), credit: 0, description: `Payment ${createDto.paymentNumber}` });
        lines.push({ accountId: arAccount.id, debit: 0, credit: Number(createDto.amount), description: `Payment ${createDto.paymentNumber}` });
      } else {
        // Debit A/P, Credit Bank/Cash
        lines.push({ accountId: apAccount.id, debit: Number(createDto.amount), credit: 0, description: `Payment ${createDto.paymentNumber}` });
        lines.push({ accountId: createDto.accountId, debit: 0, credit: Number(createDto.amount), description: `Payment ${createDto.paymentNumber}` });
      }

      await this.journalsService.create(workspaceId, userId, {
        entryNumber: `JE-PAY-${createDto.paymentNumber}`,
        postingDate: createDto.paymentDate,
        description: `GL Entry for Payment ${createDto.paymentNumber}`,
        referenceType: 'PAYMENT',
        referenceId: payment.id,
        lines,
      });

      // c. Update Invoice Status if linked
      if (createDto.invoiceId) {
        await tx.invoice.update({
          where: { id: createDto.invoiceId },
          data: { status: InvoiceStatus.PAID },
        });
      }

      return payment;
    });
  }

  async findAll(workspaceId: string): Promise<Payment[]> {
    return this.prisma.payment.findMany({
      where: { workspaceId },
      include: { invoice: true },
      orderBy: { paymentDate: 'desc' },
    });
  }

  async findOne(workspaceId: string, id: string): Promise<Payment> {
    const payment = await this.prisma.payment.findFirst({
      where: { id, workspaceId },
      include: { invoice: true },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return payment;
  }
}
