import { Test, TestingModule } from '@nestjs/testing';
import { InvoicesService } from './invoices.service';
import { JournalsService } from '../journals/journals.service';
import { PrismaService } from '../../common/services/prisma.service';
import { CustomLoggerService } from '../../common/services/custom-logger.service';
import { InvoiceType, InvoiceStatus } from '@atlas/database';

describe('InvoicesService', () => {
  let service: InvoicesService;
  let prisma: PrismaService;
  let journalsService: JournalsService;

  const mockPrisma = {
    invoice: {
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
    },
    account: {
      findFirst: vi.fn(),
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
        InvoicesService,
        { provide: JournalsService, useValue: mockJournalsService },
        { provide: PrismaService, useValue: mockPrisma },
        { provide: CustomLoggerService, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<InvoicesService>(InvoicesService);
    prisma = module.get<PrismaService>(PrismaService);
    journalsService = module.get<JournalsService>(JournalsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create an invoice', async () => {
    const dto: any = {
      invoiceNumber: 'INV-001',
      invoiceType: InvoiceType.SALES,
      invoiceDate: new Date().toISOString(),
      dueDate: new Date().toISOString(),
      items: [
        { description: 'Service', quantity: 1, unitPrice: 1000, taxRate: 0 },
      ],
    };

    mockPrisma.invoice.create.mockResolvedValue({ id: 'inv-1', ...dto, total: 1000, status: InvoiceStatus.DRAFT });

    const result = await service.create('ws-1', 'user-1', dto);
    expect(result).toBeDefined();
    expect(mockPrisma.invoice.create).toHaveBeenCalled();
  });

  it('should post an invoice and generate journal entry', async () => {
    const mockInvoice = {
      id: 'inv-1',
      invoiceNumber: 'INV-001',
      invoiceType: InvoiceType.SALES,
      total: 1000,
      status: InvoiceStatus.DRAFT,
      invoiceDate: new Date(),
    };

    mockPrisma.invoice.findFirst.mockResolvedValue(mockInvoice);
    mockPrisma.account.findFirst.mockImplementation(({ where }: any) => {
      if (where.accountNumber === '1300') return { id: 'ar-acc' };
      if (where.accountNumber === '4100') return { id: 'rev-acc' };
      if (where.accountNumber === '2100') return { id: 'ap-acc' };
      if (where.accountNumber === '5100') return { id: 'exp-acc' };
      return null;
    });

    await service.postInvoice('ws-1', 'user-1', 'inv-1');

    expect(mockJournalsService.create).toHaveBeenCalledWith('ws-1', 'user-1', expect.objectContaining({
      referenceType: 'INVOICE',
      referenceId: 'inv-1',
    }));
    expect(mockPrisma.invoice.update).toHaveBeenCalledWith({
      where: { id: 'inv-1' },
      data: { status: InvoiceStatus.SENT },
    });
  });
});
