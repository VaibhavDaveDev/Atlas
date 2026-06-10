# Monorepo Structure

Atlas ERP utilizes [Turborepo](https://turbo.build/) to manage its multi-package architecture (monorepo). This structure allows for code sharing, unified tooling, and optimized, cached builds.

## Directory Layout

The repository is structured into `apps` (deployable applications) and `packages` (shared libraries).

```text
Atlas/
├── apps/
│   ├── api/                 # NestJS backend application
│   └── web/                 # Next.js frontend application
├── packages/
│   ├── config/              # Shared configuration (ESLint, TypeScript)
│   ├── database/            # Prisma schema and client
│   ├── types/               # Shared TypeScript definitions
│   ├── ui/                  # Shared React UI components
│   └── utils/               # Shared utility functions
├── turbo.json               # Turborepo configuration
├── pnpm-workspace.yaml      # Workspace definitions
└── package.json             # Root dependencies and scripts
```

## Packages Breakdown

### `apps/api`
The core backend service built with NestJS 11. It consumes `packages/database`, `packages/types`, and `packages/utils`. It handles all business logic, database transactions, and exposes REST endpoints.

### `apps/web`
The frontend user interface built with Next.js 15. It consumes `packages/types`, `packages/ui`, and `packages/utils`. It communicates with the `api` app over HTTP.

### `packages/database`
Contains the `schema.prisma` file, which defines the entire data model for the ERP. Running `prisma generate` here creates the Prisma Client, which is then exported and used by `apps/api` (and potentially `apps/web` for server-components if direct DB access is ever needed, though API-first is preferred).

### `packages/types`
The single source of truth for TypeScript interfaces and types shared across the stack. For example, the structure of an API response or a specific ERP DTO is defined here so both frontend and backend are strictly typed.

### `packages/ui`
A shared component library (often built on top of Radix UI or shadcn/ui). This ensures design consistency across the web application and any future frontend apps.

### `packages/utils`
Shared utility functions, such as date formatting, validation helpers, or calculation logic that both the frontend and backend might need to use independently.

## Turborepo Workflows

Turborepo (`turbo.json`) optimizes tasks like building, testing, and linting.

```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"]
    },
    "lint": {
      "dependsOn": ["^build"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

When you run `pnpm build` at the root, Turborepo builds the packages in the correct topological order (e.g., `packages/types` -> `packages/database` -> `apps/api` -> `apps/web`). If a package hasn't changed, Turborepo retrieves the build artifacts from the cache, significantly speeding up CI/CD pipelines.