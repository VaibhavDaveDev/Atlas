import { Module } from '@nestjs/common';
import { AccountsService } from './accounts/accounts.service';
import { AccountsController } from './accounts/accounts.controller';
import { JournalsService } from './journals/journals.service';
import { JournalsController } from './journals/journals.controller';
import { InvoicesService } from './invoices/invoices.service';
import { InvoicesController } from './invoices/invoices.controller';
import { PaymentsService } from './payments/payments.service';
import { PaymentsController } from './payments/payments.controller';
import { ReportsService } from './reports/reports.service';
import { ReportsController } from './reports/reports.controller';
import { PrismaService } from '../common/services/prisma.service';
import { CustomLoggerService } from '../common/services/custom-logger.service';

@Module({
  controllers: [
    AccountsController, 
    JournalsController, 
    InvoicesController,
    PaymentsController,
    ReportsController
  ],
  providers: [
    AccountsService, 
    JournalsService, 
    InvoicesService,
    PaymentsService,
    ReportsService,
    PrismaService,
    CustomLoggerService
  ],
  exports: [
    AccountsService, 
    JournalsService, 
    InvoicesService,
    PaymentsService,
    ReportsService
  ],
})
export class FinanceModule {}
