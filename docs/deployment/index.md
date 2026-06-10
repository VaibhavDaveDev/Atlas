# Deployment

Atlas ERP uses a modern, decoupled architecture (Next.js frontend + NestJS backend), which gives you maximum flexibility when choosing where to deploy.

## Recommended Architecture

For the best balance of performance, cost, and developer experience, we recommend the following deployment stack:

| Component | Recommended Host | Alternatives |
|-----------|-----------------|--------------|
| **Frontend** | [Vercel](vercel.md) | [Cloudflare Pages](cloudflare-pages.md), Netlify |
| **Backend API** | [Render](render.md) | Railway, AWS App Runner, DigitalOcean App Platform |
| **Database** | [Neon (PostgreSQL)](neon-database.md) | Supabase, AWS RDS, DigitalOcean Managed DB |
| **Cache & Queue**| [Upstash (Redis)](upstash-redis.md) | AWS ElastiCache, Aiven |

## In this section

- [Vercel](vercel.md) — Deploying the Next.js Web App.
- [Cloudflare Pages](cloudflare-pages.md) — Alternative frontend deployment.
- [Render](render.md) — Deploying the NestJS Backend API.
- [Neon Database](neon-database.md) — Serverless PostgreSQL setup.
- [Upstash Redis](upstash-redis.md) — Serverless Redis setup.
- [Environment Variables](environment-variables.md) — Managing secrets in production.
- [CI/CD](ci-cd.md) — Setting up GitHub Actions for automated deployment.
- [Monitoring](monitoring.md) — Keeping an eye on your production instance.