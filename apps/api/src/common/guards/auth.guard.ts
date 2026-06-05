import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Logger,
} from "@nestjs/common";
import type { Request } from "express";
import * as jwt from "jsonwebtoken";
import config from "../config/app.config";
import { RedisService } from "../services/redis.service";
import { PrismaService } from "../services/prisma.service";
import { IAccessTokenPayload, UserRole } from "../../auth/interfaces/auth.interface";
import { BetterAuthService } from "../../auth/services/better-auth.service";
import { fromNodeHeaders } from "better-auth/node";

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);

  constructor(
    private readonly redisService: RedisService,
    private readonly prismaService: PrismaService,
    private readonly betterAuthService: BetterAuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    // 1. Try Better Auth session first
    try {
      // Convert Node headers to Web Headers
      const webHeaders = fromNodeHeaders(request.headers);
      
      // Better Auth's getSession correctly reads from cookies or Authorization header (via bearer plugin)
      const session = await this.betterAuthService.auth.api.getSession({
        headers: webHeaders,
      });

      if (session?.session) {
        // Map Better Auth user to legacy payload for downstream compatibility
        const payload: IAccessTokenPayload = {
          userId: session.user.id,
          role: (session.user as any).globalRole as UserRole || UserRole.USER,
          tokenVersion: (session.user as any).tokenVersion || 0,
          // Better Auth session might have workspace context if organization plugin is used
          // workspaceId: session.session.activeOrganizationId,
        };

        // Attach user to request
        Object.assign(request, { 
          user: payload,
          betterAuthSession: session 
        });

        return true;
      }
    } catch (error) {
      this.logger.debug(`Better Auth session check failed: ${error.message}`);
    }

    // 2. Fallback to legacy JWT check
    const token = this.extractTokenFromHeader(request) || this.extractTokenFromCookies(request);

    if (!token) {
      throw new UnauthorizedException("No token found");
    }

    try {
      const payload = jwt.verify(
        token,
        config.jwt_access_secret,
      ) as IAccessTokenPayload;

      // Step 2: Check tokenVersion (hybrid - Redis first, DB fallback)
      const currentVersion = await this.getTokenVersion(payload.userId);

      if (currentVersion !== payload.tokenVersion) {
        throw new UnauthorizedException(
          "Token has been revoked. Please login again.",
        );
      }

      // Attach user to request for downstream use
      Object.assign(request, { user: payload });

      return true;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedException("Token has expired");
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedException("Invalid token");
      }
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException("Authentication failed");
    }
  }

  /**
   * Get token version with Redis cache
   * Fast path: Redis lookup (~1-2ms)
   * Slow path: DB lookup + cache (~10-20ms, only on cache miss)
   */
  private async getTokenVersion(userId: string): Promise<number> {
    const cacheKey = `${config.redis_cache_key_prefix}:token_version:${userId}`;

    // Try Redis first (fast path - most common)
    const cachedVersion = await this.redisService.get<number>(cacheKey);
    if (cachedVersion !== null && cachedVersion !== undefined) {
      return cachedVersion;
    }

    // Fallback to DB (slow path - only on cache miss)
    const user = await this.prismaService.authUser.findUnique({
      where: { id: userId },
      select: { tokenVersion: true, status: true },
    });

    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    if (user.status !== "ACTIVE") {
      throw new UnauthorizedException("User account is not active");
    }

    // Cache for 1 hour (or until security event invalidates it)
    await this.redisService.set(cacheKey, user.tokenVersion, 3600);

    return user.tokenVersion;
  }

  /**
   * Extract token from Authorization header
   * Format: Bearer <token>
   */
  private extractTokenFromHeader(request: Request): string | undefined {
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      return undefined;
    }

    const [type, token] = authHeader.split(" ");
    return type === "Bearer" ? token : undefined;
  }

  /**
   * Extract token from cookies (alternative method)
   */
  private extractTokenFromCookies(request: Request): string | undefined {
    const cookies = request.cookies as Record<string, string> | undefined;
    return cookies?.accessToken;
  }
}
