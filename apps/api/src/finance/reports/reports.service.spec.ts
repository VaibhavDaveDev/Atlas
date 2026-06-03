import { Test, TestingModule } from '@nestjs/testing';
import { ReportsService } from './reports.service';
import { PrismaService } from '../../common/services/prisma.service';
import { AccountType } from '@atlas/database';

describe('ReportsService', () => {
  let service: ReportsService;
  let prisma: PrismaService;

  const mockPrisma = {
    account: {
      findMany: vi.fn(),
    },
    journalEntryLine: {
      findMany: vi.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should generate balance sheet', async () => {
    const mockAccounts = [
      { accountNumber: '1100', accountName: 'Cash', accountType: AccountType.ASSET, balance: 5000, isActive: true },
      { accountNumber: '2100', accountName: 'Payables', accountType: AccountType.LIABILITY, balance: 2000, isActive: true },
      { accountNumber: '3100', accountName: 'Capital', accountType: AccountType.EQUITY, balance: 3000, isActive: true },
    ];

    mockPrisma.account.findMany.mockResolvedValue(mockAccounts);

    const result = await service.getBalanceSheet('ws-1');

    expect(result.totals.assets).toBe(5000);
    expect(result.totals.liabilities).toBe(2000);
    expect(result.totals.equity).toBe(3000);
    expect(result.assets).toHaveLength(1);
  });
});
