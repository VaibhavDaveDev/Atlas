# Database Seeding

Seeding is the process of populating the database with initial data required for the application to function, or dummy data for development purposes.

## The Seed Script

Atlas ERP uses a Prisma seed script located at `packages/database/prisma/seed.ts`. 

This script is automatically executed when you run:
```bash
pnpm db:seed
```
*(This is an alias for `pnpm prisma db seed` defined in the root `package.json` or database package)*

## What does the seed script do?

By default, the seed script is designed to be idempotent (safe to run multiple times without creating duplicate errors). It typically handles:

1. **System Roles & Permissions:** Creates default templates for 'Admin', 'Manager', 'Employee', etc.
2. **Default Workspace:** Creates a default organization if none exists.
3. **Admin User:** Creates an initial super-admin user so you can log into the system immediately after setup.
4. **Master Data:** In some modules like HR or Finance, it might seed standard Leave Types (Sick, Casual) or a default Chart of Accounts template.

## Example Seed Logic

```typescript
// packages/database/prisma/seed.ts
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // 1. Create Default Workspace
  const workspace = await prisma.workspace.upsert({
    where: { id: 'default-workspace' },
    update: {},
    create: {
      id: 'default-workspace',
      name: 'Acme Corporation',
    },
  });

  // 2. Create Admin Role
  const adminRole = await prisma.role.upsert({
    where: { name_workspaceId: { name: 'Admin', workspaceId: workspace.id } },
    update: {},
    create: {
      name: 'Admin',
      description: 'Full system access',
      workspaceId: workspace.id,
    },
  });

  // ... (Create user and attach role)

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

## Module-Specific Seeds

For complex modules, we might have separate seed scripts (e.g., `apps/api/src/hr/seed-india.ts` found in the codebase). These can be run individually to populate specific localizations or complex master data setups that aren't required by every tenant.

## Seeding in Production

Be very careful when running seed scripts in production. Our seed scripts use `upsert` extensively to ensure they don't overwrite existing user-modified data, but it is generally recommended to only run the seed script during the initial deployment of a new environment.