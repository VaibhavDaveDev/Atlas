import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';

/**
 * Custom Throttler Guard that:
 * - Skips Swagger, metrics, and health endpoints
 * - Tracks authenticated users by userId (not IP) so all users share localhost
 *   in dev without tripping the per-IP bucket
 * - Lets already-authenticated non-auth routes through with the relaxed limit
 */
@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  constructor(
    protected readonly options: any,
    protected readonly storageService: any,
    protected readonly reflector: Reflector,
    private readonly configService: ConfigService,
  ) {
    super(options, storageService, reflector);
  }

  protected async shouldSkip(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const path = request.url as string;

    // Skip throttling for Swagger/OpenAPI documentation
    if (
      path.startsWith('/docs') ||
      path.startsWith('/api-json') ||
      path.startsWith('/swagger') ||
      path.includes('swagger') ||
      path.includes('-json')
    ) {
      return true;
    }

    // Skip throttling for metrics endpoints (Prometheus)
    if (path.startsWith('/metrics')) {
      return true;
    }

    // Skip throttling for favicon
    if (path === '/favicon.ico') {
      return true;
    }

    // Extract user if not already present (global guards run before AuthGuard)
    if (!request.user) {
      const authHeader = request.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
          // Verify token for throttle tracking
          const secret = this.configService.get<string>('JWT_SECRET');
          if (secret) {
            const decoded = jwt.verify(token, secret) as any;
            if (decoded && (decoded.userId || decoded.sub)) {
              request.user = {
                id: decoded.userId || decoded.sub,
                sub: decoded.sub || decoded.userId,
              };
            }
          }
        } catch (e) {
          // Ignore verification errors, will fall back to IP tracking
          // AuthGuard will handle formal rejection later
        }
      }
    }

    // Skip throttling for already-authenticated non-auth routes (hr, workspace, etc.)
    // These are protected by AuthGuard + WorkspaceGuard; no need for IP-based throttling
    const isAuthRoute = path.includes('/auth/');
    const isAuthenticated = !!request.user;
    if (isAuthenticated && !isAuthRoute) {
      return true;
    }

    // Check if route has @SkipThrottle decorator
    return super.shouldSkip(context);
  }

  /**
   * Use userId as the throttle tracker key for authenticated users,
   * falling back to IP for anonymous (auth) routes.
   * This prevents all dev traffic from sharing one 127.0.0.1 bucket.
   */
  protected async getTracker(req: Record<string, any>): Promise<string> {
    const userId: string | undefined = req.user?.id ?? req.user?.sub;
    if (userId) {
      return `user:${userId}`;
    }
    return req.ip ?? req.connection?.remoteAddress ?? 'unknown';
  }
}
