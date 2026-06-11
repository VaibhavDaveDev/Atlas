---
title: Atlas ERP Documentation
description: Complete developer documentation for Atlas ERP - a multi-tenant cloud ERP suite built with Next.js, NestJS, and Prisma ORM
tags:
  - home
  - overview
  - getting-started
  - erp
  - multi-tenant
---

# Atlas ERP Documentation

Welcome to the official documentation for **Atlas ERP** — a multi-tenant cloud ERP suite built for modern businesses.

## 🚀 What is Atlas ERP?

Atlas ERP is an open-source, cloud-native Enterprise Resource Planning system that combines:

- **Multi-tenancy** — Secure tenant isolation for SaaS deployment
- **Modular Architecture** — HR, Payroll, Finance, Projects
- **Modern Stack** — Built with Next.js 15, NestJS 11, and Prisma ORM
- **Developer-First** — Full API access, comprehensive documentation

## ⚡ Quick Reference

<div class="grid cards" markdown>

-   :material-console:{ .lg .middle } __Common Commands__

    ---

    ```bash
    # Install dependencies
    pnpm install
    
    # Start development servers
    pnpm dev
    
    # Run database migrations
    pnpm db:migrate
    
    # Seed database
    pnpm db:seed
    
    # Build for production
    pnpm build
    
    # Run tests
    pnpm test
    ```
    
    [:octicons-arrow-right-24: All Commands](reference/package-json-scripts.md)

-   :material-book-open-variant:{ .lg .middle } __Quick Links__

    ---

    - [Installation Guide](getting-started/installation.md)
    - [Environment Setup](getting-started/environment-variables.md)
    - [API Authentication](api/authentication.md)
    - [Database Schema](database/schema.md)
    - [Troubleshooting](reference/troubleshooting-guide.md)
    - [Glossary](reference/glossary.md)

</div>

## 📚 Quick Navigation

<div class="grid cards" markdown>

-   :material-rocket-launch:{ .lg .middle } __Getting Started__

    ---

    Install Atlas ERP locally in under 5 minutes
    
    [:octicons-arrow-right-24: Installation Guide](getting-started/installation.md)

-   :material-file-tree:{ .lg .middle } __Architecture__

    ---

    Understand the system design and technical decisions
    
    [:octicons-arrow-right-24: Architecture Overview](architecture/overview.md)

-   :material-api:{ .lg .middle } __API Reference__

    ---

    Complete REST and GraphQL API documentation
    
    [:octicons-arrow-right-24: API Docs](api/index.md)

-   :material-application-cog:{ .lg .middle } __Modules__

    ---

    Explore available ERP modules and features
    
    [:octicons-arrow-right-24: Module Guide](modules/index.md)

-   :material-rocket:{ .lg .middle } __Deployment__

    ---

    Deploy to Vercel, Cloudflare, or your own infrastructure
    
    [:octicons-arrow-right-24: Deployment Guide](deployment/index.md)

-   :material-hand-heart:{ .lg .middle } __Contributing__

    ---

    Join the community and contribute to Atlas ERP
    
    [:octicons-arrow-right-24: Contribution Guide](contributing/index.md)

</div>

## 🛠️ Tech Stack Overview

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 15, React 19, TailwindCSS, Zustand |
| **Backend** | NestJS 11, Prisma ORM, GraphQL, REST |
| **Database** | PostgreSQL 17, Prisma migrations |
| **Cache** | Redis 8 |
| **Queue** | BullMQ (Redis-backed) |
| **Auth** | Better Auth, JWT, OAuth (Google) |
| **Email** | Brevo (transactional) |
| **Monitoring** | Grafana + Loki (optional) |
| **Deployment** | Vercel, Cloudflare Pages, Render |

## 🎯 Key Features

- ✅ **Multi-tenant architecture** with secure isolation
- ✅ **Core ERP modules:** HR, Payroll, Finance, Projects
- ✅ **Authentication:** Email/password, magic links, OAuth (Google)
- ✅ **i18n support:** Multi-language using Lingui
- ✅ **Real-time updates:** WebSocket support via NestJS
- ✅ **Job queues:** Background processing with BullMQ
- ✅ **Type-safe:** End-to-end TypeScript
- ✅ **Monorepo:** Turborepo for efficient builds
- ✅ **Free tier deployment:** Works on Vercel, Neon, Upstash free plans

## 🔗 Links

- [GitHub Repository](https://github.com/VaibhavDaveDev/Atlas)
- [Live Demo](https://atlas-cloud-erp.vercel.app)
- [Issue Tracker](https://github.com/VaibhavDaveDev/Atlas/issues)
- [License (AGPLv3)](license.md)

## 📖 Documentation Structure

This documentation is organized into several sections:

- **Getting Started** — Installation, setup, and first steps
- **Architecture** — System design, patterns, and technical decisions
- **Backend** — NestJS API, services, modules
- **Frontend** — Next.js app, routing, state management
- **Database** — Prisma schema, migrations, queries
- **API Reference** — Complete endpoint documentation
- **Integrations** — Third-party service setup
- **Deployment** — Production deployment guides
- **Modules** — ERP module documentation
- **Development** — Contributing, testing, debugging
- **Reference** — Configuration, scripts, troubleshooting

---

**License:** Atlas ERP is licensed under AGPLv3. See [License](license.md) for details.