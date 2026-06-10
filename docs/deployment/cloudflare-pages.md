# Deploying to Cloudflare Pages

[Cloudflare Pages](https://pages.cloudflare.com/) is an excellent alternative to Vercel for deploying the Next.js frontend, offering fast edge caching and a generous free tier.

## Prerequisites
- A GitHub/GitLab repository with your code.
- A Cloudflare account.
- Your Backend API deployed and accessible.

## Setup Steps

1. **Create Pages Project:**
   - Go to Cloudflare Dashboard -> **Workers & Pages**.
   - Click **Create application** -> **Pages** -> **Connect to Git**.
   - Select the Atlas ERP repository.

2. **Configure Build Settings:**
   - **Framework preset:** Next.js
   - **Build command:** `npx turbo run build --filter=web`
   - **Build output directory:** `apps/web/.next`
   - **Root directory:** `/` (Keep at root so Turborepo works correctly)

3. **Environment Variables:**
   - `NEXT_PUBLIC_API_URL`: The URL of your deployed backend.
   - `NEXT_PUBLIC_TURNSTILE_SITE_KEY`: Your Turnstile key.
   - `NODE_VERSION`: `22` (Ensure Cloudflare uses the correct Node version).

4. **Deploy:**
   - Click **Save and Deploy**.

## Important Notes for Cloudflare Pages

If you are using Next.js **Server Actions** or heavily relying on Node.js specific APIs in your frontend, you may need to configure the project to run on Cloudflare Workers using the `@cloudflare/next-on-pages` adapter, or stick to Vercel/Render for the frontend.