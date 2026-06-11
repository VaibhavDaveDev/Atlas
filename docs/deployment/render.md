---
title: Deploying to Render
description: Deploy Atlas ERP NestJS backend API to Render using Docker, including environment configuration and database migrations
tags:
  - deployment
  - render
  - nestjs
  - backend
  - docker
  - hosting
---

# Deploying to Render

[Render](https://render.com) is an excellent Platform-as-a-Service (PaaS) for deploying the NestJS Backend (`apps/api`). It supports Docker and native Node.js environments.

## Deployment via Docker (Recommended)

Since Atlas ERP is a monorepo, using Docker ensures that all shared packages (`packages/database`, `packages/types`) are correctly built and bundled with the API.

### 1. Create a Web Service
- Go to Render Dashboard -> **New** -> **Web Service**.
- Connect your GitHub repository.

### 2. Configure Service
- **Name:** e.g., `atlas-erp-api`
- **Environment:** Docker
- **Region:** Choose a region close to your Database (e.g., US East).
- **Branch:** `main`

### 3. Environment Variables
You must set all the required backend environment variables. Go to the **Environment** tab and add:

- `DATABASE_URL` (Your Neon or Render PostgreSQL connection string)
- `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` (Your Upstash details)
- `BETTER_AUTH_SECRET`, `JWT_SECRET`, `JWT_REFRESH_SECRET`
- `BETTER_AUTH_URL` (The URL Render assigns to this service, e.g., `https://atlas-erp-api.onrender.com`)
- `WEB_URL` (Your frontend URL, e.g., `https://app.yourdomain.com`)
- `TRUSTED_ORIGINS` (e.g., `https://app.yourdomain.com`)
- `PORT`: `3001`

### 4. Build and Deploy
Render will read the `Dockerfile` at the root of the repository.

*Note: Ensure your `Dockerfile` uses Turborepo's `prune` command to selectively build only `apps/api` and its dependencies.*

```dockerfile
# Example Dockerfile snippet
FROM node:22-alpine AS builder
# ... install pnpm, turbo
RUN turbo prune api --docker
# ... build the pruned workspace
RUN pnpm build --filter=api
CMD ["node", "apps/api/dist/main.js"]
```

## Running Migrations on Render

You need to ensure database migrations run before the API starts. You can configure a **Pre-Deploy Command** in Render:
```bash
pnpm --filter database prisma migrate deploy
```
*(This depends on how your Docker image is constructed. Often, it's easier to run the migration command as part of the Docker entrypoint script).*