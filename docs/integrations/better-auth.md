# Better Auth Integration

[Better Auth](https://better-auth.com/) is the foundational authentication framework used in Atlas ERP. It provides secure, robust, and extensible authentication out-of-the-box.

## Why Better Auth?

Instead of building custom JWT and session management from scratch, Better Auth provides:
- Built-in session management (Redis/PostgreSQL).
- Secure cookie handling.
- Extensible plugin system (e.g., Two-Factor Authentication, Magic Links).
- Pre-built OAuth adapters.

## Configuration

Better Auth is configured in the backend at `apps/api/src/auth/config/auth.config.ts`.

### Required Environment Variables

Ensure these are set in `apps/api/.env`:

```bash
# A random 32+ character string used to sign sessions/tokens
BETTER_AUTH_SECRET="your-secure-random-string"

# The base URL of your API (needed for cookie domains and redirects)
BETTER_AUTH_URL="http://localhost:3001"
```

## How It Works in Atlas

1. **Initialization:** Better Auth is initialized as a service provider in the NestJS `AuthModule`.
2. **Database:** It connects directly to the Prisma client to manage `AuthUser`, `AuthSession`, and other related tables.
3. **Controller:** The `BetterAuthController` handles requests to `/api/v1/auth/*` (like `/sign-in`, `/sign-up`, `/sign-out`), proxying them to the Better Auth core logic.
4. **Guards:** The `AuthGuard` extracts the session token from the incoming request (via cookies or headers) and uses `betterAuthService.validateSession(req)` to authenticate the user.

## Customizing Auth Behavior

If you need to add custom logic during sign-up (like creating a default workspace or sending a welcome email), you can use Better Auth's database hooks or NestJS event emitters triggered after successful registration.