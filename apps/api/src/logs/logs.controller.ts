import {
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
  Param,
} from "@nestjs/common";
import { LogsService } from "./logs.service";
import { AuditTrailService } from "./audit-trail.service";
import { AuthGuard } from "../common/guards/auth.guard";
import { WorkspaceGuard } from "../auth/guards/workspace.guard";
import { PermissionGuard } from "../auth/guards/permission.guard";
import { RequirePermission } from "../auth/decorators/require-permission.decorator";

@Controller("logs")
@UseGuards(AuthGuard)
export class LogsController {
  constructor(
    private readonly logsService: LogsService,
    private readonly auditTrailService: AuditTrailService,
  ) {}

  @Get("activity/:workspaceId")
  @UseGuards(WorkspaceGuard, PermissionGuard)
  @RequirePermission({ resource: "audit_logs", action: "read", scope: "all" })
  async getActivityLogs(
    @Param("workspaceId") workspaceId: string,
    @Query("limit") limit?: string,
    @Query("offset") offset?: string,
  ): Promise<{ logs: any[]; total: number }> {
    return this.logsService.getActivityLogs(
      workspaceId,
      limit ? parseInt(limit) : 50,
      offset ? parseInt(offset) : 0,
    );
  }

  @Get("audit/all")
  @UseGuards(PermissionGuard)
  @RequirePermission({ resource: "audit_logs", action: "read", scope: "all" })
  async getGlobalAuditLogs(
    @Query("limit") limit?: string,
    @Query("offset") offset?: string,
    @Query("userId") userId?: string,
    @Query("action") action?: string,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
  ) {
    return this.auditTrailService.getLogs({
      userId,
      action,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      limit: limit ? parseInt(limit) : 50,
      offset: offset ? parseInt(offset) : 0,
    });
  }

  @Get("audit/:workspaceId")
  @UseGuards(WorkspaceGuard, PermissionGuard)
  @RequirePermission({ resource: "audit_logs", action: "read", scope: "all" })
  async getAuditLogs(
    @Param("workspaceId") workspaceId: string,
    @Query("limit") limit?: string,
    @Query("offset") offset?: string,
    @Query("userId") userId?: string,
    @Query("action") action?: string,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
  ): Promise<{ logs: any[]; total: number }> {
    return this.auditTrailService.getLogs({
      workspaceId,
      userId,
      action,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      limit: limit ? parseInt(limit) : 50,
      offset: offset ? parseInt(offset) : 0,
    });
  }

  @Get("audit/:workspaceId/verify")
  @UseGuards(WorkspaceGuard, PermissionGuard)
  @RequirePermission({ resource: "audit_logs", action: "read", scope: "all" })
  async verifyAuditChain(
    @Param("workspaceId") workspaceId: string,
  ): Promise<{ isValid: boolean; invalidRecordId?: string }> {
    return this.auditTrailService.verifyIntegrity(workspaceId);
  }

  @Post("audit/:workspaceId/recompute")
  @UseGuards(WorkspaceGuard, PermissionGuard)
  @RequirePermission({ resource: "audit_logs", action: "update", scope: "all" })
  async recalculateAuditChain(
    @Param("workspaceId") workspaceId: string,
  ): Promise<{ count: number }> {
    return this.auditTrailService.recalculateHashes(workspaceId);
  }

  @Get("system")
  @RequirePermission({ resource: "system_logs", action: "read", scope: "all" })
  async getSystemLogs(@Query("limit") limit?: string) {
    return this.logsService.getSystemLogs(limit ? parseInt(limit) : 100);
  }
}
