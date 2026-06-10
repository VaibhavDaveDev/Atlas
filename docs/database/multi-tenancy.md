# Database Multi-Tenancy

Atlas ERP uses a single shared database for all tenants. Isolation is enforced using a `workspaceId` column.

This document focuses on the database-level implementation. For the architectural overview, see [Architecture -> Multi-Tenancy](../architecture/multi-tenancy.md).

## Schema Enforcement

Every model that belongs to a specific organization must have a foreign key to the `Workspace` model.

```prisma
model Invoice {
  id          String   @id @default(uuid())
  number      String
  
  // Enforcing Multi-Tenancy
  workspaceId String
  workspace   Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  // Compound Unique Constraints
  @@unique([number, workspaceId]) 
  
  // Indexing for performance
  @@index([workspaceId])
}
```

### 1. Compound Unique Constraints
Because multiple tenants share the same table, you cannot rely on simple `@unique` constraints for things like Invoice Numbers or Employee IDs. You must use compound constraints scoped to the `workspaceId`.

In the example above, `@@unique([number, workspaceId])` ensures that Tenant A and Tenant B can both have an invoice numbered "INV-001", but Tenant A cannot have two invoices numbered "INV-001".

### 2. Cascading Deletes
Notice the `onDelete: Cascade` directive. If a Workspace is deleted, the database engine will automatically and instantly delete all Invoices associated with that workspace. This ensures GDPR compliance and clean data removal without having to write complex deletion logic in the application layer.

### 3. Indexing
Because almost every query in the system will filter by `workspaceId` (e.g., `WHERE workspaceId = '123' AND status = 'PAID'`), it is critical to add `@@index([workspaceId])` to these models to ensure query performance does not degrade as the number of tenants grows.

## Writing Safe Queries

When writing raw SQL (which should be rare due to Prisma), you must manually ensure the workspace check is included.

```sql
-- DANGEROUS: Leaks data across tenants
SELECT * FROM "Invoice" WHERE "status" = 'PAID';

-- SAFE: Scoped to tenant
SELECT * FROM "Invoice" WHERE "status" = 'PAID' AND "workspaceId" = $1;
```