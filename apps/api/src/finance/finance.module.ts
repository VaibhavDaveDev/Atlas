import { Module } from "@nestjs/common";
import { AccountsService } from "./accounts/accounts.service";
import { AccountsController } from "./accounts/accounts.controller";
import { JournalsService } from "./journals/journals.service";
import { JournalsController } from "./journals/journals.controller";
import { ExchangeRateService } from "./exchange-rates/exchange-rates.service";
import { ExchangeRatesController } from "./exchange-rates/exchange-rates.controller";
import { FinanceSetupController } from "./finance-setup.controller";
import { InvoicesService } from "./invoices/invoices.service";
import { InvoicesController } from "./invoices/invoices.controller";
import { PaymentsService } from "./payments/payments.service";
import { PaymentsController } from "./payments/payments.controller";
import { ReportsService } from "./reports/reports.service";
import { ReportsController } from "./reports/reports.controller";
import { PeriodsService } from "./periods/periods.service";
import { PeriodsController } from "./periods/periods.controller";
import { PrismaService } from "../common/services/prisma.service";
import { RedisService } from "../common/services/redis.service";
import { CustomLoggerService } from "../common/services/custom-logger.service";

@Module({
  controllers: [
    AccountsController,
    JournalsController,
    ExchangeRatesController,
    FinanceSetupController,
    InvoicesController,
    PaymentsController,
    ReportsController,
    PeriodsController,
  ],
  providers: [
    AccountsService,
    JournalsService,
    ExchangeRateService,
    InvoicesService,
    PaymentsService,
    ReportsService,
    PeriodsService,
    PrismaService,
    RedisService,
    CustomLoggerService,
  ],
  exports: [
    AccountsService,
    JournalsService,
    ExchangeRateService,
    InvoicesService,
    PaymentsService,
    ReportsService,
    PeriodsService,
  ],
})
export class FinanceModule {}
