---
title: Prerequisites
description: Required software and services needed before installing Atlas ERP including Node.js, pnpm, PostgreSQL, Redis, and third-party service accounts
tags:
  - getting-started
  - prerequisites
  - setup
  - requirements
  - installation
  - node
  - postgresql
  - redis
---

# Prerequisites

Before installing Atlas ERP, ensure you have the following installed on your system.

## Required Software

### Node.js
- **Version:** >= 22.0.0
- **Download:** [nodejs.org](https://nodejs.org/)
- **Verify:** `node --version`

### pnpm
- **Version:** >= 10.0.0 (project uses pnpm@11.1.2)
- **Install:** `npm install -g pnpm@11.1.2`
- **Verify:** `pnpm --version`

### PostgreSQL
- **Version:** >= 17.0
- **Download:** [postgresql.org](https://www.postgresql.org/download/)
- **Verify:** `psql --version`
- **Alternative:** Use [Neon](https://neon.tech) for managed PostgreSQL (free tier available)

### Redis
- **Version:** >= 8.0
- **Download:** [redis.io](https://redis.io/download/)
- **Verify:** `redis-cli --version`
- **Alternative:** Use [Upstash Redis](https://upstash.com) for managed Redis (free tier available)

## Optional Software

### Docker (Recommended for Development)
- **Version:** >= 24.0
- **Download:** [docker.com](https://www.docker.com/get-started/)
- **Use case:** Run PostgreSQL and Redis in containers
- **Verify:** `docker --version`

### Git
- **Version:** >= 2.40
- **Download:** [git-scm.com](https://git-scm.com/)
- **Verify:** `git --version`

## Third-Party Service Accounts

### Better Auth (Authentication)
- No signup required — configure secrets in `.env`

### Brevo (Transactional Email)
- **Sign up:** [brevo.com](https://www.brevo.com/)
- **Get API key:** Dashboard → API Keys → Create API Key
- **Verify sender:** Senders & Domains → Add sender email

### Google OAuth (Optional)
- **Console:** [console.cloud.google.com](https://console.cloud.google.com/apis/credentials)
- **Create:** OAuth 2.0 Client ID
- **Authorized redirect URI:** `http://127.0.0.1:3000/auth/callback`

### Cloudflare Turnstile (CAPTCHA)
- **Sign up:** [dash.cloudflare.com/turnstile](https://dash.cloudflare.com/?to=/:account/turnstile)
- **Get keys:** Site key (public) and Secret key (server)

### Gravatar API (Optional)
- **Docs:** [docs.gravatar.com](https://docs.gravatar.com/rest-api/)
- **Get credentials:** Client ID, Client Secret, API Key

## System Requirements

### Minimum
- **CPU:** 2 cores
- **RAM:** 4 GB
- **Disk:** 10 GB free space
- **OS:** Windows, macOS, Linux

### Recommended
- **CPU:** 4+ cores
- **RAM:** 8+ GB
- **Disk:** 20+ GB free space (SSD preferred)
- **OS:** macOS or Linux for best development experience

## Network Requirements

- **Ports:**
  - `3000` — Next.js frontend
  - `3001` — NestJS backend
  - `5432` — PostgreSQL
  - `6379` — Redis
  - `3100` — Loki (optional, for logging)

## Next Steps

Once you have all prerequisites installed, proceed to [Installation](installation.md).