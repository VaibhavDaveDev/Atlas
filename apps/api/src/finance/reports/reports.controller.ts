import { Controller, Get, UseGuards, Req, Query } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { ReportsService } from "./reports.service";
import { AuthGuard } from "../../common/guards/auth.guard";
import { WorkspaceGuard } from "../../auth/guards/workspace.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { PermissionGuard } from "../../auth/guards/permission.guard";
import { RequirePermission } from "../../auth/decorators/require-permission.decorator";
import type { Request } from "express";

@ApiTags("finance-reports")
@Controller("finance/reports")
@UseGuards(AuthGuard, WorkspaceGuard, RolesGuard, PermissionGuard)
@ApiBearerAuth("JWT-auth")
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get("balance-sheet")
  @RequirePermission({
    resource: "finance_reports",
    action: "read",
    scope: "all",
  })
  @ApiOperation({ summary: "Generate Balance Sheet" })
  async getBalanceSheet(@Req() req: Request): Promise<any> {
    const workspaceId = (req as any).user.workspaceId;
    return this.reportsService.getBalanceSheet(workspaceId);
  }

  @Get("profit-loss")
  @RequirePermission({
    resource: "finance_reports",
    action: "read",
    scope: "all",
  })
  @ApiOperation({ summary: "Generate Profit and Loss Statement" })
  async getProfitAndLoss(
    @Req() req: Request,
    @Query("startDate") startDate: string,
    @Query("endDate") endDate: string,
  ): Promise<any> {
    const workspaceId = (req as any).user.workspaceId;
    return this.reportsService.getProfitAndLoss(
      workspaceId,
      startDate,
      endDate,
    );
  }

  @Get("dashboard")
  @RequirePermission({
    resource: "finance_reports",
    action: "read",
    scope: "all",
  })
  @ApiOperation({ summary: "Get Finance Dashboard Stats" })
  async getDashboardStats(@Req() req: Request): Promise<any> {
    const workspaceId = (req as any).user.workspaceId;
    return this.reportsService.getDashboardStats(workspaceId);
  }

  @Get("cash-flow")
  @RequirePermission({
    resource: "finance_reports",
    action: "read",
    scope: "all",
  })
  @ApiOperation({ summary: "Generate Cash Flow Statement" })
  async getCashFlowStatement(
    @Req() req: Request,
    @Query("startDate") startDate: string,
    @Query("endDate") endDate: string,
  ): Promise<any> {
    const workspaceId = (req as any).user.workspaceId;
    return this.reportsService.getCashFlowStatement(
      workspaceId,
      startDate,
      endDate,
    );
  }
}
