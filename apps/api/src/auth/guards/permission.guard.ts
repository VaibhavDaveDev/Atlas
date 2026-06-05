import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PrismaService } from "../../common/services/prisma.service";
import {
  PERMISSION_KEY,
  PermissionRequirement,
} from "../decorators/require-permission.decorator";

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prismaService: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requirement = this.reflector.getAllAndOverride<PermissionRequirement>(
      PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requirement) {
      // No permission requirement, allow access
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException("User not authenticated");
    }

    // SUPERADMIN bypasses all permission checks
    if (user.globalRole === "SUPERADMIN") {
      return true;
    }

    // OWNER has full access to workspace
    if (user.workspaceRole === "OWNER") {
      return true;
    }

    const { resource, action, scope } = requirement;
    const workspaceId = user.workspaceId;

    // Define scope priority
    const scopePriority = {
      all: 3,
      department: 2,
      own: 1,
    };

    const requiredScopeLevel = scopePriority[scope || "all"] || 3;

    // Check role-based permissions
    const rolePermissions = await this.prismaService.rolePermission.findMany({
      where: {
        workspaceId,
        role: {
          name: user.workspaceRole,
        },
        permission: {
          resource,
          action,
        },
      },
      include: {
        permission: true,
      },
    });

    if (
      rolePermissions.some((rp) => {
        const permissionScopeLevel =
          scopePriority[rp.permission.scope as keyof typeof scopePriority] || 0;
        return permissionScopeLevel >= requiredScopeLevel;
      })
    ) {
      return true;
    }

    // Check user-specific permissions
    const userPermissions = await this.prismaService.userPermission.findMany({
      where: {
        workspaceId,
        userId: user.userId,
        permission: {
          resource,
          action,
        },
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      include: {
        permission: true,
      },
    });

    if (
      userPermissions.some((up) => {
        const permissionScopeLevel =
          scopePriority[up.permission.scope as keyof typeof scopePriority] || 0;
        return permissionScopeLevel >= requiredScopeLevel;
      })
    ) {
      return true;
    }

    throw new ForbiddenException(
      `You don't have permission to ${action} ${resource}`,
    );
  }
}
