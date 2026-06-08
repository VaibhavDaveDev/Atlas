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
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiCookieAuth,
  ApiBody,
  ApiParam,
} from "@nestjs/swagger";
import { WorkspaceService } from "./workspace.service";
import { AuthGuard } from "../common/guards/auth.guard";
import { WorkspaceGuard } from "../auth/guards/workspace.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { PermissionGuard } from "../auth/guards/permission.guard";
import { RequirePermission } from "../auth/decorators/require-permission.decorator";
import type { Request } from "express";

@ApiTags("workspaces")
@Controller("workspaces")
export class WorkspaceController {
  constructor(private readonly workspaceService: WorkspaceService) {}

  // ─────────────────────────────────────────────
  // INVITES — No workspace JWT required (pre-select flow)
  // ─────────────────────────────────────────────

  @UseGuards(AuthGuard)
  @ApiCookieAuth("better-auth-cookie")
  @Get("invites/pending")
  @ApiOperation({
    summary: "Get pending invites for the current user (by email)",
  })
  async getPendingInvites(@Req() req: Request) {
    const user = (req as any).user;
    return await this.workspaceService.getPendingInvites(user.userId);
  }

  @UseGuards(AuthGuard)
  @ApiCookieAuth("better-auth-cookie")
  @Post("invites/:token/accept")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Accept a workspace invite by token" })
  @ApiParam({ name: "token", description: "Invite token from email link" })
  async acceptInvite(@Param("token") token: string, @Req() req: Request) {
    const user = (req as any).user;
    return await this.workspaceService.acceptInvite(token, user.userId);
  }

  @UseGuards(AuthGuard)
  @ApiCookieAuth("better-auth-cookie")
  @Post("setup")
  @ApiOperation({ summary: "Setup a new workspace" })
  @ApiBody({
    schema: {
      example: {
        name: "Acme Corp",
        subdomain: "acme",
        industry: "Technology",
        workspaceSize: "1-10",
      },
    },
  })
  async setup(
    @Body()
    body: {
      name: string;
      subdomain: string;
      industry?: string;
      workspaceSize?: string;
    },
    @Req() req: Request,
  ) {
    const user = (req as any).user;
    return await this.workspaceService.setup(user.userId, body);
  }

  // ─────────────────────────────────────────────
  // PLATFORM OWNER — Global admin only, no workspace JWT needed
  // ─────────────────────────────────────────────

  @UseGuards(AuthGuard)
  @ApiCookieAuth("better-auth-cookie")
  @Get("platform/all")
  @ApiOperation({ summary: "List all workspaces — Platform Owner only" })
  async listAllWorkspaces(@Req() req: Request) {
    const user = (req as any).user;
    if (user?.globalRole !== "admin") {
      throw new (await import("@nestjs/common")).ForbiddenException(
        "Platform Owner access required",
      );
    }
    return await this.workspaceService.listAllWorkspaces();
  }

  @UseGuards(AuthGuard)
  @ApiCookieAuth("better-auth-cookie")
  @Post("platform/create")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary:
      "Create a new workspace and optionally invite an IT Admin — Platform Owner only",
  })
  @ApiBody({
    schema: {
      example: {
        name: "Acme Corp",
        subdomain: "acme",
        adminEmail: "itadmin@acme.com",
      },
    },
  })
  async createWorkspaceForPlatform(
    @Body() body: { name: string; subdomain: string; adminEmail?: string },
    @Req() req: Request,
  ) {
    const user = (req as any).user;
    if (user?.globalRole !== "admin") {
      throw new (await import("@nestjs/common")).ForbiddenException(
        "Platform Owner access required",
      );
    }
    // Create the workspace (Platform Owner is initial OWNER)
    const result = await this.workspaceService.setup(user.userId, {
      name: body.name,
      subdomain: body.subdomain,
    });

    // If adminEmail is provided, send an ADMIN invite
    if (body.adminEmail && result.workspace) {
      await this.workspaceService.createInvite(
        result.workspace.id,
        body.adminEmail,
        "ADMIN",
        user.userId,
      );
    }

    return {
      success: true,
      workspace: result.workspace,
      inviteSent: !!body.adminEmail,
    };
  }

  // ─────────────────────────────────────────────
  // WORKSPACE INFO & SETTINGS — Requires workspace JWT
  // ─────────────────────────────────────────────

  @UseGuards(AuthGuard, WorkspaceGuard, RolesGuard, PermissionGuard)
  @ApiCookieAuth("better-auth-cookie")
  @Get(":workspaceId")
  @RequirePermission({ resource: "workspace", action: "read", scope: "all" })
  @ApiOperation({ summary: "Get workspace details and settings" })
  @ApiParam({ name: "workspaceId", description: "Workspace ID" })
  async getWorkspace(@Param("workspaceId") workspaceId: string): Promise<any> {
    return await this.workspaceService.getWorkspace(workspaceId);
  }

  @UseGuards(AuthGuard, WorkspaceGuard, RolesGuard, PermissionGuard)
  @ApiCookieAuth("better-auth-cookie")
  @Get(":workspaceId/settings")
  @RequirePermission({ resource: "workspace", action: "read", scope: "all" })
  @ApiOperation({ summary: "Get workspace settings" })
  @ApiParam({ name: "workspaceId", description: "Workspace ID" })
  async getWorkspaceSettings(@Param("workspaceId") workspaceId: string): Promise<any> {
    const workspace = await this.workspaceService.getWorkspace(workspaceId);
    return workspace.settings || {};
  }

  @UseGuards(AuthGuard, WorkspaceGuard, RolesGuard, PermissionGuard)
  @ApiCookieAuth("better-auth-cookie")
  @Patch(":workspaceId/settings")
  @RequirePermission({ resource: "workspace", action: "update", scope: "all" })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Update workspace settings" })
  @ApiParam({ name: "workspaceId", description: "Workspace ID" })
  @ApiBody({
    schema: {
      example: {
        baseCurrency: "INR",
        dateFormat: "DD/MM/YYYY",
        timeFormat: "HH:mm",
        fiscalYearStart: "04-01",
        region: "india",
      },
    },
  })
  async updateWorkspaceSettings(
    @Param("workspaceId") workspaceId: string,
    @Body() body: Record<string, any>,
  ): Promise<any> {
    return await this.workspaceService.updateWorkspace(workspaceId, { settings: body });
  }

  @UseGuards(AuthGuard, WorkspaceGuard, RolesGuard, PermissionGuard)
  @ApiCookieAuth("better-auth-cookie")
  @Patch(":workspaceId")
  @RequirePermission({ resource: "workspace", action: "update", scope: "all" })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Update workspace name and/or settings" })
  @ApiParam({ name: "workspaceId", description: "Workspace ID" })
  @ApiBody({
    schema: {
      example: {
        name: "Acme Corp",
        settings: {
          baseCurrency: "INR",
          dateFormat: "DD/MM/YYYY",
          timeFormat: "HH:mm",
          fiscalYearStart: "04-01",
        },
      },
    },
  })
  async updateWorkspace(
    @Param("workspaceId") workspaceId: string,
    @Body() body: { name?: string; settings?: Record<string, any> },
  ): Promise<any> {
    return await this.workspaceService.updateWorkspace(workspaceId, body);
  }

  @UseGuards(AuthGuard, WorkspaceGuard, RolesGuard, PermissionGuard)
  @ApiCookieAuth("better-auth-cookie")
  @Post(":workspaceId/audit/enable")
  @RequirePermission({ resource: "workspace", action: "update", scope: "all" })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Enable audit logging for a workspace — irreversible",
  })
  @ApiParam({ name: "workspaceId", description: "Workspace ID" })
  async enableAuditLogging(
    @Param("workspaceId") workspaceId: string,
  ): Promise<any> {
    return await this.workspaceService.enableAuditLogging(workspaceId);
  }

  @UseGuards(AuthGuard, WorkspaceGuard, RolesGuard, PermissionGuard)
  @ApiCookieAuth("better-auth-cookie")
  @Patch(":workspaceId/mfa-policy")
  @RequirePermission({ resource: "workspace", action: "update", scope: "all" })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Update MFA enforcement policy for a workspace",
  })
  @ApiParam({ name: "workspaceId", description: "Workspace ID" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        mfaEnforced: { type: "boolean" },
      },
    },
  })
  async updateMfaPolicy(
    @Param("workspaceId") workspaceId: string,
    @Body("mfaEnforced") mfaEnforced: boolean,
  ): Promise<any> {
    return await this.workspaceService.updateMfaPolicy(
      workspaceId,
      mfaEnforced,
    );
  }

  // ─────────────────────────────────────────────
  // SSO PROVIDERS
  // ─────────────────────────────────────────────

  @UseGuards(AuthGuard, WorkspaceGuard, RolesGuard, PermissionGuard)
  @ApiCookieAuth("better-auth-cookie")
  @Get(":workspaceId/sso-providers")
  @RequirePermission({ resource: "workspace", action: "read", scope: "all" })
  @ApiOperation({ summary: "List SSO providers for a workspace" })
  async listSsoProviders(@Param("workspaceId") workspaceId: string) {
    return await this.workspaceService.listSsoProviders(workspaceId);
  }

  @UseGuards(AuthGuard, WorkspaceGuard, RolesGuard, PermissionGuard)
  @ApiCookieAuth("better-auth-cookie")
  @Get(":workspaceId/sessions")
  @RequirePermission({ resource: "workspace", action: "read", scope: "all" })
  @ApiOperation({ summary: "List active sessions for all workspace members" })
  async listWorkspaceSessions(@Param("workspaceId") workspaceId: string) {
    return await this.workspaceService.listWorkspaceSessions(workspaceId);
  }

  @UseGuards(AuthGuard, WorkspaceGuard, RolesGuard, PermissionGuard)
  @ApiCookieAuth("better-auth-cookie")
  @Delete(":workspaceId/sessions/:sessionToken")
  @RequirePermission({ resource: "workspace", action: "manage", scope: "all" })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Admin: revoke a single workspace member session" })
  @ApiParam({ name: "workspaceId", description: "Workspace ID" })
  @ApiParam({ name: "sessionToken", description: "Session token to revoke" })
  async revokeWorkspaceSession(
    @Param("workspaceId") workspaceId: string,
    @Param("sessionToken") sessionToken: string,
  ) {
    return await this.workspaceService.revokeWorkspaceSession(workspaceId, sessionToken);
  }

  @UseGuards(AuthGuard, WorkspaceGuard, RolesGuard, PermissionGuard)
  @ApiCookieAuth("better-auth-cookie")
  @Delete(":workspaceId/sessions")
  @RequirePermission({ resource: "workspace", action: "manage", scope: "all" })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Admin: revoke all workspace sessions except caller's" })
  @ApiParam({ name: "workspaceId", description: "Workspace ID" })
  async revokeAllWorkspaceSessions(
    @Param("workspaceId") workspaceId: string,
    @Req() req: Request,
  ) {
    const currentUser = (req as any).user;
    return await this.workspaceService.revokeAllWorkspaceSessions(workspaceId, currentUser.userId);
  }

  @UseGuards(AuthGuard, WorkspaceGuard, RolesGuard, PermissionGuard)
  @ApiCookieAuth("better-auth-cookie")
  @Post(":workspaceId/sso-providers")
  @RequirePermission({ resource: "workspace", action: "update", scope: "all" })
  @ApiOperation({ summary: "Add a new SSO provider to a workspace" })
  async addSsoProvider(
    @Param("workspaceId") workspaceId: string,
    @Body()
    body: {
      name: string;
      issuer: string;
      domain: string;
      protocol: "SAML" | "OIDC";
      metadataUrl?: string;
    },
  ) {
    return await this.workspaceService.addSsoProvider(workspaceId, body);
  }

  @UseGuards(AuthGuard, WorkspaceGuard, RolesGuard, PermissionGuard)
  @ApiCookieAuth("better-auth-cookie")
  @Delete(":workspaceId/sso-providers/:providerId")
  @RequirePermission({ resource: "workspace", action: "update", scope: "all" })
  @ApiOperation({ summary: "Remove an SSO provider" })
  async removeSsoProvider(
    @Param("workspaceId") workspaceId: string,
    @Param("providerId") providerId: string,
  ) {
    return await this.workspaceService.removeSsoProvider(
      workspaceId,
      providerId,
    );
  }

  // ─────────────────────────────────────────────
  // MEMBER MANAGEMENT — Requires workspace JWT
  // ─────────────────────────────────────────────

  @UseGuards(AuthGuard, WorkspaceGuard, RolesGuard, PermissionGuard)
  @ApiCookieAuth("better-auth-cookie")
  @Get(":workspaceId/members")
  @RequirePermission({ resource: "workspace", action: "read", scope: "all" })
  @ApiOperation({ summary: "List all active members of a workspace" })
  @ApiParam({ name: "workspaceId", description: "Workspace ID" })
  async listMembers(@Param("workspaceId") workspaceId: string) {
    return await this.workspaceService.listMembers(workspaceId);
  }

  @UseGuards(AuthGuard, WorkspaceGuard, RolesGuard, PermissionGuard)
  @ApiCookieAuth("better-auth-cookie")
  @Get(":workspaceId/members/check/:email")
  @RequirePermission({ resource: "workspace", action: "read", scope: "all" })
  @ApiOperation({ summary: "Check if a user is already a member by email" })
  async checkMember(
    @Param("workspaceId") workspaceId: string,
    @Param("email") email: string,
  ) {
    const member = await this.workspaceService.getMemberByEmail(
      workspaceId,
      email,
    );
    if (!member) return { isMember: false };
    return {
      isMember: true,
      role: member.role,
      username: member.user?.username,
    };
  }

  @UseGuards(AuthGuard, WorkspaceGuard, RolesGuard, PermissionGuard)
  @ApiCookieAuth("better-auth-cookie")
  @Patch(":workspaceId/members/:userId/role")
  @RequirePermission({ resource: "workspace", action: "manage", scope: "all" })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Change a member's role" })
  @ApiParam({ name: "workspaceId", description: "Workspace ID" })
  @ApiParam({ name: "userId", description: "Target user ID" })
  @ApiBody({ schema: { example: { role: "ADMIN" } } })
  async changeMemberRole(
    @Param("workspaceId") workspaceId: string,
    @Param("userId") targetUserId: string,
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
  @ApiCookieAuth("better-auth-cookie")
  @Delete(":workspaceId/members/:userId")
  @RequirePermission({ resource: "workspace", action: "manage", scope: "all" })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Remove a member from the workspace" })
  @ApiParam({ name: "workspaceId", description: "Workspace ID" })
  @ApiParam({ name: "userId", description: "Target user ID to remove" })
  async removeMember(
    @Param("workspaceId") workspaceId: string,
    @Param("userId") targetUserId: string,
    @Req() req: Request,
  ) {
    const user = (req as any).user;
    return await this.workspaceService.removeMember(
      workspaceId,
      targetUserId,
      user.userId,
    );
  }

  // ─────────────────────────────────────────────
  // INVITE CREATION — Requires workspace JWT
  // ─────────────────────────────────────────────

  @UseGuards(AuthGuard, WorkspaceGuard, RolesGuard, PermissionGuard)
  @ApiCookieAuth("better-auth-cookie")
  @Post(":workspaceId/invites")
  @RequirePermission({ resource: "workspace", action: "manage", scope: "all" })
  @ApiOperation({
    summary: "Invite a user to the workspace (sends invite email)",
  })
  @ApiParam({ name: "workspaceId", description: "Workspace ID" })
  @ApiBody({
    schema: { example: { email: "newuser@example.com", role: "USER" } },
  })
  async createInvite(
    @Param("workspaceId") workspaceId: string,
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
  @ApiCookieAuth("better-auth-cookie")
  @Get(":workspaceId/invites")
  @RequirePermission({ resource: "workspace", action: "read", scope: "all" })
  @ApiOperation({
    summary: "List all invites for the workspace — Owner/Admin only",
  })
  @ApiParam({ name: "workspaceId", description: "Workspace ID" })
  async listInvites(@Param("workspaceId") workspaceId: string) {
    return await this.workspaceService.listInvites(workspaceId);
  }

  @UseGuards(AuthGuard, WorkspaceGuard, RolesGuard, PermissionGuard)
  @ApiCookieAuth("better-auth-cookie")
  @Delete(":workspaceId/invites/:inviteId")
  @RequirePermission({ resource: "workspace", action: "manage", scope: "all" })
  @ApiOperation({
    summary: "Cancel/Revoke a pending invite — Owner/Admin only",
  })
  @ApiParam({ name: "workspaceId", description: "Workspace ID" })
  @ApiParam({ name: "inviteId", description: "Invite ID to cancel" })
  async cancelInvite(
    @Param("workspaceId") workspaceId: string,
    @Param("inviteId") inviteId: string,
  ) {
    return await this.workspaceService.cancelInvite(workspaceId, inviteId);
  }
}
