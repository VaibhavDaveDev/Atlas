# Redis Cache Integration

[Redis](https://redis.io/) is an in-memory data structure store that Atlas ERP relies on heavily for caching, session management, and message queues.

## Primary Use Cases

1. **Session Management:** Better Auth can be configured to store active sessions in Redis, allowing for incredibly fast validation without hitting the primary PostgreSQL database.
2. **Background Jobs:** BullMQ uses Redis to store job data, manage queues, and coordinate worker processes (e.g., for email sending and payroll processing).
3. **Rate Limiting:** The `ThrottlerGuard` uses Redis to track request counts across multiple API instances, preventing abuse.
4. **Data Caching:** Frequently accessed, rarely changing data (like Chart of Accounts structures or permission matrices) can be cached in Redis to speed up API responses.

## Configuration

**Backend (`apps/api/.env`):**
```bash
REDIS_HOST="localhost"
REDIS_PORT="6379"
# REDIS_PASSWORD="your-secure-password" # Uncomment if using a secured instance
```

### NestJS Implementation

The connection is managed in `apps/api/src/common/modules/redis.module.ts`. We use standard Node.js Redis clients (`ioredis` is preferred due to its native support in BullMQ).

```typescript
// apps/api/src/common/services/redis.service.ts
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  public readonly client: Redis;

  constructor() {
    this.client = new Redis({
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD,
    });
  }

  onModuleDestroy() {
    this.client.disconnect();
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.client.set(key, value, 'EX', ttlSeconds);
    } else {
      await this.client.set(key, value);
    }
  }
}
```

## Recommended Hosting

- **Local Development:** Use Docker (`docker run -p 6379:6379 -d redis`).
- **Free Tier / Serverless:** [Upstash](https://upstash.com/) offers an excellent Serverless Redis product with a generous free tier, perfect for Vercel/Render deployments.
- **Enterprise:** AWS ElastiCache, Google Cloud Memorystore, or Aiven.

## Troubleshooting

If the API fails to start with connection errors, ensure:
1. Redis is running (`redis-cli ping` should return `PONG`).
2. The port is correct.
3. If using Upstash or a remote provider, ensure the `REDIS_PASSWORD` and connection strings are formatted exactly as provided by the host.