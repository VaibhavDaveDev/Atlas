# Setting up Upstash Redis

[Upstash](https://upstash.com/) provides Serverless Redis with per-request pricing, which is ideal for the caching and queueing needs of Atlas ERP.

## Setup Steps

1. **Create an Account:** Sign up at Upstash.com.
2. **Create a Database:**
   - **Name:** `atlas-redis`
   - **Type:** Redis
   - **Region:** Choose a region matching your API deployment (e.g., AWS US-East-1).
   - **Eviction:** For BullMQ to work correctly, do NOT use `allkeys-lru`. Set eviction to `noeviction` or ensure you have enough memory.
3. **Get Connection Details:**
   - Scroll down to the **Node.js (ioredis)** connection example.
   - Extract the Host, Port, and Password.

## Configuring Atlas

Update your backend environment variables (`apps/api/.env` or in Render):

```bash
REDIS_HOST="liberal-donkey-12345.upstash.io"
REDIS_PORT="6379"
REDIS_PASSWORD="your-secure-password"
```

### Note on TLS/SSL
Upstash requires a secure connection. Our `RedisService` implementation should handle `rediss://` protocols or TLS configurations automatically when the port is provided, but verify your `ioredis` configuration if you encounter connection drops.