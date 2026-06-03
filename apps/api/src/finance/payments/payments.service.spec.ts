import { Test, TestingModule } from "@nestjs/testing";
import { PaymentsService } from "./payments.service";
import { JournalsService } from "../journals/journals.service";
import { PrismaService } from "../../common/services/prisma.service";
import { CustomLoggerService } from "../../common/services/custom-logger.service";
import { PaymentType, PaymentStatus, InvoiceStatus } from "@atlas/database";

describe("PaymentsService", () => {
  let service: PaymentsService;
  let prisma: PrismaService;
  let journalsService: JournalsService;

  const mockPrisma = {
    payment: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    account: {
      findFirst: vi.fn(),
    },
    invoice: {
      update: vi.fn(),
      findUnique: vi.fn(),
    },
    workspaceSettings: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn((cb) => cb(mockPrisma)),
  };

  const mockJournalsService = {
    create: vi.fn(),
  };

  const mockLogger = {
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: JournalsService, useValue: mockJournalsService },
        { provide: PrismaService, useValue: mockPrisma },
        { provide: CustomLoggerService, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
    prisma = module.get<PrismaService>(PrismaService);
    journalsService = module.get<JournalsService>(JournalsService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("should record a payment and update invoice", async () => {
    const dto: any = {
      paymentNumber: "PAY-001",
      paymentType: PaymentType.RECEIVED,
      invoiceId: "inv-1",
      paymentDate: new Date().toISOString(),
      amount: 1000,
      paymentMethod: "Bank Transfer",
      accountId: "bank-acc-1",
    };

    mockPrisma.account.findFirst.mockImplementation(({ where }: any) => {
      if (where.accountNumber === "1300") return { id: "ar-acc" };
      if (where.accountNumber === "2100") return { id: "ap-acc" };
      return null;
    });

    mockPrisma.payment.create.mockResolvedValue({ id: "pay-1", ...dto });

    const result = await service.create("ws-1", "user-1", dto);

    expect(result).toBeDefined();
    expect(mockPrisma.payment.create).toHaveBeenCalled();
    expect(mockJournalsService.create).toHaveBeenCalled();
    expect(mockPrisma.invoice.update).toHaveBeenCalledWith({
      where: { id: "inv-1" },
      data: { status: InvoiceStatus.PAID },
    });
  });

  it("should calculate exchange gain when receiving payment at higher rate", async () => {
    const workspaceId = "ws-1";
    const userId = "user-1";
    const dto: any = {
      paymentNumber: "PAY-GAIN",
      paymentType: PaymentType.RECEIVED,
      invoiceId: "inv-eur",
      paymentDate: "2023-02-01",
      amount: 100, // 100 EUR
      currencyCode: "EUR",
      exchangeRate: 1.1, // 1 EUR = 1.1 USD (at payment time)
      paymentMethod: "Bank",
      accountId: "bank-acc-1",
    };

    mockPrisma.account.findFirst.mockImplementation(({ where }: any) => {
      if (where.accountNumber === "1300") return { id: "ar-acc" };
      if (where.accountNumber === "2100") return { id: "ap-acc" };
      return null;
    });

    mockPrisma.workspaceSettings.findUnique.mockResolvedValue({
      workspaceId,
      baseCurrency: "USD",
      exchangeGainLossAccountId: "gain-loss-acc",
    });

    // Invoice was at 1.0 rate (100 USD expected)
    mockPrisma.invoice.findUnique.mockResolvedValue({
      id: "inv-eur",
      exchangeRate: 1.0,
      total: 100,
    });

    mockPrisma.payment.create.mockResolvedValue({ id: "pay-1", ...dto });

    await service.create(workspaceId, userId, dto);

    // Verify Journal Entry lines
    const jeCall = mockJournalsService.create.mock.calls.find(
      (call) => call[2].entryNumber === "JE-PAY-PAY-GAIN",
    );
    const lines = jeCall[2].lines;

    // Bank: 100 * 1.1 = 110 Debit
    expect(lines.find((l) => l.accountId === "bank-acc-1").debit).toBeCloseTo(
      110,
    );
    // AR: 100 * 1.0 = 100 Credit
    expect(lines.find((l) => l.accountId === "ar-acc").credit).toBeCloseTo(100);
    // Gain: 110 - 100 = 10 Credit
    expect(
      lines.find((l) => l.accountId === "gain-loss-acc").credit,
    ).toBeCloseTo(10);
  });

  it("should calculate exchange loss when receiving payment at lower rate", async () => {
    const workspaceId = "ws-1";
    const dto: any = {
      paymentNumber: "PAY-LOSS",
      paymentType: PaymentType.RECEIVED,
      invoiceId: "inv-eur-2",
      paymentDate: "2023-02-01",
      amount: 100,
      currencyCode: "EUR",
      exchangeRate: 0.9, // 1 EUR = 0.9 USD (at payment time)
      paymentMethod: "Bank",
      accountId: "bank-acc-1",
    };

    mockPrisma.workspaceSettings.findUnique.mockResolvedValue({
      workspaceId,
      exchangeGainLossAccountId: "gain-loss-acc",
    });

    // Invoice was at 1.0 rate (100 USD expected)
    mockPrisma.invoice.findUnique.mockResolvedValue({
      id: "inv-eur-2",
      exchangeRate: 1.0,
    });

    await service.create(workspaceId, "u1", dto);

    const jeCall = mockJournalsService.create.mock.calls.find(
      (call) => call[2].entryNumber === "JE-PAY-PAY-LOSS",
    );
    const lines = jeCall[2].lines;

    // Bank: 100 * 0.9 = 90 Debit
    expect(lines.find((l) => l.accountId === "bank-acc-1").debit).toBeCloseTo(
      90,
    );
    // AR: 100 * 1.0 = 100 Credit
    expect(lines.find((l) => l.accountId === "ar-acc").credit).toBeCloseTo(100);
    // Loss: |90 - 100| = 10 Debit
    expect(
      lines.find((l) => l.accountId === "gain-loss-acc").debit,
    ).toBeCloseTo(10);
  });
});
