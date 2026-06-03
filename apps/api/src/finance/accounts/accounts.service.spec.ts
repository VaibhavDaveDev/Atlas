import { Test, TestingModule } from "@nestjs/testing";
import { AccountsService } from "./accounts.service";
import { PrismaService } from "../../common/services/prisma.service";
import { CustomLoggerService } from "../../common/services/custom-logger.service";
import { BadRequestException } from "@nestjs/common";
import { AccountType } from "@atlas/database";

describe("AccountsService", () => {
  let service: AccountsService;
  let prisma: PrismaService;

  const mockPrisma = {
    account: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    journalEntryLine: {
      count: vi.fn(),
    },
  };

  const mockLogger = {
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: CustomLoggerService, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<AccountsService>(AccountsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("should create an account", async () => {
    const dto: any = {
      accountNumber: "1000",
      accountName: "Assets",
      accountType: AccountType.ASSET,
    };

    mockPrisma.account.findUnique.mockResolvedValue(null);
    mockPrisma.account.create.mockResolvedValue({ id: "acc-1", ...dto });

    const result = await service.create("ws-1", dto);
    expect(result).toBeDefined();
    expect(result.accountNumber).toBe("1000");
    expect(mockPrisma.account.create).toHaveBeenCalled();
  });

  it("should throw error if account number exists", async () => {
    const dto: any = {
      accountNumber: "1000",
      accountName: "Assets",
    };

    mockPrisma.account.findUnique.mockResolvedValue({ id: "existing" });

    await expect(service.create("ws-1", dto)).rejects.toThrow(
      BadRequestException,
    );
  });
});
