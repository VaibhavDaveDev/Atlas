import { Controller, Post, Body, UseGuards, Req } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiCookieAuth } from "@nestjs/swagger";
import { AccountsService } from "./accounts/accounts.service";
import { PrismaService } from "../common/services/prisma.service";
import { AuthGuard } from "../common/guards/auth.guard";
import { WorkspaceGuard } from "../auth/guards/workspace.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import type { Request } from "express";

@ApiTags("finance-setup")
@Controller("finance/setup")
@UseGuards(AuthGuard, WorkspaceGuard, RolesGuard)
@ApiCookieAuth("better-auth-cookie")
export class FinanceSetupController {
  constructor(
    private readonly accountsService: AccountsService,
    private readonly prisma: PrismaService,
  ) {}

  @Post()
  @ApiOperation({
    summary: "Initialize finance settings and Chart of Accounts",
  })
  async setup(
    @Body() body: { baseCurrency: string; fiscalYearStart: string },
    @Req() req: Request,
  ): Promise<any> {
    const workspaceId = (req as any).user.workspaceId;

    // 1. Initialize COA
    const setupResults = await this.accountsService.initializeChartOfAccounts(
      workspaceId,
      body.baseCurrency,
    );

    // 2. Update Workspace Settings (Upsert to be safe)
    await this.prisma.workspaceSettings.upsert({
      where: { workspaceId },
      update: {
        baseCurrency: body.baseCurrency,
        fiscalYearStart: body.fiscalYearStart,
        financeSetupCompleted: true,
        exchangeGainLossAccountId: setupResults.exchangeGainLossAccountId,
        defaultPayrollPayableAccountId: setupResults.payrollPayableAccountId,
        defaultSalaryExpenseAccountId: setupResults.salaryExpenseAccountId,
      },
      create: {
        workspaceId,
        baseCurrency: body.baseCurrency,
        fiscalYearStart: body.fiscalYearStart,
        financeSetupCompleted: true,
        exchangeGainLossAccountId: setupResults.exchangeGainLossAccountId,
        defaultPayrollPayableAccountId: setupResults.payrollPayableAccountId,
        defaultSalaryExpenseAccountId: setupResults.salaryExpenseAccountId,
      },
    });

    return { success: true };
  }
}
