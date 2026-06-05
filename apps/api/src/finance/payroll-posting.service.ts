import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../common/services/prisma.service";
import { CustomLoggerService } from "../common/services/custom-logger.service";
import { JournalsService } from "./journals/journals.service";
import { PayrollRunStatus } from "@atlas/database";

@Injectable()
export class PayrollPostingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: CustomLoggerService,
    private readonly journalsService: JournalsService,
  ) {}

  async postPayrollRun(
    workspaceId: string,
    userId: string,
    runId: string,
  ): Promise<any> {
    this.logger.log(
      `Posting payroll run to ledger: ${runId}`,
      "PayrollPostingService",
    );

    // 1. Fetch Payroll Run with all details
    const run = await this.prisma.payrollRun.findFirst({
      where: { id: runId, workspaceId },
      include: {
        entries: {
          include: {
            earnings: true,
            deductions: true,
          },
        },
      },
    });

    if (!run) {
      throw new NotFoundException("Payroll Run not found");
    }

    if (run.status !== PayrollRunStatus.COMPLETED) {
      throw new BadRequestException(
        "Only COMPLETED payroll runs can be posted to ledger",
      );
    }

    if (run.journalEntryId) {
      throw new BadRequestException(
        "Payroll run has already been posted to ledger",
      );
    }

    // 2. Fetch Finance Settings for defaults
    const settings = await this.prisma.workspaceSettings.findUnique({
      where: { workspaceId },
    });

    if (
      !settings ||
      !settings.defaultPayrollPayableAccountId ||
      !settings.defaultSalaryExpenseAccountId
    ) {
      throw new BadRequestException(
        "Default payroll accounts not configured. Please complete Finance Setup.",
      );
    }

    // 3. Aggregate entries by Account
    // We'll create a map: AccountID -> { debit, credit }
    const accountTotals = new Map<string, { debit: number; credit: number }>();

    // Pre-fetch salary components with their account mappings for this workspace
    const components = await this.prisma.salaryComponent.findMany({
      where: { workspaceId },
      select: { abbr: true, accountId: true },
    });
    const componentAccountMap = new Map(
      components.map((c) => [c.abbr, c.accountId]),
    );

    const addAmount = (accountId: string, debit: number, credit: number) => {
      const current = accountTotals.get(accountId) || { debit: 0, credit: 0 };
      accountTotals.set(accountId, {
        debit: current.debit + debit,
        credit: current.credit + credit,
      });
    };

    // 4. Process each entry
    for (const entry of run.entries) {
      // Net Salary goes to Payroll Payable (Credit)
      addAmount(
        settings.defaultPayrollPayableAccountId,
        0,
        Number(entry.netSalary),
      );

      // Earnings go to Expense Accounts (Debit)
      for (const earning of entry.earnings) {
        const componentAccountId = componentAccountMap.get(
          earning.earningType || earning.name,
        );
        const targetAccountId =
          componentAccountId || settings.defaultSalaryExpenseAccountId;
        addAmount(targetAccountId, Number(earning.amount), 0);
      }

      // Deductions (like PF, Tax) usually go to Liability Accounts (Credit)
      for (const deduction of entry.deductions) {
        const componentAccountId = componentAccountMap.get(
          deduction.deductionType || deduction.name,
        );
        const targetAccountId =
          componentAccountId || settings.defaultPayrollPayableAccountId;
        addAmount(targetAccountId, 0, Number(deduction.amount));
      }
    }

    // 5. Prepare Journal Entry Lines
    const lines = Array.from(accountTotals.entries()).map(
      ([accountId, totals]) => ({
        accountId,
        debit: totals.debit,
        credit: totals.credit,
        description: `Payroll Run: ${run.runNumber} - ${run.name}`,
      }),
    );

    // 6. Create Journal Entry
    const journalEntry = await this.journalsService.create(
      workspaceId,
      userId,
      {
        entryNumber: `JE-PAY-${run.runNumber}`,
        postingDate: run.paymentDate.toISOString(),
        description: `Payroll Accrual for ${run.name} (${run.periodStart.toISOString().split("T")[0]} to ${run.periodEnd.toISOString().split("T")[0]})`,
        referenceType: "PayrollRun",
        referenceId: run.id,
        currencyCode: settings.baseCurrency,
        exchangeRate: 1.0,
        lines,
      },
    );

    // 7. Link Journal Entry back to Payroll Run
    await this.prisma.payrollRun.update({
      where: { id: runId },
      data: {
        journalEntryId: journalEntry.id,
      },
    });

    return journalEntry;
  }
}
