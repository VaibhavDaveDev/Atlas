import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    
    if (!user) {
      return false;
    }

    // SUPERADMIN has all access
    if (user.globalRole === 'SUPERADMIN') {
      return true;
    }

    const hasRole = requiredRoles.some((role) => user.workspaceRole === role);
    
    if (!hasRole) {
      throw new ForbiddenException('You do not have the required role to perform this action');
    }

    return true;
  }
}
