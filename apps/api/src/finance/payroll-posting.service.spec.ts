import { Test, TestingModule } from "@nestjs/testing";
import { PayrollPostingService } from "./payroll-posting.service";
import { PrismaService } from "../common/services/prisma.service";
import { CustomLoggerService } from "../common/services/custom-logger.service";
import { JournalsService } from "./journals/journals.service";
import { PayrollRunStatus } from "@atlas/database";
import { BadRequestException, NotFoundException } from "@nestjs/common";

describe("PayrollPostingService", () => {
  let service: PayrollPostingService;
  let prisma: PrismaService;
  let journalsService: JournalsService;

  const mockPrisma = {
    payrollRun: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    workspaceSettings: {
      findUnique: vi.fn(),
    },
    salaryComponent: {
      findMany: vi.fn(),
    },
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
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PayrollPostingService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: CustomLoggerService, useValue: mockLogger },
        { provide: JournalsService, useValue: mockJournalsService },
      ],
    }).compile();

    service = module.get<PayrollPostingService>(PayrollPostingService);
    prisma = module.get<PrismaService>(PrismaService);
    journalsService = module.get<JournalsService>(JournalsService);

    // Set defaults
    mockPrisma.salaryComponent.findMany.mockResolvedValue([]);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("should throw NotFoundException if payroll run not found", async () => {
    mockPrisma.payrollRun.findFirst.mockResolvedValue(null);

    await expect(
      service.postPayrollRun("ws-1", "user-1", "run-1"),
    ).rejects.toThrow(NotFoundException);
  });

  it("should throw BadRequestException if payroll run is not COMPLETED", async () => {
    mockPrisma.payrollRun.findFirst.mockResolvedValue({
      id: "run-1",
      status: PayrollRunStatus.DRAFT,
    });

    await expect(
      service.postPayrollRun("ws-1", "user-1", "run-1"),
    ).rejects.toThrow(BadRequestException);
  });

  it("should throw BadRequestException if payroll settings are missing", async () => {
    mockPrisma.payrollRun.findFirst.mockResolvedValue({
      id: "run-1",
      status: PayrollRunStatus.COMPLETED,
      entries: [],
    });

    mockPrisma.workspaceSettings.findUnique.mockResolvedValue({
      defaultPayrollPayableAccountId: null,
    });

    await expect(
      service.postPayrollRun("ws-1", "user-1", "run-1"),
    ).rejects.toThrow(BadRequestException);
  });

  it("should create a balanced journal entry for a completed payroll run", async () => {
    const mockRun = {
      id: "run-1",
      runNumber: "PR-2026-06",
      name: "June 2026 Payroll",
      status: PayrollRunStatus.COMPLETED,
      paymentDate: new Date("2026-06-30"),
      periodStart: new Date("2026-06-01"),
      periodEnd: new Date("2026-06-30"),
      entries: [
        {
          id: "entry-1",
          netSalary: 4500,
          earnings: [
            { name: "Basic", amount: 4000 },
            { name: "HRA", amount: 1000 },
          ],
          deductions: [{ name: "Tax", amount: 500 }],
        },
      ],
    };

    mockPrisma.payrollRun.findFirst.mockResolvedValue(mockRun);
    mockPrisma.workspaceSettings.findUnique.mockResolvedValue({
      baseCurrency: "USD",
      defaultPayrollPayableAccountId: "payable-acc",
      defaultSalaryExpenseAccountId: "expense-acc",
    });

    mockJournalsService.create.mockResolvedValue({ id: "je-1" });
    mockPrisma.payrollRun.update.mockResolvedValue({ id: "run-1" });

    const result = await service.postPayrollRun("ws-1", "user-1", "run-1");

    expect(result).toBeDefined();
    expect(mockJournalsService.create).toHaveBeenCalled();

    const callArgs = mockJournalsService.create.mock.calls[0][2];
    expect(callArgs.entryNumber).toBe("JE-PAY-PR-2026-06");

    // Validate lines:
    // Payable: Credit 4500 (Net) + Credit 500 (Deduction) = 5000 Credit
    // Expense: Debit 4000 (Basic) + Debit 1000 (HRA) = 5000 Debit
    const payableLine = callArgs.lines.find(
      (l) => l.accountId === "payable-acc",
    );
    const expenseLine = callArgs.lines.find(
      (l) => l.accountId === "expense-acc",
    );

    expect(payableLine.credit).toBe(5000);
    expect(expenseLine.debit).toBe(5000);
  });

  it("should use granular salary component mapping if available", async () => {
    const mockRun = {
      id: "run-1",
      runNumber: "PR-2026-06",
      name: "June 2026 Payroll",
      status: PayrollRunStatus.COMPLETED,
      paymentDate: new Date("2026-06-30"),
      periodStart: new Date("2026-06-01"),
      periodEnd: new Date("2026-06-30"),
      entries: [
        {
          id: "entry-1",
          netSalary: 3000,
          earnings: [
            { earningType: "BASIC", amount: 3000 },
            { earningType: "BONUS", amount: 500 },
          ],
          deductions: [{ deductionType: "TAX", amount: 500 }],
        },
      ],
    };

    mockPrisma.payrollRun.findFirst.mockResolvedValue(mockRun);
    mockPrisma.workspaceSettings.findUnique.mockResolvedValue({
      baseCurrency: "USD",
      defaultPayrollPayableAccountId: "payable-acc",
      defaultSalaryExpenseAccountId: "expense-acc",
    });

    // Mock specific component mapping for BONUS
    mockPrisma.salaryComponent.findMany.mockResolvedValue([
      { abbr: "BONUS", accountId: "bonus-expense-acc" },
      { abbr: "TAX", accountId: "tax-liability-acc" },
    ]);

    mockJournalsService.create.mockResolvedValue({ id: "je-1" });
    mockPrisma.payrollRun.update.mockResolvedValue({ id: "run-1" });

    await service.postPayrollRun("ws-1", "user-1", "run-1");

    const callArgs = mockJournalsService.create.mock.calls[0][2];

    const bonusLine = callArgs.lines.find(
      (l) => l.accountId === "bonus-expense-acc",
    );
    const taxLine = callArgs.lines.find(
      (l) => l.accountId === "tax-liability-acc",
    );
    const basicLine = callArgs.lines.find((l) => l.accountId === "expense-acc"); // Fallback
    const payableLine = callArgs.lines.find(
      (l) => l.accountId === "payable-acc",
    ); // Net

    expect(bonusLine.debit).toBe(500);
    expect(taxLine.credit).toBe(500);
    expect(basicLine.debit).toBe(3000);
    expect(payableLine.credit).toBe(3000);
  });
});
