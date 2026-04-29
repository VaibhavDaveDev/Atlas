import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WorkspaceService } from './workspace.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { WorkspaceGuard } from '../auth/guards/workspace.guard';
import type { Request } from 'express';

@ApiTags('workspaces')
@Controller('workspaces')
export class WorkspaceController {
  constructor(private readonly workspaceService: WorkspaceService) {}

  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Get('invites/pending')
  @ApiOperation({ summary: 'Get pending invites for current user' })
  async getPendingInvites(@Req() req: Request) {
    const user = (req as any).user;
    const invites = await this.workspaceService.getPendingInvitesByEmail(user.email);
    return { success: true, data: invites };
  }

  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Post('invites/:token/accept')
  @ApiOperation({ summary: 'Accept a workspace invite' })
  async acceptInvite(@Param('token') token: string, @Req() req: Request) {
    const user = (req as any).user;
    return await this.workspaceService.acceptInvite(token, user.userId, user.email);
  }

  // Admin routes for inviting users
  @UseGuards(AuthGuard, WorkspaceGuard)
  @ApiBearerAuth('JWT-auth')
  @Post(':workspaceId/invites')
  @ApiOperation({ summary: 'Invite a user to the workspace' })
  async createInvite(
    @Param('workspaceId') workspaceId: string,
    @Body() body: { email: string; role: string },
    @Req() req: Request,
  ) {
    const user = (req as any).user;
    // Basic check: must be Admin or Owner to invite
    if (user.workspaceRole !== 'OWNER' && user.workspaceRole !== 'ADMIN') {
      return { success: false, message: 'Only Owners and Admins can invite users' };
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
