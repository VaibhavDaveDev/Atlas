# Cloudflare Turnstile Integration

To prevent automated bots from spamming the registration, login, and password reset endpoints, Atlas ERP integrates [Cloudflare Turnstile](https://www.cloudflare.com/products/turnstile/). 

Turnstile is a privacy-preserving, user-friendly alternative to traditional CAPTCHAs (like reCAPTCHA) that rarely requires users to solve annoying image puzzles.

## Configuration Steps

### 1. Create a Cloudflare Account
Sign up or log in to the [Cloudflare Dashboard](https://dash.cloudflare.com/).

### 2. Add a Turnstile Site
1. Navigate to **Turnstile** in the sidebar.
2. Click **Add Site**.
3. **Site Name:** e.g., "Atlas ERP Production".
4. **Domain:** Add your production domain (e.g., `app.yourdomain.com`). 
   - *Tip: Also add `localhost` and `127.0.0.1` for local development testing, or create a separate "Site" for development using Cloudflare's dummy test keys.*
5. **Widget Mode:** Choose "Managed" (recommended).

### 3. Set Environment Variables

You will receive two keys: a **Site Key** (public) and a **Secret Key** (private).

**Frontend (`apps/web/.env`):**
```bash
NEXT_PUBLIC_TURNSTILE_SITE_KEY="0x4AAAAAA..."
```

**Backend (`apps/api/.env`):**
```bash
TURNSTILE_SECRET_KEY="0x4AAAAAA..."
```

## How It Works in Atlas

### Frontend Implementation
The frontend uses the `TurnstileWidget` component (e.g., `src/components/common/TurnstileWidget.tsx`) on sensitive forms. When the user completes the challenge, Turnstile generates a token. This token is appended to the form data payload sent to the API.

### Backend Implementation
The backend protects sensitive routes using the `TurnstileGuard` (`apps/api/src/common/guards/turnstile.guard.ts`).

```typescript
@UseGuards(TurnstileGuard)
@Post('register')
async register(@Body() dto: RegisterDto) {
  // If the guard passes, we know the request came from a human
  return this.authService.register(dto);
}
```

The guard extracts the token from the request body (usually from a `cf-turnstile-response` field), makes an HTTP POST request to Cloudflare's verification API using the `TURNSTILE_SECRET_KEY`, and allows the request to proceed only if Cloudflare confirms the token is valid and hasn't been used before.