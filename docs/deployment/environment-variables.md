# Environment Variables in Production

Managing secrets securely is a critical part of deploying Atlas ERP. 

## General Principles

1. **Never commit `.env` files.**
2. **Use Platform Secret Managers:** Vercel, Render, and GitHub all provide secure ways to inject environment variables at build and run time.
3. **Separate Environments:** Use completely different database credentials, Redis instances, and JWT secrets for Staging and Production.

## Required Production Variables

Ensure these are set in your production hosting environments.

### Backend (e.g., Render)

```bash
NODE_ENV="production"
PORT="3001"

# Database & Cache
DATABASE_URL="..."
REDIS_HOST="..."
REDIS_PORT="6379"
REDIS_PASSWORD="..."

# Security (GENERATE NEW RANDOM STRINGS)
BETTER_AUTH_SECRET="..."
JWT_SECRET="..."
JWT_REFRESH_SECRET="..."

# URLs
BETTER_AUTH_URL="https://api.yourdomain.com"
WEB_URL="https://app.yourdomain.com"
TRUSTED_ORIGINS="https://app.yourdomain.com"

# Integrations
BREVO_API_KEY="..."
EMAIL_FROM="noreply@yourdomain.com"
TURNSTILE_SECRET_KEY="..."
```

### Frontend (e.g., Vercel)

```bash
NODE_ENV="production"
NEXT_PUBLIC_API_URL="https://api.yourdomain.com"
NEXT_PUBLIC_TURNSTILE_SITE_KEY="..."
```

## Rotating Secrets

If a secret (like `JWT_SECRET`) is compromised:
1. Generate a new secret.
2. Update the environment variable in your hosting platform.
3. Restart the backend service.
*(Note: Changing the JWT secret will invalidate all current user sessions, requiring everyone to log in again).*