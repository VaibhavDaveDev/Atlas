import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsService } from './payments.service';
import { JournalsService } from '../journals/journals.service';
import { PrismaService } from '../../common/services/prisma.service';
import { CustomLoggerService } from '../../common/services/custom-logger.service';
import { PaymentType, PaymentStatus, InvoiceStatus } from '@atlas/database';

describe('PaymentsService', () => {
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

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should record a payment and update invoice', async () => {
    const dto: any = {
      paymentNumber: 'PAY-001',
      paymentType: PaymentType.RECEIVED,
      invoiceId: 'inv-1',
      paymentDate: new Date().toISOString(),
      amount: 1000,
      paymentMethod: 'Bank Transfer',
      accountId: 'bank-acc-1',
    };

    mockPrisma.account.findFirst.mockImplementation(({ where }: any) => {
      if (where.accountNumber === '1300') return { id: 'ar-acc' };
      if (where.accountNumber === '2100') return { id: 'ap-acc' };
      return null;
    });

    mockPrisma.payment.create.mockResolvedValue({ id: 'pay-1', ...dto });

    const result = await service.create('ws-1', 'user-1', dto);

    expect(result).toBeDefined();
    expect(mockPrisma.payment.create).toHaveBeenCalled();
    expect(mockJournalsService.create).toHaveBeenCalled();
    expect(mockPrisma.invoice.update).toHaveBeenCalledWith({
      where: { id: 'inv-1' },
      data: { status: InvoiceStatus.PAID },
    });
  });
});
