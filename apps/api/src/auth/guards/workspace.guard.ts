import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from "@nestjs/common";
import { PrismaService } from "../../common/services/prisma.service";

@Injectable()
export class WorkspaceGuard implements CanActivate {
  constructor(private readonly prismaService: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException("User not authenticated");
    }

    // SUPERADMIN can access any workspace
    if (user.globalRole === "SUPERADMIN") {
      return true;
    }

    // workspaceId MUST come from the verified JWT (set during /auth/select-workspace).
    // Never trust client-controlled headers for authorization decisions.
    const workspaceId = user.workspaceId;

    if (!workspaceId) {
      throw new UnauthorizedException(
        "No workspace selected. Please call /auth/select-workspace first.",
      );
    }

    // Check if user is a member of the workspace
    const membership = await this.prismaService.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: user.userId,
        },
      },
      include: {
        workspace: true,
        role: true,
      },
    });

    if (!membership) {
      throw new UnauthorizedException("User not authenticated or not a member of this workspace");
    }

    // Check if workspace is active
    if (membership.workspace.status !== "ACTIVE") {
      throw new UnauthorizedException("Workspace is not active");
    }

    // Check for MFA enforcement
    // Query DB directly — betterAuthSession is never set on the NestJS request pipeline.
    if (membership.workspace.mfaEnforced) {
      // Check if user has 2FA configured — query DB (reliable source of truth).
      // Note: session-level twoFactorVerified is not in the current AuthSession schema.
      // When a future migration adds that column, restore the session check below.
      const authUser = await this.prismaService.authUser.findUnique({
        where: { id: user.userId },
        select: { twoFactorEnabled: true },
      });

      if (!authUser?.twoFactorEnabled) {
        // User has not set up 2FA yet, but it's required by this workspace.
        // Frontend catches this error code to redirect to /settings/2fa
        throw new UnauthorizedException("MFA_SETUP_REQUIRED");
      }
    }

    // Attach workspace info to request
    request.user.workspaceId = workspaceId;
    request.user.workspaceRole = membership.role.name;
    request.user.department = membership.department;

    return true;
  }
}
