import { Controller, Get, Query, UseGuards, Param } from '@nestjs/common';
import { LogsService } from './logs.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { WorkspaceGuard } from '../auth/guards/workspace.guard';
import { PermissionGuard } from '../auth/guards/permission.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';

@Controller('logs')
@UseGuards(AuthGuard)
export class LogsController {
  constructor(private readonly logsService: LogsService) {}

  @Get('activity/:workspaceId')
  @UseGuards(WorkspaceGuard, PermissionGuard)
  @RequirePermission({ resource: 'audit_logs', action: 'read', scope: 'all' })
  async getActivityLogs(
    @Param('workspaceId') workspaceId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ): Promise<{ logs: any[]; total: number }> {
    return this.logsService.getActivityLogs(
      workspaceId, 
      limit ? parseInt(limit) : 50, 
      offset ? parseInt(offset) : 0
    );
  }

  @Get('system')
  @RequirePermission({ resource: 'system_logs', action: 'read', scope: 'all' })
  async getSystemLogs(@Query('limit') limit?: string) {
    return this.logsService.getSystemLogs(limit ? parseInt(limit) : 100);
  }
}
