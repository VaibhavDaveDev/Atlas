import { Module, Global, OnModuleDestroy, Inject } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis, { Redis as RedisType } from "ioredis";
import { WINSTON_MODULE_PROVIDER } from "nest-winston";
import { Logger } from "winston";
import { RedisService, REDIS_CLIENT } from "../services/redis.service";

const createRedisClient = (
  configService: ConfigService,
  logger: Logger,
): RedisType => {
  const redisUrl = configService.get<string>("REDIS_URL");

  const retryStrategy = (times: number) => {
    if (times > 10) {
      logger.error("Redis max connection retries reached. Stopping...", {
        context: "RedisModule",
      });
      return null;
    }
    const delay = Math.min(times * 100, 3000);
    logger.warn(`Redis reconnecting in ${delay}ms (attempt ${times})`, {
      context: "RedisModule",
      attempt: times,
      delay,
    });
    return delay;
  };

  // If REDIS_URL is provided (e.g. Upstash rediss://... URL), use it directly.
  // ioredis automatically enables TLS when the scheme is "rediss://".
  const connectionOptions = redisUrl
    ? {
        // Parse URL but override TLS to not reject self-signed / Upstash certs
        ...(redisUrl.startsWith("rediss://") ? { tls: { rejectUnauthorized: false } } : {}),
      }
    : {
        host: configService.get<string>("REDIS_HOST", "localhost"),
        port: configService.get<number>("REDIS_PORT", 6379),
        username: configService.get<string>("REDIS_USER"),
        password: configService.get<string>("REDIS_PASSWORD"),
        db: configService.get<number>("REDIS_DB", 0),
        // TLS via individual env vars
        ...(configService.get<string>("REDIS_TLS") === "true"
          ? { tls: { rejectUnauthorized: false } }
          : {}),
      };

  const sharedOptions = {
    // CRITICAL: Don't queue commands when Redis is disconnected.
    // Commands fail immediately → caught by RedisService try/catch → cache miss → re-fetch from DB.
    // Without this, queued commands pile up and cause MaxRetriesPerRequestError storms.
    enableOfflineQueue: false,

    // Don't retry individual commands — let them fail fast.
    // Connection-level retries (retryStrategy) still work for reconnection.
    maxRetriesPerRequest: null,

    // Don't block startup if Redis is unavailable.
    lazyConnect: true,

    enableReadyCheck: false,
    connectTimeout: 10000,
    commandTimeout: 3000,
    retryStrategy,

    // Reconnect automatically on ECONNRESET (Upstash idle timeout resets)
    reconnectOnError: (err: Error) => {
      const targetErrors = ["READONLY", "ECONNRESET", "ETIMEDOUT"];
      return targetErrors.some((e) => err.message.includes(e));
    },
  };

  const client = redisUrl
    ? new Redis(redisUrl, {
        ...sharedOptions,
        tls: { rejectUnauthorized: false },
      })
    : new Redis({
        ...connectionOptions,
        ...sharedOptions,
      });

  // Event listeners for monitoring
  client.on("error", (err) =>
    logger.error(`Redis error: ${err.message}`, {
      context: "RedisModule",
      error: err.message,
    }),
  );
  client.on("connect", () =>
    logger.info("Redis connecting...", { context: "RedisModule" }),
  );
  client.on("ready", () =>
    logger.info("Redis ready", { context: "RedisModule" }),
  );
  client.on("close", () =>
    logger.warn("Redis connection closed", { context: "RedisModule" }),
  );
  client.on("reconnecting", () =>
    logger.warn("Redis reconnecting...", { context: "RedisModule" }),
  );

  return client;
};

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: createRedisClient,
      inject: [ConfigService, WINSTON_MODULE_PROVIDER],
    },
    RedisService,
  ],
  exports: [REDIS_CLIENT, RedisService],
})
export class RedisModule implements OnModuleDestroy {
  constructor(
    @Inject(REDIS_CLIENT) private readonly client: RedisType,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  async onModuleDestroy(): Promise<void> {
    if (this.client) {
      this.logger.info("Closing Redis connection...", {
        context: "RedisModule",
      });
      await this.client.quit();
      this.logger.info("Redis connection closed", { context: "RedisModule" });
    }
  }
}
