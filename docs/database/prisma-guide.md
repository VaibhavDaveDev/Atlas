# Prisma Guide

This guide covers best practices and common patterns for querying the database using Prisma within the Atlas ERP backend.

## 1. Dependency Injection

Never instantiate `new PrismaClient()` directly in your services. Always inject the `PrismaService` (which extends `PrismaClient` and handles connection management).

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}
  
  // ... methods
}
```

## 2. Multi-Tenancy Enforcement

As discussed in the Multi-Tenancy architecture, you **must** include the `workspaceId` in almost every query to prevent data leakage.

```typescript
// GOOD: Safe query
const project = await this.prisma.project.findFirst({
  where: {
    id: projectId,
    workspaceId: user.workspaceId,
  },
});
```

## 3. Selecting Specific Fields

Avoid fetching entire rows if you only need a few columns. This reduces memory usage and speeds up database queries.

```typescript
const users = await this.prisma.user.findMany({
  where: { workspaceId: id },
  select: {
    id: true,
    email: true,
    name: true,
    // Password hash and other sensitive fields are NOT fetched
  },
});
```

## 4. Including Relationships

Use the `include` keyword to fetch related data in a single query (Prisma handles the underlying JOINs).

```typescript
const invoice = await this.prisma.invoice.findFirst({
  where: { id: invoiceId, workspaceId },
  include: {
    items: true,        // Include all invoice items
    customer: {         // Nested include
      select: {
        name: true,
        email: true
      }
    }
  }
});
```

## 5. Transactions

When performing multiple write operations that must succeed or fail together (e.g., generating payroll entries), use Interactive Transactions.

```typescript
async generatePayroll(runId: string, workspaceId: string) {
  return await this.prisma.$transaction(async (tx) => {
    // 1. Mark run as processing
    await tx.payrollRun.update({
      where: { id: runId },
      data: { status: 'PROCESSING' }
    });
    
    // 2. Insert entries
    await tx.payrollEntry.createMany({
      data: entries
    });
    
    // 3. Mark run as complete
    return await tx.payrollRun.update({
      where: { id: runId },
      data: { status: 'COMPLETED' }
    });
  });
}
```

## 6. Pagination

For endpoints returning lists of data, always implement pagination using `skip` and `take` (Offset Pagination) or `cursor` (Cursor-based Pagination).

```typescript
async getProjects(workspaceId: string, page: number = 1, limit: number = 10) {
  const skip = (page - 1) * limit;
  
  const [data, total] = await Promise.all([
    this.prisma.project.findMany({
      where: { workspaceId },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    }),
    this.prisma.project.count({ where: { workspaceId } })
  ]);
  
  return { data, total, page, limit };
}
```