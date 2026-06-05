import { Test, TestingModule } from "@nestjs/testing";
import { JournalsService } from "./journals.service";
import { PrismaService } from "../../common/services/prisma.service";
import { CustomLoggerService } from "../../common/services/custom-logger.service";
import { PeriodsService } from "../periods/periods.service";
import { BadRequestException } from "@nestjs/common";

describe("JournalsService", () => {
  let service: JournalsService;
  let prisma: PrismaService;

  const mockPrisma = {
    journalEntry: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    account: {
      update: vi.fn(),
    },
    $transaction: vi.fn((cb) => cb(mockPrisma)),
  };

  const mockLogger = {
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  };

  const mockPeriodsService = {
    isPeriodLocked: vi.fn().mockResolvedValue(false),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JournalsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: CustomLoggerService, useValue: mockLogger },
        { provide: PeriodsService, useValue: mockPeriodsService },
      ],
    }).compile();

    service = module.get<JournalsService>(JournalsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("should throw error if journal entry is not balanced", async () => {
    const dto: any = {
      entryNumber: "JE-001",
      postingDate: new Date().toISOString(),
      lines: [
        { accountId: "acc-1", debit: 100, credit: 0 },
        { accountId: "acc-2", debit: 0, credit: 50 },
      ],
    };

    await expect(service.create("ws-1", "user-1", dto)).rejects.toThrow(
      BadRequestException,
    );
  });

  it("should create balanced journal entry", async () => {
    const dto: any = {
      entryNumber: "JE-002",
      postingDate: new Date().toISOString(),
      lines: [
        { accountId: "acc-1", debit: 100, credit: 0 },
        { accountId: "acc-2", debit: 0, credit: 100 },
      ],
    };

    mockPrisma.journalEntry.findUnique.mockResolvedValue(null);
    mockPrisma.journalEntry.create.mockResolvedValue({ id: "je-1", ...dto });

    const result = await service.create("ws-1", "user-1", dto);
    expect(result).toBeDefined();
    expect(mockPrisma.journalEntry.create).toHaveBeenCalled();
    expect(mockPrisma.account.update).toHaveBeenCalledTimes(2);
  });
});
