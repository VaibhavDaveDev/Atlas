# Deployment Overview

Atlas ERP is designed to be cloud-native and can be deployed to various platforms.

## Architecture for Deployment

A typical production deployment of Atlas ERP consists of the following components:

1. **Frontend (Web App):** A Next.js 15 application. Best deployed to platforms like Vercel or Cloudflare Pages.
2. **Backend (API):** A NestJS 11 application. Best deployed to platforms like Render, Railway, DigitalOcean, or AWS App Runner.
3. **Database:** PostgreSQL 17 database. Recommended providers: Neon, Supabase, or AWS RDS.
4. **Cache/Queue:** Redis 8. Recommended providers: Upstash or AWS ElastiCache.

## Recommended Free Tier Stack

If you want to deploy Atlas ERP for free (for evaluation or small projects), you can use the following stack:

- **Frontend:** [Vercel](https://vercel.com) (Free Hobby Plan)
- **Backend:** [Render](https://render.com) (Free Web Service) or Railway
- **Database:** [Neon](https://neon.tech) (Free Tier Postgres)
- **Redis:** [Upstash](https://upstash.com) (Free Tier Serverless Redis)

## Detailed Deployment Guides

For detailed, step-by-step instructions on deploying to specific platforms, please refer to the dedicated deployment guides in the **Deployment** section:

- [Deploying to Vercel](../deployment/vercel.md)
- [Deploying to Cloudflare Pages](../deployment/cloudflare-pages.md)
- [Deploying to Render](../deployment/render.md)
- [Setting up Neon Database](../deployment/neon-database.md)
- [Setting up Upstash Redis](../deployment/upstash-redis.md)

## General Pre-Deployment Checklist

Before deploying, ensure you have:

1. Created production accounts for your Database and Redis.
2. Created a production environment for your Email provider (e.g., Brevo).
3. Configured production OAuth credentials (if using Google OAuth).
4. Generated secure, random strings for `BETTER_AUTH_SECRET`, `JWT_SECRET`, and `JWT_REFRESH_SECRET`.
5. Set `NODE_ENV=production` in your server environments.
6. Verified that `TRUSTED_ORIGINS` includes your production frontend URL.