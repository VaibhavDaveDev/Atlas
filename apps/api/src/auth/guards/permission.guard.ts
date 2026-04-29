import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../common/services/prisma.service';
import {
  PERMISSION_KEY,
  PermissionRequirement,
} from '../decorators/require-permission.decorator';

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
      throw new ForbiddenException('User not authenticated');
    }

    // SUPERADMIN bypasses all permission checks
    if (user.globalRole === 'SUPERADMIN') {
      return true;
    }

    // OWNER has full access to workspace
    if (user.workspaceRole === 'OWNER') {
      return true;
    }

    const { resource, action, scope } = requirement;
    const workspaceId = user.workspaceId;

    // Check role-based permissions
    const rolePermission = await this.prismaService.rolePermission.findFirst({
      where: {
        workspaceId,
        role: user.workspaceRole,
        permission: {
          resource,
          action,
          scope: scope || 'all',
        },
      },
    });

    if (rolePermission) {
      return true;
    }

    // Check user-specific permissions
    const userPermission = await this.prismaService.userPermission.findFirst({
      where: {
        workspaceId,
        userId: user.userId,
        permission: {
          resource,
          action,
          scope: scope || 'all',
        },
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
    });

    if (userPermission) {
      return true;
    }

    throw new ForbiddenException(
      `You don't have permission to ${action} ${resource}`,
    );
  }
}
