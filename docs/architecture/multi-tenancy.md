# Multi-Tenancy Architecture

Atlas ERP is designed to serve multiple organizations (tenants) from a single deployment while ensuring strict data isolation. 

## The Multi-Tenant Model

Atlas utilizes a **Logical Isolation** (Row-Level Isolation) strategy. 
- All tenants share the same application instances (NestJS APIs and Next.js Web Apps).
- All tenants share the same PostgreSQL database.
- Data isolation is enforced using a `workspaceId` (or `organizationId`) column on nearly every table.

### Why Logical Isolation?
- **Cost-Effective:** Sharing infrastructure reduces hosting costs significantly compared to database-per-tenant or instance-per-tenant models.
- **Easier Maintenance:** Running migrations and updating the application happens once for all tenants.
- **Scalability:** Handles thousands of small to medium tenants efficiently on standard connection pools.

## Database Schema Implementation

Almost every entity in the Prisma schema belongs to a `Workspace` (Organization).

```prisma
model Workspace {
  id          String   @id @default(uuid())
  name        String
  // ... other fields
  
  projects    Project[]
  employees   Employee[]
  invoices    Invoice[]
  // ...
}

model Project {
  id          String    @id @default(uuid())
  name        String
  workspaceId String    // The Foreign Key enforcing multi-tenancy
  workspace   Workspace @relation(fields: [workspaceId], references: [id])
}
```

## Security & Data Isolation Enforcement

It is critical that Tenant A cannot access Tenant B's data. This is enforced at the API layer.

### 1. The Workspace Context
When a user logs in, they select an active workspace. The backend issues a JWT that includes the `workspaceId`. 

### 2. The Workspace Guard
Every API endpoint that deals with tenant-specific data is protected by the `WorkspaceGuard`.

```typescript
// apps/api/src/auth/guards/workspace.guard.ts
@Injectable()
export class WorkspaceGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    // Ensure the user has an active workspace selected
    if (!user.workspaceId) {
      throw new ForbiddenException('No workspace selected');
    }
    
    // Ensure the user is actually a member of this workspace
    // (Checked during login/token generation, but can be verified here too)
    return true;
  }
}
```

### 3. Service-Level Enforcement
Within NestJS Services, the `workspaceId` is extracted from the request context and **always** appended to Prisma queries.

```typescript
// Bad: Vulnerable to cross-tenant data leakage
async getProject(projectId: string) {
  return this.prisma.project.findUnique({ where: { id: projectId } });
}

// Good: Enforces multi-tenancy
async getProject(projectId: string, workspaceId: string) {
  return this.prisma.project.findFirst({
    where: { 
      id: projectId,
      workspaceId: workspaceId // Automatically scopes the query
    }
  });
}
```

By ensuring that `workspaceId` is a required parameter in all service methods and always included in `where` clauses, the risk of data leakage is minimized.