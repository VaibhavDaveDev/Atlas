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
    // We only enforce if the workspace policy is active AND the user is not already verified via MFA
    // Better Auth 'session' object (if present) tells us if the current session is MFA-verified.
    if (membership.workspace.mfaEnforced) {
      const session = (request as any).betterAuthSession;

      // If the user has 2FA enabled but the session is not MFA-verified, 
      // Better Auth would usually handle the challenge, but we double-check here.
      // If the user hasn't even SET UP 2FA, they must be forced to setup page.
      const isMfaVerified = session?.session?.authFlags?.includes('mfa') || false;
      const hasTwoFactorEnabled = (session?.user as any)?.twoFactorEnabled || false;

      if (!hasTwoFactorEnabled) {
        // User has not set up 2FA yet, but it's required.
        // We throw a specific error that the frontend can catch to redirect to /settings/2fa
        throw new UnauthorizedException("MFA_SETUP_REQUIRED");
      }

      if (!isMfaVerified) {
        // User HAS enabled it, but this specific session isn't verified.
        // Better Auth should have handled this during sign-in, but this is a safety net.
        throw new UnauthorizedException("MFA_VERIFICATION_REQUIRED");
      }
    }

    // Attach workspace info to request
    request.user.workspaceId = workspaceId;
    request.user.workspaceRole = membership.role.name;
    request.user.department = membership.department;

    return true;
    }
    }

