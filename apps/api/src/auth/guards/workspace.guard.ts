import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';

@Injectable()
export class WorkspaceGuard implements CanActivate {
  constructor(private readonly prismaService: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }

    // SUPERADMIN can access any workspace
    if (user.globalRole === 'SUPERADMIN') {
      return true;
    }

    // workspaceId MUST come from the verified JWT (set during /auth/select-workspace).
    // Never trust client-controlled headers for authorization decisions.
    const workspaceId = user.workspaceId;

    if (!workspaceId) {
      throw new UnauthorizedException(
        'No workspace selected. Please call /auth/select-workspace first.',
      );
    }

    // Check if user is a member of the workspace
    const membership = await this.prismaService.workspaceMember.findFirst({
      where: {
        workspaceId,
        userId: user.userId,
        isActive: true,
      },
      include: {
        workspace: true,
      },
    });

    if (!membership) {
      throw new UnauthorizedException('User is not a member of this workspace');
    }

    // Check if workspace is active
    if (membership.workspace.status !== 'ACTIVE') {
      throw new UnauthorizedException('Workspace is not active');
    }

    // Attach workspace info to request
    request.user.workspaceId = workspaceId;
    request.user.workspaceRole = membership.role;
    request.user.department = membership.department;

    return true;
  }
}
