<div align="center">
  <img src="apps\web\src\app\images\logo-full-dark.png" alt="Atlas Logo" width="400" />
</div>

# Project Atlas

AI-Powered Cloud ERP Suite built with Turborepo

## What's inside?

This Turborepo includes the following packages/apps:

### Apps

- `api`: NestJS 11 backend with Prisma ORM
- `web`: Next.js 15 frontend application

### Packages

- `@atlas/database`: Prisma schema and database client
- `@atlas/ui`: Shared UI components (TailwindCSS + Linaria)
- `@atlas/types`: Shared TypeScript types
- `@atlas/config`: Shared configuration (ESLint, TypeScript, etc.)
- `@atlas/utils`: Shared utility functions

## Tech Stack

- **Monorepo**: Turborepo
- **Backend**: NestJS 11 + Prisma
- **Frontend**: Next.js 15 + React 19
- **Database**: PostgreSQL 17
- **Styling**: TailwindCSS
- **State**: Zustand
- **i18n**: Lingui
- **API**: GraphQL + REST
- **Cache**: Redis 8
- **Jobs**: BullMQ

## Getting Started

### Prerequisites

- Node.js >= 22.0.0
- pnpm >= 10.0.0
- PostgreSQL 17
- Redis 8

### Installation

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# Generate Prisma client
pnpm db:generate

# Run database migrations
pnpm db:migrate

# Start development servers
pnpm dev
```

### Development

```bash
# Run all apps in development mode
pnpm dev

# Build all apps
pnpm build

# Run tests
pnpm test

# Lint code
pnpm lint

# Format code
pnpm format
```

### Database Commands

```bash
# Generate Prisma client
pnpm db:generate

# Push schema changes (dev only)
pnpm db:push

# Create and run migrations
pnpm db:migrate

# Open Prisma Studio
pnpm db:studio
```

## Project Structure

```
project-atlas/
├── apps/
│   ├── api/          # NestJS backend
│   └── web/          # Next.js frontend
├── packages/
│   ├── database/     # Prisma schema
│   ├── ui/           # Shared components
│   ├── types/        # TypeScript types
│   ├── config/       # Shared configs
│   └── utils/        # Utilities
├── turbo.json        # Turborepo config
├── package.json      # Root package.json
└── pnpm-workspace.yaml
```

## Modules

- **CRM**: Customer relationship management (from Twenty)
- **HR**: Employee management, attendance, leave
- **Payroll**: Payroll processing, payslips
- **Finance**: Accounting, invoices, payments
- **Supply Chain**: Inventory, purchase orders, vendors
- **Projects**: Project management, tasks, cycles
- **AI/ML**: Forecasting, anomaly detection

