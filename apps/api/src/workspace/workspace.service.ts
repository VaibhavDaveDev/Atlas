import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import { EmailQueueService } from '../common/queues/email/email.queue';
import { randomBytes } from 'crypto';
import config from '../common/config/app.config';

@Injectable()
export class WorkspaceService {
  private readonly logger = new Logger(WorkspaceService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailQueueService: EmailQueueService,
  ) {}

  // ─────────────────────────────────────────────
  // WORKSPACE INFO & SETTINGS
  // ─────────────────────────────────────────────

  /**
   * Get workspace details and settings
   */
  async getWorkspace(workspaceId: string): Promise<any> {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        settings: true,
        _count: {
          select: { members: { where: { isActive: true } } },
        },
      },
    });

    if (!workspace) throw new NotFoundException('Workspace not found');
    return workspace;
  }

  /**
   * Update workspace name or settings
   */
  async updateWorkspace(workspaceId: string, data: {
    name?: string;
    settings?: {
      baseCurrency?: string;
      dateFormat?: string;
      timeFormat?: string;
      fiscalYearStart?: string;
      customSettings?: Record<string, any>;
    };
  }): Promise<any> {
    const workspace = await this.prisma.workspace.findUnique({ where: { id: workspaceId } });
    if (!workspace) throw new NotFoundException('Workspace not found');

    if (data.name) {
      await this.prisma.workspace.update({
        where: { id: workspaceId },
        data: { name: data.name },
      });
    }

    if (data.settings) {
      const { baseCurrency, dateFormat, timeFormat, fiscalYearStart, customSettings } = data.settings;
      const settingsData: Record<string, any> = {};
      if (baseCurrency !== undefined) settingsData.baseCurrency = baseCurrency;
      if (dateFormat !== undefined) settingsData.dateFormat = dateFormat;
      if (timeFormat !== undefined) settingsData.timeFormat = timeFormat;
      if (fiscalYearStart !== undefined) settingsData.fiscalYearStart = fiscalYearStart;
      if (customSettings !== undefined) settingsData.customSettings = customSettings;

      const existing = await this.prisma.workspaceSettings.findUnique({ where: { workspaceId } });
      if (existing) {
        await this.prisma.workspaceSettings.update({ where: { workspaceId }, data: settingsData });
      } else {
        await this.prisma.workspaceSettings.create({ data: { workspaceId, ...settingsData } });
      }
    }

    return this.getWorkspace(workspaceId);
  }

  // ─────────────────────────────────────────────
  // MEMBER MANAGEMENT
  // ─────────────────────────────────────────────

  /**
   * List all active members of a workspace
   */
  async listMembers(workspaceId: string) {
    const members = await this.prisma.workspaceMember.findMany({
      where: { workspaceId, isActive: true },
      include: {
        user: {
          select: { id: true, email: true, username: true, provider: true },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });

    return members.map((m) => ({
      id: m.id,
      userId: m.userId,
      email: m.user?.email,
      username: m.user?.username,
      provider: m.user?.provider,
      role: m.role,
      department: m.department,
      joinedAt: m.joinedAt,
      lastAccessAt: m.lastAccessAt,
    }));
  }

  /**
   * Change a member's role — caller must be OWNER, and cannot downgrade another OWNER
   */
  async changeMemberRole(
    workspaceId: string,
    targetUserId: string,
    newRole: string,
    callerUserId: string,
  ) {
    if (callerUserId === targetUserId) {
      throw new BadRequestException('You cannot change your own role');
    }

    const [caller, target] = await Promise.all([
      this.prisma.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId, userId: callerUserId } },
      }),
      this.prisma.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId, userId: targetUserId } },
      }),
    ]);

    if (!caller) throw new ForbiddenException('You are not a member of this workspace');
    if (!target) throw new NotFoundException('Target member not found');

    // Only OWNERs can promote/demote — ADMINs cannot change roles
    if (caller.role !== 'OWNER') {
      throw new ForbiddenException('Only workspace owners can change member roles');
    }

    // Cannot demote another OWNER without transferring first
    if (target.role === 'OWNER' && newRole !== 'OWNER') {
      throw new BadRequestException(
        'Cannot demote another owner. Transfer ownership first.',
      );
    }

    return this.prisma.workspaceMember.update({
      where: { workspaceId_userId: { workspaceId, userId: targetUserId } },
      data: { role: newRole as any },
      include: {
        user: { select: { id: true, email: true, username: true } },
      },
    });
  }

  /**
   * Remove a member from a workspace (soft-deactivate)
   * Caller must be OWNER or ADMIN; cannot remove an OWNER
   */
  async removeMember(
    workspaceId: string,
    targetUserId: string,
    callerUserId: string,
  ) {
    if (callerUserId === targetUserId) {
      throw new BadRequestException('You cannot remove yourself from the workspace');
    }

    const [caller, target] = await Promise.all([
      this.prisma.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId, userId: callerUserId } },
      }),
      this.prisma.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId, userId: targetUserId } },
        include: { user: { select: { email: true, username: true } } },
      }),
    ]);

    if (!caller) throw new ForbiddenException('You are not a member of this workspace');
    if (!target) throw new NotFoundException('Target member not found');

    // OWNERs cannot be removed
    if (target.role === 'OWNER') {
      throw new ForbiddenException('Workspace owners cannot be removed');
    }

    // ADMINs can only be removed by OWNERs
    if (target.role === 'ADMIN' && caller.role !== 'OWNER') {
      throw new ForbiddenException('Only workspace owners can remove admins');
    }

    // Soft-deactivate — preserves history and audit trail
    await this.prisma.workspaceMember.update({
      where: { workspaceId_userId: { workspaceId, userId: targetUserId } },
      data: { isActive: false },
    });

    return {
      success: true,
      message: `${target.user?.username || target.user?.email || 'Member'} has been removed from the workspace`,
    };
  }

  // ─────────────────────────────────────────────
  // INVITES
  // ─────────────────────────────────────────────

  /**
   * Generates a new invite for a workspace and sends an invite email
   */
  async createInvite(workspaceId: string, email: string, role: string, invitedById: string) {
    const workspace = await this.prisma.workspace.findUnique({ where: { id: workspaceId } });
    if (!workspace) throw new NotFoundException('Workspace not found');

    // Check if user is already a member
    const existingUser = await this.prisma.authUser.findUnique({ where: { email } });
    if (existingUser) {
      const existingMember = await this.prisma.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId, userId: existingUser.id } },
      });
      if (existingMember?.isActive) {
        throw new BadRequestException('User is already a member of this workspace');
      }
    }

    // Fetch the inviter's info for the email
    const inviter = await this.prisma.authUser.findUnique({
      where: { id: invitedById },
      select: { username: true, email: true },
    });
    const inviterName = inviter?.username || inviter?.email || 'A team member';

    // Generate a secure token
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    // Check if there is already a pending invite, update it if so
    const existingInvite = await this.prisma.workspaceInvite.findFirst({
      where: { workspaceId, email },
    });

    let invite;
    if (existingInvite) {
      invite = await this.prisma.workspaceInvite.update({
        where: { id: existingInvite.id },
        data: { token, expiresAt, status: 'PENDING', role: role as any, invitedById },
      });
    } else {
      invite = await this.prisma.workspaceInvite.create({
        data: {
          workspaceId,
          email,
          role: role as any,
          token,
          status: 'PENDING',
          invitedById,
          expiresAt,
        },
      });
    }

    // Send invite email (non-blocking — log on failure but don't throw)
    try {
      await this.emailQueueService.sendWorkspaceInviteEmail(
        email,
        inviterName,
        workspace.name,
        token,
        config.web_url,
      );
    } catch (error) {
      this.logger.error(
        `Failed to queue invite email for ${email} to workspace ${workspace.name}`,
        error instanceof Error ? error.stack : String(error),
      );
    }

    return invite;
  }

  /**
   * Get pending invites for a specific email
   */
  async getPendingInvitesByEmail(email: string) {
    return this.prisma.workspaceInvite.findMany({
      where: { email, status: 'PENDING', expiresAt: { gt: new Date() } },
      include: {
        workspace: { select: { name: true, subdomain: true } },
        invitedBy: { select: { email: true, username: true } },
      },
    });
  }

  /**
   * Accept an invite
   */
  async acceptInvite(token: string, userId: string, userEmail: string) {
    const invite = await this.prisma.workspaceInvite.findUnique({ where: { token } });
    if (!invite) throw new NotFoundException('Invite not found or invalid');
    if (invite.status !== 'PENDING' || invite.expiresAt < new Date()) {
      throw new BadRequestException('Invite has expired or already been processed');
    }

    // Ensure the invite matches the logged in user's email
    if (invite.email.toLowerCase() !== userEmail.toLowerCase()) {
      throw new BadRequestException('This invite is not for your email address');
    }

    // Add to workspace (re-activate if previously removed)
    await this.prisma.$transaction(async (tx) => {
      const existingMember = await tx.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId: invite.workspaceId, userId } },
      });

      if (existingMember) {
        // Re-activate previously removed member
        await tx.workspaceMember.update({
          where: { workspaceId_userId: { workspaceId: invite.workspaceId, userId } },
          data: { isActive: true, role: invite.role },
        });
      } else {
        await tx.workspaceMember.create({
          data: {
            workspaceId: invite.workspaceId,
            userId,
            role: invite.role,
          },
        });
      }

      await tx.workspaceInvite.update({
        where: { id: invite.id },
        data: { status: 'ACCEPTED' },
      });
    });

    return { success: true, workspaceId: invite.workspaceId, message: 'Invite accepted' };
  }

  async getMemberByEmail(workspaceId: string, email: string) {
    return await this.prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        user: { email },
      },
      include: { user: { select: { id: true, username: true, email: true } } },
    });
  }
}
