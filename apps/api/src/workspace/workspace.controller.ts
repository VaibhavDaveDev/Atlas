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
  ForbiddenException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody, ApiParam } from '@nestjs/swagger';
import { WorkspaceService } from './workspace.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { WorkspaceGuard } from '../auth/guards/workspace.guard';
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
    const invites = await this.workspaceService.getPendingInvitesByEmail(user.email);
    return { success: true, data: invites };
  }

  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Post('invites/:token/accept')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Accept a workspace invite by token' })
  @ApiParam({ name: 'token', description: 'Invite token from email link' })
  async acceptInvite(@Param('token') token: string, @Req() req: Request) {
    const user = (req as any).user;
    return await this.workspaceService.acceptInvite(token, user.userId, user.email);
  }

  // ─────────────────────────────────────────────
  // WORKSPACE INFO & SETTINGS — Requires workspace JWT
  // ─────────────────────────────────────────────

  @UseGuards(AuthGuard, WorkspaceGuard)
  @ApiBearerAuth('JWT-auth')
  @Get(':workspaceId')
  @ApiOperation({ summary: 'Get workspace details and settings' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace ID' })
  async getWorkspace(@Param('workspaceId') workspaceId: string): Promise<any> {
    return await this.workspaceService.getWorkspace(workspaceId);
  }

  @UseGuards(AuthGuard, WorkspaceGuard)
  @ApiBearerAuth('JWT-auth')
  @Patch(':workspaceId')
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
    @Req() req: Request,
  ): Promise<any> {
    const user = (req as any).user;
    if (user.workspaceRole !== 'OWNER' && user.workspaceRole !== 'ADMIN') {
      throw new ForbiddenException('Only Owners and Admins can update workspace settings');
    }
    return await this.workspaceService.updateWorkspace(workspaceId, body);
  }

  // ─────────────────────────────────────────────
  // MEMBER MANAGEMENT — Requires workspace JWT
  // ─────────────────────────────────────────────

  @UseGuards(AuthGuard, WorkspaceGuard)
  @ApiBearerAuth('JWT-auth')
  @Get(':workspaceId/members')
  @ApiOperation({ summary: 'List all active members of a workspace' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace ID' })
  async listMembers(@Param('workspaceId') workspaceId: string) {
    return await this.workspaceService.listMembers(workspaceId);
  }

  @UseGuards(AuthGuard, WorkspaceGuard)
  @ApiBearerAuth('JWT-auth')
  @Get(':workspaceId/members/check/:email')
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

  @UseGuards(AuthGuard, WorkspaceGuard)
  @ApiBearerAuth('JWT-auth')
  @Patch(':workspaceId/members/:userId/role')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change a member\'s role — Owner only' })
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
    const updated = await this.workspaceService.changeMemberRole(
      workspaceId,
      targetUserId,
      body.role,
      user.userId,
    );
    return { success: true, message: 'Member role updated', data: updated };
  }

  @UseGuards(AuthGuard, WorkspaceGuard)
  @ApiBearerAuth('JWT-auth')
  @Delete(':workspaceId/members/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove a member from the workspace — Owner/Admin only' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace ID' })
  @ApiParam({ name: 'userId', description: 'Target user ID to remove' })
  async removeMember(
    @Param('workspaceId') workspaceId: string,
    @Param('userId') targetUserId: string,
    @Req() req: Request,
  ) {
    const user = (req as any).user;

    // Admins can remove regular users; only Owners can remove Admins
    if (user.workspaceRole !== 'OWNER' && user.workspaceRole !== 'ADMIN') {
      throw new ForbiddenException('Only Owners and Admins can remove members');
    }

    return await this.workspaceService.removeMember(workspaceId, targetUserId, user.userId);
  }

  // ─────────────────────────────────────────────
  // INVITE CREATION — Requires workspace JWT
  // ─────────────────────────────────────────────

  @UseGuards(AuthGuard, WorkspaceGuard)
  @ApiBearerAuth('JWT-auth')
  @Post(':workspaceId/invites')
  @ApiOperation({ summary: 'Invite a user to the workspace (sends invite email)' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace ID' })
  @ApiBody({ schema: { example: { email: 'newuser@example.com', role: 'USER' } } })
  async createInvite(
    @Param('workspaceId') workspaceId: string,
    @Body() body: { email: string; role: string },
    @Req() req: Request,
  ) {
    const user = (req as any).user;
    if (user.workspaceRole !== 'OWNER' && user.workspaceRole !== 'ADMIN') {
      throw new ForbiddenException('Only Owners and Admins can invite users');
    }

    const invite = await this.workspaceService.createInvite(
      workspaceId,
      body.email,
      body.role,
      user.userId,
    );
    return { success: true, message: 'Invite sent successfully', data: invite };
  }
}
