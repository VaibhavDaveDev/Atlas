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

  /**
   * Setup a new workspace (used by new users or when creating a secondary workspace)
   */
  async setup(userId: string, data: { name: string; subdomain: string; industry?: string; workspaceSize?: string }) {
    // Check if subdomain is already taken
    const existing = await this.prisma.workspace.findUnique({
      where: { subdomain: data.subdomain },
    });
    if (existing) {
      throw new BadRequestException('Subdomain is already taken');
    }

    return await this.prisma.$transaction(async (tx) => {
      // 1. Create Workspace
      const workspace = await tx.workspace.create({
        data: {
          name: data.name,
          subdomain: data.subdomain,
          status: 'ACTIVE',
        },
      });

      // 2. Create Default Roles for this workspace
      const ownerRole = await tx.role.create({
        data: {
          workspaceId: workspace.id,
          name: 'OWNER',
          description: 'Full Workspace Access',
        },
      });

      await tx.role.create({
        data: {
          workspaceId: workspace.id,
          name: 'ADMIN',
          description: 'Administrative Access',
        },
      });

      await tx.role.create({
        data: {
          workspaceId: workspace.id,
          name: 'USER',
          description: 'Standard User Access',
        },
      });

      // 3. Add Creator as Owner
      await tx.workspaceMember.create({
        data: {
          workspaceId: workspace.id,
          userId: userId,
          roleId: ownerRole.id,
        },
      });

      // 4. Create Default Settings
      await tx.workspaceSettings.create({
        data: {
          workspaceId: workspace.id,
        },
      });

      return { success: true, workspace };
    });
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
        role: true,
      },
      orderBy: { joinedAt: 'asc' },
    });

    return members.map((m) => ({
      id: m.id,
      userId: m.userId,
      email: m.user?.email,
      username: m.user?.username,
      provider: m.user?.provider,
      role: { id: m.role.id, name: m.role.name },
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
        include: { role: true },
      }),
      this.prisma.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId, userId: targetUserId } },
        include: { role: true },
      }),
    ]);

    if (!caller) throw new ForbiddenException('You are not a member of this workspace');
    if (!target) throw new NotFoundException('Target member not found');

    // Only OWNERs can promote/demote — ADMINs cannot change roles
    if (caller.role.name !== 'OWNER') {
      throw new ForbiddenException('Only workspace owners can change member roles');
    }

    // Cannot demote another OWNER without transferring first
    if (target.role.name === 'OWNER' && newRole !== 'OWNER') {
      throw new BadRequestException(
        'Cannot demote another owner. Transfer ownership first.',
      );
    }
    
    // Find new role id
    const roleRecord = await this.prisma.role.findUnique({
      where: { workspaceId_name: { workspaceId, name: newRole } }
    });
    
    if (!roleRecord) {
      throw new NotFoundException(`Role ${newRole} not found in this workspace`);
    }

    return this.prisma.workspaceMember.update({
      where: { workspaceId_userId: { workspaceId, userId: targetUserId } },
      data: { roleId: roleRecord.id },
      include: {
        user: { select: { id: true, email: true, username: true } },
        role: true,
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
        include: { role: true },
      }),
      this.prisma.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId, userId: targetUserId } },
        include: { user: { select: { email: true, username: true } }, role: true },
      }),
    ]);

    if (!caller) throw new ForbiddenException('You are not a member of this workspace');
    if (!target) throw new NotFoundException('Target member not found');

    // OWNERs cannot be removed
    if (target.role.name === 'OWNER') {
      throw new ForbiddenException('Workspace owners cannot be removed');
    }

    // ADMINs can only be removed by OWNERs
    if (target.role.name === 'ADMIN' && caller.role.name !== 'OWNER') {
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

    // Find role id
    const roleRecord = await this.prisma.role.findUnique({
      where: { workspaceId_name: { workspaceId, name: role } }
    });
    
    if (!roleRecord) {
      throw new NotFoundException(`Role ${role} not found in this workspace`);
    }

    let invite;
    if (existingInvite) {
      invite = await this.prisma.workspaceInvite.update({
        where: { id: existingInvite.id },
        data: { token, expiresAt, status: 'PENDING', roleId: roleRecord.id, invitedById },
      });
    } else {
      invite = await this.prisma.workspaceInvite.create({
        data: {
          workspaceId,
          email,
          roleId: roleRecord.id,
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
   * List all invites for a workspace
   */
  async listInvites(workspaceId: string) {
    return this.prisma.workspaceInvite.findMany({
      where: { workspaceId },
      include: {
        role: { select: { name: true } },
        invitedBy: { select: { username: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Cancel/Revoke a pending invite
   */
  async cancelInvite(workspaceId: string, inviteId: string) {
    const invite = await this.prisma.workspaceInvite.findUnique({
      where: { id: inviteId },
    });

    if (!invite || invite.workspaceId !== workspaceId) {
      throw new NotFoundException('Invite not found');
    }

    if (invite.status !== 'PENDING') {
      throw new BadRequestException(`Cannot cancel invite in ${invite.status} status`);
    }

    return this.prisma.workspaceInvite.update({
      where: { id: inviteId },
      data: { status: 'CANCELLED' },
    });
  }

  /**
   * Get pending invites for a specific email
   */
  async getPendingInvites(userId: string) {
    const user = await this.prisma.authUser.findUnique({
      where: { id: userId },
      select: { email: true }
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.workspaceInvite.findMany({
      where: { email: user.email, status: 'PENDING', expiresAt: { gt: new Date() } },
      include: {
        workspace: { select: { name: true, subdomain: true } },
        invitedBy: { select: { email: true, username: true } },
      },
    });
  }

  /**
   * Accept an invite
   */
  async acceptInvite(token: string, userId: string) {
    const invite = await this.prisma.workspaceInvite.findUnique({ where: { token } });
    if (!invite) throw new NotFoundException('Invite not found or invalid');
    if (invite.status !== 'PENDING' || invite.expiresAt < new Date()) {
      throw new BadRequestException('Invite has expired or already been processed');
    }

    const user = await this.prisma.authUser.findUnique({
      where: { id: userId },
      select: { email: true }
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Ensure the invite matches the logged in user's email
    if (invite.email.toLowerCase() !== user.email.toLowerCase()) {
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
          data: { isActive: true, roleId: invite.roleId },
        });
      } else {
        await tx.workspaceMember.create({
          data: {
            workspaceId: invite.workspaceId,
            userId,
            roleId: invite.roleId,
          },
        });
      }

      await tx.workspaceInvite.update({
        where: { id: invite.id },
        data: { status: 'ACCEPTED' },
      });
    });

    const workspace = await this.prisma.workspace.findUnique({
      where: { id: invite.workspaceId },
      select: { id: true, name: true, subdomain: true },
    });

    return { success: true, workspace, message: 'Invite accepted' };
  }

  async getMemberByEmail(workspaceId: string, email: string) {
    return await this.prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        user: { email },
      },
      include: { user: { select: { id: true, username: true, email: true } }, role: true },
    });
  }
}
