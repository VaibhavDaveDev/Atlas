# Environment Variables

Atlas ERP requires several environment variables to function. This guide covers all required and optional variables.

## Quick Setup

```bash
# Copy example files
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# Edit with your values
# Backend: apps/api/.env
# Frontend: apps/web/.env
```

## Backend Variables (`apps/api/.env`)

### Database

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | ✅ Yes | — | PostgreSQL connection string. Format: `postgresql://user:pass@host:port/dbname` |

**Example:**
```bash
DATABASE_URL="postgresql://postgres:password@localhost:5432/atlas_erp?schema=public"
```

### API Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | ❌ No | `3001` | Port for NestJS API server |
| `API_PREFIX` | ❌ No | `api/v1` | API route prefix |
| `NODE_ENV` | ❌ No | `development` | Environment: `development`, `production`, `test` |

### Authentication (Better Auth)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `BETTER_AUTH_SECRET` | ✅ Yes | — | Secret key for Better Auth (minimum 32 characters) |
| `BETTER_AUTH_URL` | ✅ Yes | — | Base URL of your API (e.g., `http://localhost:3001`) |
| `JWT_SECRET` | ✅ Yes | — | Secret for JWT access tokens |
| `JWT_REFRESH_SECRET` | ✅ Yes | — | Secret for JWT refresh tokens |
| `JWT_EXPIRES_IN` | ❌ No | `15m` | Access token expiration (e.g., `15m`, `1h`) |
| `JWT_REFRESH_EXPIRES_IN` | ❌ No | `7d` | Refresh token expiration (e.g., `7d`, `30d`) |
| `MAX_SESSIONS_PER_USER` | ❌ No | `3` | Maximum concurrent sessions per user |

**Generate secure secrets:**
```bash
# On Linux/macOS
openssl rand -base64 32

# On Windows (PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))

# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Email (Brevo)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `BREVO_API_KEY` | ✅ Yes | — | Brevo API key for transactional emails |
| `EMAIL_FROM` | ✅ Yes | — | Sender email address (must be verified in Brevo) |
| `EMAIL_FROM_NAME` | ❌ No | `Atlas ERP` | Sender display name |

**Setup guide:** [Integrations → Brevo Email](../integrations/brevo-email.md)

### Google OAuth (Optional)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GOOGLE_CLIENT_ID` | ❌ No | — | Google OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | ❌ No | — | Google OAuth Client Secret |
| `GOOGLE_REDIRECT_URI` | ❌ No | — | OAuth callback URL (e.g., `http://127.0.0.1:3000/auth/callback`) |

**Setup guide:** [Integrations → Google OAuth](../integrations/google-oauth.md)

### Redis

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `REDIS_HOST` | ✅ Yes | `localhost` | Redis server hostname |
| `REDIS_PORT` | ✅ Yes | `6379` | Redis server port |
| `REDIS_PASSWORD` | ❌ No | — | Redis password (if authentication enabled) |

**For Upstash Redis:**
```bash
REDIS_HOST="your-redis-url.upstash.io"
REDIS_PORT="6379"
REDIS_PASSWORD="your-upstash-password"
```

### Cloudflare Turnstile (CAPTCHA)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `TURNSTILE_SECRET_KEY` | ❌ No | — | Server-side secret key for Turnstile verification |

**Setup guide:** [Integrations → Cloudflare Turnstile](../integrations/cloudflare-turnstile.md)

### Gravatar (Optional)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GRAVATAR_API_KEY` | ❌ No | — | Gravatar API key |
| `GRAVATAR_CLIENT_ID` | ❌ No | — | Gravatar OAuth Client ID |
| `GRAVATAR_CLIENT_SECRET` | ❌ No | — | Gravatar OAuth Client Secret |

### Rate Limiting

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `THROTTLE_TTL` | ❌ No | `60` | Time window in seconds for rate limiting |
| `THROTTLE_LIMIT` | ❌ No | `10` | Maximum requests per TTL window |

### Logging (Grafana Loki - Optional)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `LOKI_ENABLED` | ❌ No | `false` | Enable Loki logging integration |
| `LOKI_URL` | ❌ No | — | Loki server URL (e.g., `http://localhost:3100` or Grafana Cloud URL) |
| `LOKI_USER` | ❌ No | — | Loki username (for Grafana Cloud) |
| `LOKI_PASSWORD` | ❌ No | — | Loki password/API token (for Grafana Cloud) |

### Web Application

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `WEB_URL` | ✅ Yes | — | Frontend URL (e.g., `http://localhost:3000`) |
| `TRUSTED_ORIGINS` | ❌ No | — | Comma-separated list of trusted origins for CORS/SSO |

**Example for production:**
```bash
TRUSTED_ORIGINS="https://app.yourcompany.com,https://yourcompany.com"
```

---

## Frontend Variables (`apps/web/.env`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | ✅ Yes | — | Backend API URL (e.g., `http://localhost:3001`) |
| `NEXT_PUBLIC_GRAVATAR_CLIENT_ID` | ❌ No | — | Gravatar Client ID (public) |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | ❌ No | — | Cloudflare Turnstile Site Key (public) |
| `NODE_ENV` | ❌ No | `development` | Environment: `development`, `production`, `test` |

!!! warning "Public Variables"
    Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser. Never put secrets in these variables.

---

## Environment-Specific Examples

### Development (Local)

**Backend (`apps/api/.env`):**
```bash
DATABASE_URL="postgresql://postgres:password@localhost:5432/atlas_erp"
PORT=3001
NODE_ENV=development

BETTER_AUTH_SECRET="your-32-char-secret-change-this-now"
BETTER_AUTH_URL="http://localhost:3001"
JWT_SECRET="your-jwt-secret"
JWT_REFRESH_SECRET="your-refresh-secret"

REDIS_HOST=localhost
REDIS_PORT=6379

BREVO_API_KEY="your-brevo-key"
EMAIL_FROM="you@example.com"

WEB_URL="http://localhost:3000"
```

**Frontend (`apps/web/.env`):**
```bash
NEXT_PUBLIC_API_URL="http://localhost:3001"
NODE_ENV=development
```

### Production (Vercel + Neon + Upstash)

**Backend (Render/Railway):**
```bash
DATABASE_URL="postgresql://user:pass@ep-xxx.us-east-1.aws.neon.tech/atlas_erp"
PORT=3001
NODE_ENV=production

BETTER_AUTH_SECRET="<generated-32-char-secret>"
BETTER_AUTH_URL="https://api.yourapp.com"
JWT_SECRET="<generated-jwt-secret>"
JWT_REFRESH_SECRET="<generated-refresh-secret>"

REDIS_HOST="your-redis.upstash.io"
REDIS_PORT="6379"
REDIS_PASSWORD="<upstash-password>"

BREVO_API_KEY="<production-key>"
EMAIL_FROM="noreply@yourapp.com"
EMAIL_FROM_NAME="Your App"

GOOGLE_CLIENT_ID="<google-client-id>"
GOOGLE_CLIENT_SECRET="<google-secret>"
GOOGLE_REDIRECT_URI="https://yourapp.com/auth/callback"

TURNSTILE_SECRET_KEY="<turnstile-secret>"

WEB_URL="https://yourapp.com"
TRUSTED_ORIGINS="https://yourapp.com,https://www.yourapp.com"

LOKI_ENABLED=true
LOKI_URL="https://logs-prod-xxx.grafana.net"
LOKI_USER="<loki-user>"
LOKI_PASSWORD="<grafana-token>"
```

**Frontend (Vercel):**
```bash
NEXT_PUBLIC_API_URL="https://api.yourapp.com"
NEXT_PUBLIC_TURNSTILE_SITE_KEY="<turnstile-site-key>"
NODE_ENV=production
```

---

## Validation

To verify your environment variables are correctly set:

```bash
# Backend
cd apps/api
pnpm run start:dev

# Frontend
cd apps/web
pnpm run dev
```

Check logs for missing or invalid environment variables.

---

## Security Best Practices

!!! danger "Never Commit Secrets"
    - Never commit `.env` files to git
    - `.env` is already in `.gitignore`
    - Use `.env.example` for documentation only

!!! tip "Secret Management"
    - Use different secrets for development and production
    - Rotate secrets regularly
    - Use environment-specific secret management (e.g., Vercel Environment Variables, Railway Config)

!!! warning "Frontend Secrets"
    - Never put API keys or secrets in `NEXT_PUBLIC_*` variables
    - These are exposed to the browser and can be seen by anyone

---

## Troubleshooting

### "Missing environment variable" error

Check that:
1. `.env` file exists in the correct location
2. Variable name is spelled correctly
3. No extra spaces around `=`
4. Values with special characters are quoted

### Database connection fails

- Verify `DATABASE_URL` format is correct
- Check PostgreSQL is running: `psql -h localhost -U postgres`
- Test connection: `pnpm db:studio` (opens Prisma Studio)

### Redis connection fails

- Verify Redis is running: `redis-cli ping` (should return `PONG`)
- Check `REDIS_HOST` and `REDIS_PORT` are correct
- For Upstash: ensure password is included

---

## Related Pages

- [Installation Guide](installation.md)
- [Deployment → Environment Variables](../deployment/environment-variables.md)
- [Integrations](../integrations/index.md)