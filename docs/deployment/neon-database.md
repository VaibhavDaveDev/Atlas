---
title: Setting up Neon Database
description: Configure serverless PostgreSQL database for Atlas ERP using Neon, including connection strings, schema migrations, and database branching
tags:
  - deployment
  - database
  - neon
  - postgresql
  - serverless
  - migrations
---

# Setting up Neon Database

[Neon](https://neon.tech) is a serverless Postgres platform that separates storage and compute. It offers branching, auto-scaling, and a generous free tier, making it perfect for Atlas ERP.

## Setup Steps

1. **Create an Account:** Sign up at Neon.tech.
2. **Create a Project:**
   - **Name:** Atlas ERP
   - **Database Name:** `atlas_erp`
   - **Region:** Choose the region closest to where your API will be deployed (e.g., US East if using Render in US East).
3. **Get Connection String:**
   - Once the database is created, copy the connection string from the dashboard.
   - It will look like: `postgresql://user:password@ep-cold-surf-123456.us-east-2.aws.neon.tech/atlas_erp?sslmode=require`

## Configuring Atlas

1. Paste this connection string into your `apps/api/.env` file as `DATABASE_URL`.
2. Because Neon uses PgBouncer internally for connection pooling, you usually do not need to append `&pgbouncer=true` when using Prisma's default settings in recent versions, but keep it in mind if you experience connection exhaustion.

## Applying the Schema

From your local machine, deploy the schema to the Neon database:

```bash
# Temporarily set your local DATABASE_URL to the Neon string, then:
cd packages/database
pnpm prisma migrate deploy
```

## Branching (Advanced)

Neon allows you to create branches of your database instantly. This is incredibly useful for testing PRs in CI/CD without touching the production database.