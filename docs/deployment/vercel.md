# Deploying to Vercel

[Vercel](https://vercel.com) is the creators of Next.js and provides the best out-of-the-box experience for deploying the Atlas ERP frontend (`apps/web`).

## Prerequisites
- A GitHub/GitLab/Bitbucket repository containing the Atlas ERP code.
- A Vercel account.
- Your Backend API must already be deployed and accessible via a public URL (e.g., `https://api.yourdomain.com`).

## Deployment Steps

1. **Import Project:**
   - Log into Vercel and click **Add New Project**.
   - Import the Atlas ERP repository.

2. **Configure Project:**
   - **Framework Preset:** Vercel should automatically detect Next.js.
   - **Root Directory:** Edit this and set it to `apps/web`.
   - **Build Command:** `pnpm build` (or leave default if Turborepo is detected).
   - **Install Command:** `pnpm install` (or leave default).

3. **Set Environment Variables:**
   Add the necessary environment variables for the frontend:
   - `NEXT_PUBLIC_API_URL`: The URL of your deployed backend (e.g., `https://api.yourdomain.com`).
   - `NEXT_PUBLIC_TURNSTILE_SITE_KEY`: Your Cloudflare Turnstile public key.

4. **Deploy:**
   - Click **Deploy**. Vercel will build the `apps/web` package and assign you a URL.

## Custom Domains

Once deployed, you can navigate to the **Settings > Domains** tab in Vercel to add a custom domain (e.g., `app.yourdomain.com`). Ensure you update the `TRUSTED_ORIGINS` on your backend API to accept requests from this new domain.