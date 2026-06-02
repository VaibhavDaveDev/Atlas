import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../common/services/prisma.service";
import { RedisService } from "../../common/services/redis.service";
import config from "../../common/config/app.config";

@Injectable()
export class PermissionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  /**
   * Fetches and compiles all permissions for a user within a workspace.
   * Results are cached in Redis to prevent excessive database hits.
   */
  async getPermissions(
    workspaceId: string,
    userId: string,
    roleName: string,
  ): Promise<any[]> {
    const cacheKey = `${config.redis_cache_key_prefix}:permissions:${workspaceId}:${userId}`;

    // Try cache first
    const cached = await this.redis.get<any[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // Fetch from DB:
    // 1. Get permissions assigned to the role
    const rolePermissions = await this.prisma.rolePermission.findMany({
      where: {
        workspaceId,
        role: { name: roleName },
      },
      include: { permission: true },
    });

    // 2. Get permissions assigned directly to the user
    const userPermissions = await this.prisma.userPermission.findMany({
      where: {
        workspaceId,
        userId,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      include: { permission: true },
    });

    // Compile into a single list of permission objects
    const compiledPermissions = [
      ...rolePermissions.map((rp) => rp.permission),
      ...userPermissions.map((up) => up.permission),
    ];

    // Cache compiled permissions for 1 hour (3600 seconds)
    await this.redis.set(cacheKey, compiledPermissions, 3600);

    return compiledPermissions;
  }

  /**
   * Invalidates the permission cache for a user in a specific workspace.
   * Should be called whenever roles or direct permissions are modified.
   */
  async invalidateCache(workspaceId: string, userId: string): Promise<void> {
    const cacheKey = `${config.redis_cache_key_prefix}:permissions:${workspaceId}:${userId}`;
    await this.redis.del(cacheKey);
  }

  /**
   * Invalidates all permission caches for a specific workspace.
   * Should be called when a role's permissions are updated.
   */
  async invalidateWorkspaceCache(workspaceId: string): Promise<void> {
    const pattern = `${config.redis_cache_key_prefix}:permissions:${workspaceId}:*`;
    await this.redis.deleteByPattern(pattern);
  }
}
