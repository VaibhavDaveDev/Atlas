---
title: CI/CD Pipeline
description: Automated continuous integration and deployment for Atlas ERP using GitHub Actions, including linting, testing, and deployment workflows
tags:
  - deployment
  - ci-cd
  - github-actions
  - automation
  - testing
  - continuous-integration
---

# CI/CD Pipeline

Atlas ERP uses GitHub Actions to automate linting, testing, and deployment.

## Overview of Workflows

Workflows are defined in `.github/workflows/`.

1. **CI (Continuous Integration):** Runs on every Pull Request to `main`.
2. **CD (Continuous Deployment):** Runs when a PR is merged into `main`.

## The CI Pipeline (`ci.yml`)

The CI pipeline ensures code quality before it can be merged.

```yaml
name: CI Pipeline

on:
  pull_request:
    branches: [main]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup pnpm
        uses: pnpm/action-setup@v3
        with:
          version: 11.1.2
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'pnpm'
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Lint
        run: pnpm lint
        
      - name: Test
        run: pnpm test
        
      - name: Build
        run: pnpm build
```

## The CD Pipeline

If you are using Vercel and Render, you often don't need a complex CD pipeline in GitHub Actions, because those platforms offer **Automatic Git Deployments**.

- **Vercel:** Automatically builds and deploys the `apps/web` directory when changes are pushed to `main`.
- **Render:** Automatically builds and deploys the `apps/api` directory when changes are pushed to `main`.

### Custom Deployment Script

If you are deploying to a VPS or custom server, you can use GitHub actions to SSH into your server and run a deployment script.

```yaml
# Example snippet for custom deployment
      - name: Deploy to Server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /var/www/atlas-erp
            git pull origin main
            pnpm install
            pnpm build
            pm2 restart atlas-api
            pm2 restart atlas-web
```