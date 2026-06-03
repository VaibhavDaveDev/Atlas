import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../common/services/prisma.service";
import { CustomLoggerService } from "../../common/services/custom-logger.service";
import { CreatePaymentDto } from "./dto/create-payment.dto";
import { JournalsService } from "../journals/journals.service";
import {
  PaymentType,
  PaymentStatus,
  InvoiceStatus,
  Payment,
} from "@atlas/database";

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: CustomLoggerService,
    private readonly journalsService: JournalsService,
  ) {}

  async create(
    workspaceId: string,
    userId: string,
    createDto: CreatePaymentDto,
  ): Promise<Payment> {
    this.logger.log(
      `Creating payment: ${createDto.paymentNumber}`,
      "PaymentsService",
    );

    // 1. Validate accounts (Hardcoded for now based on seed)
    const arAccount = await this.prisma.account.findFirst({
      where: { workspaceId, accountNumber: "1300" }, // Accounts Receivable
    });

    const apAccount = await this.prisma.account.findFirst({
      where: { workspaceId, accountNumber: "2100" }, // Accounts Payable
    });

    if (!arAccount || !apAccount) {
      throw new BadRequestException(
        "Required accounting COA (1300, 2100) not found. Please run db:seed.",
      );
    }

    // 2. Process in transaction
    return this.prisma.$transaction(async (tx) => {
      const settings = await tx.workspaceSettings.findUnique({
        where: { workspaceId },
      });
      const paymentRate = Number(createDto.exchangeRate || 1);
      const paymentBaseAmount = Number(createDto.amount) * paymentRate;

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
          currencyCode: createDto.currencyCode || "USD",
          exchangeRate: paymentRate,
          paymentMethod: createDto.paymentMethod,
          referenceNumber: createDto.referenceNumber,
          remarks: createDto.remarks,
          status: PaymentStatus.SUBMITTED,
        },
      });

      // b. Calculate Exchange Gain/Loss if linked to an invoice
      let gainLossAmount = 0; // In Base Currency
      if (createDto.invoiceId) {
        const invoice = await tx.invoice.findUnique({
          where: { id: createDto.invoiceId },
        });
        if (invoice) {
          const invoiceRate = Number(invoice.exchangeRate || 1);
          const expectedBaseAmount = Number(createDto.amount) * invoiceRate;
          gainLossAmount = paymentBaseAmount - expectedBaseAmount;
        }
      }

      // c. Generate Journal Entry
      const lines: any[] = [];
      const offsetAccountId =
        createDto.offsetAccountId ||
        (createDto.paymentType === PaymentType.RECEIVED
          ? arAccount.id
          : apAccount.id);

      if (createDto.paymentType === PaymentType.RECEIVED) {
        // Debit Bank (Actual Base Amount)
        lines.push({
          accountId: createDto.accountId,
          debit: paymentBaseAmount,
          credit: 0,
          description: `Payment ${createDto.paymentNumber}`,
        });

        // Credit AR (Original/Expected Base Amount)
        lines.push({
          accountId: offsetAccountId,
          debit: 0,
          credit: paymentBaseAmount - gainLossAmount,
          description: `Payment ${createDto.paymentNumber}`,
        });

        // Handle Gain/Loss (Difference between Actual and Expected)
        if (gainLossAmount !== 0) {
          const gainLossAccountId = settings?.exchangeGainLossAccountId;
          if (!gainLossAccountId)
            throw new BadRequestException(
              "Exchange Gain/Loss account not configured in Workspace Settings. Please complete Finance Setup.",
            );

          if (gainLossAmount > 0) {
            // Gain: Credit Income
            lines.push({
              accountId: gainLossAccountId,
              debit: 0,
              credit: gainLossAmount,
              description: `FX Gain on ${createDto.paymentNumber}`,
            });
          } else {
            // Loss: Debit Expense
            lines.push({
              accountId: gainLossAccountId,
              debit: Math.abs(gainLossAmount),
              credit: 0,
              description: `FX Loss on ${createDto.paymentNumber}`,
            });
          }
        }
      } else {
        // PAID (to Vendor)
        // Debit AP (Original/Expected Base Amount)
        lines.push({
          accountId: offsetAccountId,
          debit: paymentBaseAmount - gainLossAmount,
          credit: 0,
          description: `Payment ${createDto.paymentNumber}`,
        });

        // Credit Bank (Actual Base Amount)
        lines.push({
          accountId: createDto.accountId,
          debit: 0,
          credit: paymentBaseAmount,
          description: `Payment ${createDto.paymentNumber}`,
        });

        // Handle Gain/Loss
        if (gainLossAmount !== 0) {
          const gainLossAccountId = settings?.exchangeGainLossAccountId;
          if (!gainLossAccountId)
            throw new BadRequestException(
              "Exchange Gain/Loss account not configured in Workspace Settings. Please complete Finance Setup.",
            );

          if (gainLossAmount < 0) {
            // Gain: Credit Income (We paid less than expected in base currency)
            lines.push({
              accountId: gainLossAccountId,
              debit: 0,
              credit: Math.abs(gainLossAmount),
              description: `FX Gain on ${createDto.paymentNumber}`,
            });
          } else {
            // Loss: Debit Expense (We paid more than expected in base currency)
            lines.push({
              accountId: gainLossAccountId,
              debit: gainLossAmount,
              credit: 0,
              description: `FX Loss on ${createDto.paymentNumber}`,
            });
          }
        }
      }

      await this.journalsService.create(workspaceId, userId, {
        entryNumber: `JE-PAY-${createDto.paymentNumber}`,
        postingDate: createDto.paymentDate,
        description: `GL Entry for Payment ${createDto.paymentNumber} (${createDto.currencyCode} @ ${paymentRate})`,
        referenceType: "PAYMENT",
        referenceId: payment.id,
        currencyCode: createDto.currencyCode,
        exchangeRate: paymentRate,
        lines,
      });

      // d. Update Invoice Status if linked
      if (createDto.invoiceId) {
        await tx.invoice.update({
          where: { id: createDto.invoiceId },
          data: { status: InvoiceStatus.PAID },
        });
      }

      return payment;
    });
  }

  async reconcile(workspaceId: string, id: string): Promise<Payment> {
    this.logger.log(`Reconciling payment: ${id}`, "PaymentsService");
    return this.prisma.payment.update({
      where: { id, workspaceId },
      data: { status: PaymentStatus.RECONCILED },
    });
  }

  async findAll(workspaceId: string): Promise<Payment[]> {
    return this.prisma.payment.findMany({
      where: { workspaceId },
      include: { invoice: true },
      orderBy: { paymentDate: "desc" },
    });
  }

  async findOne(workspaceId: string, id: string): Promise<Payment> {
    const payment = await this.prisma.payment.findFirst({
      where: { id, workspaceId },
      include: { invoice: true },
    });

    if (!payment) {
      throw new NotFoundException("Payment not found");
    }

    return payment;
  }
}
