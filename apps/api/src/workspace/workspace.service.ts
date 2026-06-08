import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from "@nestjs/common";
import { PrismaService } from "../common/services/prisma.service";
import { RedisService } from "../common/services/redis.service";
import { EmailQueueService } from "../common/queues/email/email.queue";
import { BetterAuthService } from "../auth/services/better-auth.service";
import { randomBytes } from "crypto";
import config from "../common/config/app.config";

@Injectable()
export class WorkspaceService {
  private readonly logger = new Logger(WorkspaceService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly emailQueueService: EmailQueueService,
    private readonly betterAuth: BetterAuthService,
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
        authOrganization: {
          include: {
            ssoProviders: true,
          },
        },
        _count: {
          select: { members: { where: { isActive: true } } },
        },
      },
    });

    if (!workspace) throw new NotFoundException("Workspace not found");
    return workspace;
  }

  /**
   * Update workspace name or settings
   */
  async updateWorkspace(
    workspaceId: string,
    data: {
      name?: string;
      settings?: {
        baseCurrency?: string;
        dateFormat?: string;
        timeFormat?: string;
        fiscalYearStart?: string;
        customSettings?: Record<string, any>;
        countryCode?: string;
        weekendHolidays?: number[];
      };
    },
  ): Promise<any> {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
    });
    if (!workspace) throw new NotFoundException("Workspace not found");

    if (data.name) {
      await this.prisma.workspace.update({
        where: { id: workspaceId },
        data: { name: data.name },
      });
    }

    if (data.settings) {
      const {
        baseCurrency,
        dateFormat,
        timeFormat,
        fiscalYearStart,
        customSettings,
        countryCode,
        weekendHolidays,
      } = data.settings;
      const settingsData: Record<string, any> = {};
      if (baseCurrency !== undefined) settingsData.baseCurrency = baseCurrency;
      if (dateFormat !== undefined) settingsData.dateFormat = dateFormat;
      if (timeFormat !== undefined) settingsData.timeFormat = timeFormat;
      if (fiscalYearStart !== undefined)
        settingsData.fiscalYearStart = fiscalYearStart;
      if (customSettings !== undefined)
        settingsData.customSettings = customSettings;
      if (countryCode !== undefined) settingsData.countryCode = countryCode;
      if (weekendHolidays !== undefined) settingsData.weekendHolidays = weekendHolidays;

      const existing = await this.prisma.workspaceSettings.findUnique({
        where: { workspaceId },
      });
      if (existing) {
        await this.prisma.workspaceSettings.update({
          where: { workspaceId },
          data: settingsData,
        });
      } else {
        await this.prisma.workspaceSettings.create({
          data: { workspaceId, ...settingsData },
        });
      }
    }

    return this.getWorkspace(workspaceId);
  }

  /**
   * List all workspaces across the platform — Platform Owner only
   */
  async listAllWorkspaces(): Promise<any[]> {
    const workspaces = await this.prisma.workspace.findMany({
      include: {
        settings: true,
        _count: {
          select: { members: { where: { isActive: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return workspaces.map((ws) => ({
      id: ws.id,
      name: ws.name,
      subdomain: ws.subdomain,
      status: ws.status,
      memberCount: ws._count.members,
      createdAt: ws.createdAt,
      isAuditEnabled: ws.isAuditEnabled,
      settings: ws.settings,
    }));
  }

  /**
   * Enable audit logging for a workspace — irreversible
   */
  async enableAuditLogging(workspaceId: string): Promise<any> {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { id: true, isAuditEnabled: true },
    });
    if (!workspace) throw new NotFoundException("Workspace not found");

    if (workspace.isAuditEnabled) {
      return this.getWorkspace(workspaceId); // Already enabled
    }

    await this.prisma.workspace.update({
      where: { id: workspaceId },
      data: { isAuditEnabled: true },
    });

    return this.getWorkspace(workspaceId);
  }

  /**
   * Update MFA enforcement policy for a workspace
   */
  async updateMfaPolicy(
    workspaceId: string,
    mfaEnforced: boolean,
  ): Promise<any> {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { id: true },
    });
    if (!workspace) throw new NotFoundException("Workspace not found");

    await this.prisma.workspace.update({
      where: { id: workspaceId },
      data: { mfaEnforced },
    });

    return this.getWorkspace(workspaceId);
  }

  // ─────────────────────────────────────────────
  // SSO PROVIDER MANAGEMENT
  // ─────────────────────────────────────────────

  /**
   * List SSO providers for a workspace
   */
  async listSsoProviders(workspaceId: string) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { authOrganizationId: true },
    });

    if (!workspace?.authOrganizationId) {
      return [];
    }

    return this.prisma.authSsoProvider.findMany({
      where: { organizationId: workspace.authOrganizationId },
    });
  }

  /**
   * Add a new SSO provider to a workspace
   */
  async addSsoProvider(
    workspaceId: string,
    data: {
      name: string;
      issuer: string;
      domain: string;
      protocol: "SAML" | "OIDC";
      metadataUrl?: string;
    },
  ) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { authOrganizationId: true },
    });

    if (!workspace) throw new NotFoundException("Workspace not found");

    // Ensure AuthOrg exists
    let orgId = workspace.authOrganizationId;
    if (!orgId) {
      const authOrg = await this.prisma.authOrganization.create({
        data: {
          name: "Organization for " + workspaceId,
          slug: "org-" + workspaceId.slice(0, 8),
        },
      });
      await this.prisma.workspace.update({
        where: { id: workspaceId },
        data: { authOrganizationId: authOrg.id },
      });
      orgId = authOrg.id;
    }

    return this.prisma.authSsoProvider.create({
      data: {
        organizationId: orgId,
        providerId: `${data.protocol.toLowerCase()}-${data.domain.replace(/\./g, '-')}`,
        issuer: data.issuer,
        domain: data.domain,
        metadata: data.name ? JSON.stringify({ name: data.name }) : null,
        oidcConfig:
          data.protocol === "OIDC"
            ? JSON.stringify({ issuer: data.issuer })
            : null,
        samlConfig:
          data.protocol === "SAML"
            ? JSON.stringify({ metadataUrl: data.metadataUrl })
            : null,
      },
    });
  }

  /**
   * Remove an SSO provider
   */
  async removeSsoProvider(workspaceId: string, providerId: string) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { authOrganizationId: true },
    });

    if (!workspace?.authOrganizationId) {
      throw new NotFoundException("SSO provider not found for this workspace");
    }

    return this.prisma.authSsoProvider.deleteMany({
      where: {
        id: providerId,
        organizationId: workspace.authOrganizationId,
      },
    });
  }

  /**
   * Setup a new workspace (used by new users or when creating a secondary workspace)
   */
  async setup(
    userId: string,
    data: {
      name: string;
      subdomain: string;
      industry?: string;
      workspaceSize?: string;
    },
  ) {
    // Check if subdomain is already taken
    const existing = await this.prisma.workspace.findUnique({
      where: { subdomain: data.subdomain },
    });
    if (existing) {
      throw new BadRequestException("Subdomain is already taken");
    }

    return await this.prisma.$transaction(async (tx) => {
      // 1. Create Better Auth Organization first (to get ID)
      const authOrg = await tx.authOrganization.create({
        data: {
          name: data.name,
          slug: data.subdomain,
        },
      });

      // 2. Create Workspace and link to AuthOrg
      const workspace = await tx.workspace.create({
        data: {
          name: data.name,
          subdomain: data.subdomain,
          status: "ACTIVE",
          authOrganizationId: authOrg.id,
        },
      });

      // 3. Create Default Roles for this workspace
      const ownerRole = await tx.role.create({
        data: {
          workspaceId: workspace.id,
          name: "OWNER",
          description: "Full Workspace Access",
        },
      });

      await tx.role.create({
        data: {
          workspaceId: workspace.id,
          name: "ADMIN",
          description: "Administrative Access",
        },
      });

      await tx.role.create({
        data: {
          workspaceId: workspace.id,
          name: "USER",
          description: "Standard User Access",
        },
      });

      // 4. Add Creator as Owner to Workspace
      await tx.workspaceMember.create({
        data: {
          workspaceId: workspace.id,
          userId: userId,
          roleId: ownerRole.id,
        },
      });

      // 5. Add Creator as Owner to Better Auth Organization
      await tx.authMember.create({
        data: {
          organizationId: authOrg.id,
          userId: userId,
          role: "owner",
        },
      });

      // 6. Create Default Settings
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
      orderBy: { joinedAt: "asc" },
    });

    return members.map((m) => ({
      id: m.id,
      userId: m.userId,
      user: {
        id: m.userId,
        email: m.user?.email,
        username: m.user?.username,
        provider: m.user?.provider,
      },
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
      throw new BadRequestException("You cannot change your own role");
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

    if (!caller)
      throw new ForbiddenException("You are not a member of this workspace");
    if (!target) throw new NotFoundException("Target member not found");

    // Only OWNERs can promote/demote — ADMINs cannot change roles
    if (caller.role.name !== "OWNER") {
      throw new ForbiddenException(
        "Only workspace owners can change member roles",
      );
    }

    // Cannot demote another OWNER without transferring first
    if (target.role.name === "OWNER" && newRole !== "OWNER") {
      throw new BadRequestException(
        "Cannot demote another owner. Transfer ownership first.",
      );
    }

    // Find new role id
    const roleRecord = await this.prisma.role.findUnique({
      where: { workspaceId_name: { workspaceId, name: newRole } },
    });

    if (!roleRecord) {
      throw new NotFoundException(
        `Role ${newRole} not found in this workspace`,
      );
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
      throw new BadRequestException(
        "You cannot remove yourself from the workspace",
      );
    }

    const [caller, target] = await Promise.all([
      this.prisma.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId, userId: callerUserId } },
        include: { role: true },
      }),
      this.prisma.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId, userId: targetUserId } },
        include: {
          user: { select: { email: true, username: true } },
          role: true,
        },
      }),
    ]);

    if (!caller)
      throw new ForbiddenException("You are not a member of this workspace");
    if (!target) throw new NotFoundException("Target member not found");

    // OWNERs cannot be removed
    if (target.role.name === "OWNER") {
      throw new ForbiddenException("Workspace owners cannot be removed");
    }

    // ADMINs can only be removed by OWNERs
    if (target.role.name === "ADMIN" && caller.role.name !== "OWNER") {
      throw new ForbiddenException("Only workspace owners can remove admins");
    }

    // Soft-deactivate — preserves history and audit trail
    await this.prisma.workspaceMember.update({
      where: { workspaceId_userId: { workspaceId, userId: targetUserId } },
      data: { isActive: false },
    });

    return {
      success: true,
      message: `${target.user?.username || target.user?.email || "Member"} has been removed from the workspace`,
    };
  }

  // ─────────────────────────────────────────────
  // INVITES
  // ─────────────────────────────────────────────

  /**
   * Generates a new invite for a workspace and sends an invite email
   */
  async createInvite(
    workspaceId: string,
    email: string,
    role: string,
    invitedById: string,
  ) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
    });
    if (!workspace) throw new NotFoundException("Workspace not found");

    // Check if user is already a member
    const existingUser = await this.prisma.authUser.findUnique({
      where: { email },
    });
    if (existingUser) {
      const existingMember = await this.prisma.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId, userId: existingUser.id } },
      });
      if (existingMember?.isActive) {
        throw new BadRequestException(
          "User is already a member of this workspace",
        );
      }
    }

    // Fetch the inviter's info for the email
    const inviter = await this.prisma.authUser.findUnique({
      where: { id: invitedById },
      select: { username: true, email: true },
    });
    const inviterName = inviter?.username || inviter?.email || "A team member";

    // Find role id
    const roleRecord = await this.prisma.role.findUnique({
      where: { workspaceId_name: { workspaceId, name: role } },
    });

    if (!roleRecord) {
      throw new NotFoundException(`Role ${role} not found in this workspace`);
    }

    // Generate a magic link via BetterAuth. The callbackURL embeds the invite
    // details — after magic-link authentication the frontend reads the query
    // params and calls the acceptInvite API. Falls back to a random token if
    // the magic link generation fails (e.g. auth service unavailable).
    const callbackURL = `${config.web_url}/accept-invite?workspaceId=${workspaceId}&email=${encodeURIComponent(email)}`;
    const magicLinkUrl =
      (await this.betterAuth.createMagicLink(email, callbackURL)) ??
      `${config.web_url}/accept-invite?token=${randomBytes(32).toString("hex")}`;

    // Use the last path segment (token) as the stored invite token for tracking
    const inviteToken = magicLinkUrl.split("token=").pop() ?? randomBytes(16).toString("hex");

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
        data: {
          token: inviteToken,
          expiresAt,
          status: "PENDING",
          roleId: roleRecord.id,
          invitedById,
        },
      });
    } else {
      invite = await this.prisma.workspaceInvite.create({
        data: {
          workspaceId,
          email,
          roleId: roleRecord.id,
          token: inviteToken,
          status: "PENDING",
          invitedById,
          expiresAt,
        },
      });
    }

    // Send magic-link invite email (non-blocking)
    try {
      await this.emailQueueService.sendWorkspaceInviteEmail(
        email,
        inviterName,
        workspace.name,
        magicLinkUrl,
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
      orderBy: { createdAt: "desc" },
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
      throw new NotFoundException("Invite not found");
    }

    if (invite.status !== "PENDING") {
      throw new BadRequestException(
        `Cannot cancel invite in ${invite.status} status`,
      );
    }

    return this.prisma.workspaceInvite.update({
      where: { id: inviteId },
      data: { status: "CANCELLED" },
    });
  }

  /**
   * Get pending invites for a specific email
   */
  async getPendingInvites(userId: string) {
    const user = await this.prisma.authUser.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    return this.prisma.workspaceInvite.findMany({
      where: {
        email: user.email,
        status: "PENDING",
        expiresAt: { gt: new Date() },
      },
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
    const invite = await this.prisma.workspaceInvite.findUnique({
      where: { token },
    });
    if (!invite) throw new NotFoundException("Invite not found or invalid");
    if (invite.status !== "PENDING" || invite.expiresAt < new Date()) {
      throw new BadRequestException(
        "Invite has expired or already been processed",
      );
    }

    const user = await this.prisma.authUser.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    // Ensure the invite matches the logged in user's email
    if (invite.email.toLowerCase() !== user.email.toLowerCase()) {
      throw new BadRequestException(
        "This invite is not for your email address",
      );
    }

    // Add to workspace (re-activate if previously removed)
    await this.prisma.$transaction(async (tx) => {
      const existingMember = await tx.workspaceMember.findUnique({
        where: {
          workspaceId_userId: { workspaceId: invite.workspaceId, userId },
        },
      });

      if (existingMember) {
        // Re-activate previously removed member
        await tx.workspaceMember.update({
          where: {
            workspaceId_userId: { workspaceId: invite.workspaceId, userId },
          },
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
        data: { status: "ACCEPTED" },
      });
    });

    const workspace = await this.prisma.workspace.findUnique({
      where: { id: invite.workspaceId },
      select: { id: true, name: true, subdomain: true },
    });

    return { success: true, workspace, message: "Invite accepted" };
  }

  async getMemberByEmail(workspaceId: string, email: string) {
    return await this.prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        user: { email },
      },
      include: {
        user: { select: { id: true, username: true, email: true } },
        role: true,
      },
    });
  }

  /**
   * List all active sessions for members of a workspace
   */
  async listWorkspaceSessions(workspaceId: string) {
    // Step 1: Get all active workspace member user IDs
    const members = await this.prisma.workspaceMember.findMany({
      where: { workspaceId, isActive: true },
      select: {
        userId: true,
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            image: true,
            profile: {
              select: { firstName: true, lastName: true, avatarUrl: true },
            },
          },
        },
      },
    });

    if (members.length === 0) {
      this.logger.debug(`listWorkspaceSessions: no active members found for workspace ${workspaceId}`);
      return [];
    }

    const userIds = members.map((m) => m.userId);
    const userMap = new Map(members.map((m) => [m.userId, m.user]));

    this.logger.debug(`listWorkspaceSessions: found ${members.length} members, fetching sessions...`);

    // Step 2: Get all non-expired sessions for those users
    const sessions = await this.prisma.authSession.findMany({
      where: {
        userId: { in: userIds },
        expiresAt: { gt: new Date() },
      },
      take: 100,
      orderBy: { updatedAt: 'desc' },
    });

    this.logger.debug(`listWorkspaceSessions: found ${sessions.length} active sessions`);

    return sessions.map((s) => {
      const user = userMap.get(s.userId);
      return {
        id: s.id,
        token: s.token,
        expiresAt: s.expiresAt,
        ipAddress: s.ipAddress,
        userAgent: s.userAgent,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
        user: user
          ? {
              id: user.id,
              email: user.email,
              username: user.username,
              image: user.profile?.avatarUrl ?? user.image,
              name: user.profile
                ? `${user.profile.firstName ?? ''} ${user.profile.lastName ?? ''}`.trim() || user.email
                : user.email,
            }
          : null,
      };
    });
  }

  /**
   * Admin: revoke a single session by token — only if it belongs to a workspace member
   */
  async revokeWorkspaceSession(workspaceId: string, sessionToken: string) {
    const session = await this.prisma.authSession.findFirst({
      where: {
        token: sessionToken,
        user: {
          workspaces: { some: { workspaceId, isActive: true } },
        },
      },
      include: { user: { select: { email: true } } },
    });

    if (!session) {
      throw new NotFoundException('Session not found in this workspace');
    }

    // Delete session using Prisma - this deletes it from the database
    await this.prisma.authSession.delete({ where: { id: session.id } });

    // IMPORTANT: Also delete the session token from Redis (Better Auth's secondary storage)
    // This ensures the session is invalidated immediately across all instances
    const redisKey = `session:${sessionToken}`;
    await this.redis.del(redisKey);

    this.logger.log(`Revoked session for ${session.user.email}`);

    return { success: true };
  }

  /**
   * Admin: revoke ALL sessions for workspace members, except the caller's own sessions
   */
  async revokeAllWorkspaceSessions(workspaceId: string, excludeUserId: string) {
    // Get all sessions that will be deleted to clean up Redis
    const sessionsToDelete = await this.prisma.authSession.findMany({
      where: {
        userId: { not: excludeUserId },
        user: {
          workspaces: { some: { workspaceId, isActive: true } },
        },
      },
      select: { token: true },
    });

    // Delete from database
    const result = await this.prisma.authSession.deleteMany({
      where: {
        userId: { not: excludeUserId },
        user: {
          workspaces: { some: { workspaceId, isActive: true } },
        },
      },
    });

    // Clean up Redis cache for each deleted session
    const redisPromises = sessionsToDelete.map(session => 
      this.redis.del(`session:${session.token}`)
    );
    await Promise.all(redisPromises);

    this.logger.log(`Revoked ${result.count} sessions in workspace ${workspaceId}`);

    return { success: true };
  }
}
