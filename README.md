<div align="center">
  <img src="apps/web/src/app/images/logo-full-light.png" alt="Atlas ERP" width="200" />
  
  <p align="center">
    <strong>AI-Powered Cloud ERP Suite for Modern Businesses</strong>
  </p>

  <p align="center">
    <a href="https://github.com/VaibhavDaveDev/Atlas/blob/main/LICENSE">
      <img src="https://img.shields.io/badge/License-AGPL%20v3-blue.svg" alt="License: AGPL v3" />
    </a>
    <a href="https://nodejs.org/">
      <img src="https://img.shields.io/badge/node-%3E%3D22.0.0-brightgreen" alt="Node.js Version" />
    </a>
    <a href="https://www.typescriptlang.org/">
      <img src="https://img.shields.io/badge/TypeScript-5.7-blue" alt="TypeScript" />
    </a>
    <a href="https://nextjs.org/">
      <img src="https://img.shields.io/badge/Next.js-15-black" alt="Next.js" />
    </a>
    <a href="https://nestjs.com/">
      <img src="https://img.shields.io/badge/NestJS-11-red" alt="NestJS" />
    </a>
  </p>

  <p align="center">
    <a href="https://atlas-cloud-dusky.vercel.app">Live Demo</a> •
    <a href="#getting-started">Getting Started</a> •
    <a href="#documentation">Documentation</a> •
    <a href="https://github.com/VaibhavDaveDev/Atlas/issues">Report Bug</a> •
    <a href="https://github.com/VaibhavDaveDev/Atlas/issues">Request Feature</a>
  </p>
</div>

---

## Overview

Atlas ERP is an open-source, cloud-native Enterprise Resource Planning system designed for scalability, multi-tenancy, and developer experience. Built with modern technologies, Atlas combines AI capabilities with enterprise-grade architecture to deliver a comprehensive business management solution.

### Key Features

- **Multi-tenant architecture** with secure tenant isolation
- **Modular ERP system** (CRM, HR, Payroll, Finance, Supply Chain, Projects)
- **AI/ML capabilities** for forecasting and anomaly detection
- **Modern tech stack** (Next.js 15, NestJS 11, PostgreSQL, Redis)
- **Comprehensive API** (REST + GraphQL)
- **Built for scale** with background job processing and caching
- **Developer-friendly** with full TypeScript support and monorepo architecture

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Configuration](#configuration)
- [Development](#development)
- [Modules](#modules)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

---

## Tech Stack

### Frontend
- **Framework:** Next.js 15 with React 19
- **Styling:** TailwindCSS 
- **State Management:** Zustand
- **Internationalization:** Lingui
- **UI Components:** Radix UI, Tremor

### Backend
- **Framework:** NestJS 11
- **Database:** PostgreSQL 17 with Prisma ORM
- **Cache:** Redis 8
- **Queue:** BullMQ
- **API:** REST + GraphQL
- **Authentication:** Better Auth with JWT

### Infrastructure
- **Monorepo:** Turborepo
- **Package Manager:** pnpm
- **Email:** Brevo (transactional)
- **Monitoring:** Grafana + Loki (optional)
- **Deployment:** Vercel, Cloudflare Pages, Render

---

## Project Structure

```
Atlas/
├── apps/
│   ├── api/                    # NestJS Backend
│   │   ├── src/
│   │   │   ├── modules/        # Feature modules (Auth, CRM, HR, etc.)
│   │   │   ├── common/         # Shared utilities, guards, filters
│   │   │   ├── config/         # Configuration
│   │   │   └── main.ts
│   │   └── package.json
│   │
│   └── web/                    # Next.js Frontend
│       ├── src/
│       │   ├── app/            # App router pages
│       │   ├── components/     # React components
│       │   └── lib/            # Utilities, hooks, stores
│       └── package.json
│
├── packages/
│   ├── database/               # @atlas/database - Prisma schema & client
│   ├── ui/                     # @atlas/ui - Shared components
│   ├── types/                  # @atlas/types - TypeScript types
│   ├── config/                 # @atlas/config - Shared configs
│   └── utils/                  # @atlas/utils - Utility functions
│
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

---

## Getting Started

### Prerequisites

Ensure you have the following installed:

- **Node.js** 22.0.0 or higher
- **pnpm** 10.0.0 or higher
- **PostgreSQL** 17 or higher (or use [Neon](https://neon.tech))
- **Redis** 8 or higher (or use [Upstash](https://upstash.com))

### Installation

```bash
# Clone the repository
git clone https://github.com/VaibhavDaveDev/Atlas.git
cd Atlas

# Install dependencies
pnpm install

# Set up environment variables
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# Configure your environment variables (see Configuration section)

# Generate Prisma client
pnpm db:generate

# Run database migrations
pnpm db:migrate

# (Optional) Seed database with sample data
pnpm db:seed

# Start development servers
pnpm dev
```

The application will be available at:
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:3001

### Configuration

#### Backend (`apps/api/.env`)

```bash
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/atlas_erp"

# API
PORT=3001
API_PREFIX=api/v1

# Authentication
BETTER_AUTH_SECRET="your-secret-min-32-chars"
BETTER_AUTH_URL="http://localhost:3001"
JWT_SECRET="your-jwt-secret"
JWT_REFRESH_SECRET="your-refresh-secret"

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Email (Brevo)
BREVO_API_KEY="your-brevo-api-key"
EMAIL_FROM="your-email@example.com"

# Frontend URL
WEB_URL="http://localhost:3000"
```

#### Frontend (`apps/web/.env`)

```bash
NEXT_PUBLIC_API_URL="http://localhost:3001"
```

See `.env.example` files for complete configuration options.

---

## Development

### Available Commands

```bash
# Development
pnpm dev              # Start all apps in development mode
pnpm dev:api          # Start backend only
pnpm dev:web          # Start frontend only

# Building
pnpm build            # Build all apps
pnpm start            # Start production builds

# Code Quality
pnpm lint             # Lint code
pnpm format           # Format code with Prettier
pnpm test             # Run tests

# Database
pnpm db:generate      # Generate Prisma client
pnpm db:migrate       # Run migrations
pnpm db:push          # Push schema (dev only)
pnpm db:studio        # Open Prisma Studio
pnpm db:seed          # Seed database

# Maintenance
pnpm clean            # Clean build artifacts
pnpm clean:dist       # Clean all dist/build folders
```

---

## Modules

Atlas ERP consists of several integrated modules:

| Module | Status | Description |
|--------|--------|-------------|
| **CRM** | Planned | Customer relationship management, contacts, deals, pipeline |
| **HR** | Developed | Employee management, attendance tracking, leave management |
| **Payroll** | Developed | Payroll processing, payslip generation |
| **Finance** | Developed | Accounting, invoices, payments, financial reports |
| **Projects** | In Development | Project management, task tracking, time logging |
| **AI/ML** | Planned | Forecasting, anomaly detection, predictive analytics |

---

## Deployment

### Recommended Setup (Free Tier)

| Service | Component | Free Tier Available |
|---------|-----------|---------------------|
| **Vercel** | Frontend (Next.js) | Yes |
| **Render/Railway** | Backend (NestJS) | Yes |
| **Neon** | PostgreSQL | Yes (10 GB) |
| **Upstash** | Redis | Yes (10k commands/day) |

### Quick Deploy

#### Frontend to Vercel

```bash
npm i -g vercel
cd apps/web
vercel
```

Or use the Deploy button:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/VaibhavDaveDev/Atlas)

#### Backend to Render

1. Connect your GitHub repository
2. Select `apps/api` as root directory
3. Build command: `pnpm install && pnpm build`
4. Start command: `pnpm start:prod`

#### Environment Variables

Ensure all required environment variables are configured in your deployment platform. See the Configuration section for required variables.

---

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please ensure:
- Code follows the existing style
- Tests pass
- Commit messages are clear and descriptive
- Documentation is updated as needed

---

## License

Atlas ERP is licensed under the **GNU Affero General Public License v3.0 (AGPLv3)**.

This means you are free to use, modify, and distribute this software, but any modifications must also be open-sourced under AGPLv3. The AGPL's network clause requires that if you run a modified version on a server and let users interact with it, you must provide them access to the modified source code.

See the [LICENSE](LICENSE) file for full details.

---

<div align="center">
  <p>Built by the Vaibhav Dave</p>
  <p>
    <a href="https://atlas-cloud-dusky.vercel.app">Website</a> •
    <a href="https://github.com/VaibhavDaveDev/Atlas">GitHub</a> •
    <a href="https://github.com/VaibhavDaveDev/Atlas/issues">Issues</a>
  </p>
</div>