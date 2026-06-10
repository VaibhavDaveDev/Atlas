# Database Architecture

Atlas ERP uses **PostgreSQL** as its primary relational database, managed via the **Prisma ORM**.

## Database Philosophy

1. **Strong Typing:** By using Prisma, our database schema acts as the single source of truth, automatically generating TypeScript types that are used across the frontend and backend.
2. **Relational Integrity:** We rely heavily on foreign keys, unique constraints, and database-level cascading deletes to ensure data consistency.
3. **Multi-Tenancy via Row-Level Data:** While PostgreSQL supports row-level security (RLS), Atlas enforces multi-tenancy at the application layer by ensuring every tenant-specific row includes a `workspaceId`.

## In this section

- [Schema](schema.md) — Overview of the Prisma schema and ER diagrams.
- [Migrations](migrations.md) — How to modify the database schema and apply changes.
- [Prisma Guide](prisma-guide.md) — Best practices for querying the database.
- [Seeding](seeding.md) — How to populate the database with initial/dummy data.
- [Multi-Tenancy](multi-tenancy.md) — How data isolation is enforced at the database level.