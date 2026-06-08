import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Logger,
} from "@nestjs/common";
import type { Request } from "express";
import { IAccessTokenPayload, UserRole } from "../../auth/interfaces/auth.interface";
import { BetterAuthService } from "../../auth/services/better-auth.service";
import { fromNodeHeaders } from "better-auth/node";

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);

  constructor(
    private readonly betterAuthService: BetterAuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    try {
      // Convert Node headers to Web Headers
      const webHeaders = fromNodeHeaders(request.headers);
      
      // Better Auth's getSession correctly reads from cookies or Authorization header (via bearer plugin)
      const session = await this.betterAuthService.auth.api.getSession({
        headers: webHeaders,
      });

      if (!session?.session) {
        this.logger.warn(`No session found for request. Headers: ${JSON.stringify(request.headers)}`);
        throw new UnauthorizedException("No active session found");
      }

      // Extract workspace ID from x-workspace-id header (sent by frontend)
      const workspaceId = request.headers['x-workspace-id'] as string | undefined;

      // Map Better Auth user to legacy payload for downstream compatibility
      const payload: IAccessTokenPayload = {
        userId: session.user.id,
        role: (session.user as any).globalRole as UserRole || UserRole.USER,
        tokenVersion: (session.user as any).tokenVersion || 0,
        // Add workspace context from header
        workspaceId: workspaceId,
      };

      // Attach user to request
      Object.assign(request, { 
        user: payload,
        betterAuthSession: session 
      });

      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.debug(`Better Auth session check failed: ${error.message}`);
      throw new UnauthorizedException("Authentication failed");
    }
  }
}
