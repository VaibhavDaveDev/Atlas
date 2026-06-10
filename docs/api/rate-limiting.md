# Rate Limiting

To protect the system from brute-force attacks, DDoS attempts, and abusive scraping, Atlas ERP implements API Rate Limiting using the `@nestjs/throttler` package.

## Global Limits

By default, all endpoints are protected by a global rate limiter.

| Configuration | Default Value | Description |
|---------------|---------------|-------------|
| `THROTTLE_TTL` | 60 (seconds) | The time window in which requests are counted. |
| `THROTTLE_LIMIT` | 100 | The maximum number of requests allowed per IP within the TTL. |

If a client exceeds this limit, the API will respond with a `429 Too Many Requests` status code.

```json
{
  "success": false,
  "error": {
    "statusCode": 429,
    "message": "ThrottlerException: Too Many Requests"
  }
}
```

## Strict Limits (Authentication)

Certain sensitive endpoints, such as those related to authentication, have much stricter rate limits to prevent brute-force credential stuffing.

For example, the `/auth/login` endpoint might be restricted to 5 attempts per minute.

## Bypassing Rate Limits (Internal APIs)

If you are building a server-to-server integration (e.g., a webhook receiver or an internal microservice) that requires high throughput, you can bypass rate limits by whitelisting specific IP addresses or API keys in the `apps/api/src/common/guards/custom-throttler.guard.ts` file.