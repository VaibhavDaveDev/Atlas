import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody, ApiParam } from '@nestjs/swagger';
import { WorkspaceService } from './workspace.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { WorkspaceGuard } from '../auth/guards/workspace.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PermissionGuard } from '../auth/guards/permission.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import type { Request } from 'express';

@ApiTags('workspaces')
@Controller('workspaces')
export class WorkspaceController {
  constructor(private readonly workspaceService: WorkspaceService) {}

  // ─────────────────────────────────────────────
  // INVITES — No workspace JWT required (pre-select flow)
  // ─────────────────────────────────────────────

  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Get('invites/pending')
  @ApiOperation({ summary: 'Get pending invites for the current user (by email)' })
  async getPendingInvites(@Req() req: Request) {
    const user = (req as any).user;
    return await this.workspaceService.getPendingInvites(user.userId);
  }

  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Post('invites/:token/accept')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Accept a workspace invite by token' })
  @ApiParam({ name: 'token', description: 'Invite token from email link' })
  async acceptInvite(@Param('token') token: string, @Req() req: Request) {
    const user = (req as any).user;
    return await this.workspaceService.acceptInvite(token, user.userId);
  }

  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Post('setup')
  @ApiOperation({ summary: 'Setup a new workspace' })
  @ApiBody({
    schema: {
      example: {
        name: 'Acme Corp',
        subdomain: 'acme',
        industry: 'Technology',
        workspaceSize: '1-10',
      },
    },
  })
  async setup(
    @Body() body: { name: string; subdomain: string; industry?: string; workspaceSize?: string },
    @Req() req: Request,
  ) {
    const user = (req as any).user;
    return await this.workspaceService.setup(user.userId, body);
  }

  // ─────────────────────────────────────────────
  // WORKSPACE INFO & SETTINGS — Requires workspace JWT
  // ─────────────────────────────────────────────

  @UseGuards(AuthGuard, WorkspaceGuard, RolesGuard, PermissionGuard)
  @ApiBearerAuth('JWT-auth')
  @Get(':workspaceId')
  @RequirePermission({ resource: 'workspace', action: 'read', scope: 'all' })
  @ApiOperation({ summary: 'Get workspace details and settings' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace ID' })
  async getWorkspace(@Param('workspaceId') workspaceId: string): Promise<any> {
    return await this.workspaceService.getWorkspace(workspaceId);
  }

  @UseGuards(AuthGuard, WorkspaceGuard, RolesGuard, PermissionGuard)
  @ApiBearerAuth('JWT-auth')
  @Patch(':workspaceId')
  @RequirePermission({ resource: 'workspace', action: 'update', scope: 'all' })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update workspace name and/or settings' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace ID' })
  @ApiBody({
    schema: {
      example: {
        name: 'Acme Corp',
        settings: {
          baseCurrency: 'INR',
          dateFormat: 'DD/MM/YYYY',
          timeFormat: 'HH:mm',
          fiscalYearStart: '04-01',
        },
      },
    },
  })
  async updateWorkspace(
    @Param('workspaceId') workspaceId: string,
    @Body() body: { name?: string; settings?: Record<string, any> },
  ): Promise<any> {
    return await this.workspaceService.updateWorkspace(workspaceId, body);
  }

  // ─────────────────────────────────────────────
  // MEMBER MANAGEMENT — Requires workspace JWT
  // ─────────────────────────────────────────────

  @UseGuards(AuthGuard, WorkspaceGuard, RolesGuard, PermissionGuard)
  @ApiBearerAuth('JWT-auth')
  @Get(':workspaceId/members')
  @RequirePermission({ resource: 'workspace', action: 'read', scope: 'all' })
  @ApiOperation({ summary: 'List all active members of a workspace' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace ID' })
  async listMembers(@Param('workspaceId') workspaceId: string) {
    return await this.workspaceService.listMembers(workspaceId);
  }

  @UseGuards(AuthGuard, WorkspaceGuard, RolesGuard, PermissionGuard)
  @ApiBearerAuth('JWT-auth')
  @Get(':workspaceId/members/check/:email')
  @RequirePermission({ resource: 'workspace', action: 'read', scope: 'all' })
  @ApiOperation({ summary: 'Check if a user is already a member by email' })
  async checkMember(
    @Param('workspaceId') workspaceId: string,
    @Param('email') email: string,
  ) {
    const member = await this.workspaceService.getMemberByEmail(workspaceId, email);
    if (!member) return { isMember: false };
    return {
      isMember: true,
      role: member.role,
      username: member.user?.username,
    };
  }

  @UseGuards(AuthGuard, WorkspaceGuard, RolesGuard, PermissionGuard)
  @ApiBearerAuth('JWT-auth')
  @Patch(':workspaceId/members/:userId/role')
  @RequirePermission({ resource: 'workspace', action: 'manage', scope: 'all' })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change a member\'s role' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace ID' })
  @ApiParam({ name: 'userId', description: 'Target user ID' })
  @ApiBody({ schema: { example: { role: 'ADMIN' } } })
  async changeMemberRole(
    @Param('workspaceId') workspaceId: string,
    @Param('userId') targetUserId: string,
    @Body() body: { role: string },
    @Req() req: Request,
  ) {
    const user = (req as any).user;
    return await this.workspaceService.changeMemberRole(
      workspaceId,
      targetUserId,
      body.role,
      user.userId,
    );
  }

  @UseGuards(AuthGuard, WorkspaceGuard, RolesGuard, PermissionGuard)
  @ApiBearerAuth('JWT-auth')
  @Delete(':workspaceId/members/:userId')
  @RequirePermission({ resource: 'workspace', action: 'manage', scope: 'all' })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove a member from the workspace' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace ID' })
  @ApiParam({ name: 'userId', description: 'Target user ID to remove' })
  async removeMember(
    @Param('workspaceId') workspaceId: string,
    @Param('userId') targetUserId: string,
    @Req() req: Request,
  ) {
    const user = (req as any).user;
    return await this.workspaceService.removeMember(workspaceId, targetUserId, user.userId);
  }

  // ─────────────────────────────────────────────
  // INVITE CREATION — Requires workspace JWT
  // ─────────────────────────────────────────────

  @UseGuards(AuthGuard, WorkspaceGuard, RolesGuard, PermissionGuard)
  @ApiBearerAuth('JWT-auth')
  @Post(':workspaceId/invites')
  @RequirePermission({ resource: 'workspace', action: 'manage', scope: 'all' })
  @ApiOperation({ summary: 'Invite a user to the workspace (sends invite email)' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace ID' })
  @ApiBody({ schema: { example: { email: 'newuser@example.com', role: 'USER' } } })
  async createInvite(
    @Param('workspaceId') workspaceId: string,
    @Body() body: { email: string; role: string },
    @Req() req: Request,
  ) {
    const user = (req as any).user;
    return await this.workspaceService.createInvite(
      workspaceId,
      body.email,
      body.role,
      user.userId,
    );
  }

  @UseGuards(AuthGuard, WorkspaceGuard, RolesGuard, PermissionGuard)
  @ApiBearerAuth('JWT-auth')
  @Get(':workspaceId/invites')
  @RequirePermission({ resource: 'workspace', action: 'read', scope: 'all' })
  @ApiOperation({ summary: 'List all invites for the workspace — Owner/Admin only' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace ID' })
  async listInvites(@Param('workspaceId') workspaceId: string) {
    return await this.workspaceService.listInvites(workspaceId);
  }

  @UseGuards(AuthGuard, WorkspaceGuard, RolesGuard, PermissionGuard)
  @ApiBearerAuth('JWT-auth')
  @Delete(':workspaceId/invites/:inviteId')
  @RequirePermission({ resource: 'workspace', action: 'manage', scope: 'all' })
  @ApiOperation({ summary: 'Cancel/Revoke a pending invite — Owner/Admin only' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace ID' })
  @ApiParam({ name: 'inviteId', description: 'Invite ID to cancel' })
  async cancelInvite(
    @Param('workspaceId') workspaceId: string,
    @Param('inviteId') inviteId: string,
  ) {
    return await this.workspaceService.cancelInvite(workspaceId, inviteId);
  }
}
