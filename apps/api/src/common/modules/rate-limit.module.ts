import { Module, Global } from "@nestjs/common";
import { ThrottlerModule } from "@nestjs/throttler";
import { APP_GUARD } from "@nestjs/core";
import { THROTTLER_CONFIG } from "../config/throttler.config";
import { CustomThrottlerGuard } from "../guards/custom-throttler.guard";

@Global()
@Module({
  imports: [
    ThrottlerModule.forRoot({
      // Using in-memory storage — no Redis dependency.
      // Rate limiting is per-instance (fine for single-instance deployments).
      // To switch back to distributed Redis storage, restore ThrottlerStorageRedisService.
      throttlers: [
        {
          name: "default",
          ttl: THROTTLER_CONFIG.DEFAULT.ttl,
          limit: THROTTLER_CONFIG.DEFAULT.limit,
        },
        {
          name: "strict",
          ttl: THROTTLER_CONFIG.STRICT.ttl,
          limit: THROTTLER_CONFIG.STRICT.limit,
        },
        {
          name: "auth",
          ttl: THROTTLER_CONFIG.AUTH.ttl,
          limit: THROTTLER_CONFIG.AUTH.limit,
        },
        {
          name: "relaxed",
          ttl: THROTTLER_CONFIG.RELAXED.ttl,
          limit: THROTTLER_CONFIG.RELAXED.limit,
        },
      ],
    }),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: CustomThrottlerGuard,
    },
  ],
  exports: [ThrottlerModule],
})
export class RateLimitModule {}
