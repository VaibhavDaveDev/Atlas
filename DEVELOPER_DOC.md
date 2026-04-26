# Atlas ERP - Permission System

## 3-Tier Permission Model

Atlas ERP uses a flexible 3-tier permission system that provides both role-based and fine-grained access control.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    TIER 1: GLOBAL LEVEL                     │
│  GlobalRole: SUPERADMIN (IT Admin - full system access)     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  TIER 2: WORKSPACE LEVEL                    │
│  WorkspaceRole: OWNER, ADMIN, MANAGER, USER, VIEWER         │
│  (Inherited permissions via RolePermission)                 │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  TIER 3: RESOURCE LEVEL                     │
│  Custom permissions per user (UserPermission)               │
│  (Overrides or extends role permissions)                    │
└─────────────────────────────────────────────────────────────┘
```

## Database Models

### 1. Permission (Permission Definition)

Defines what actions can be performed on which resources.

```prisma
model Permission {
  id          String   @id @default(uuid())
  workspaceId String?  // null = global permission
  
  resource    String   // "leads", "deals", "payroll", "invoices"
  action      String   // "create", "read", "update", "delete", "approve"
  scope       String   // "own", "department", "all"
  description String?
  
  rolePermissions RolePermission[]
  userPermissions UserPermission[]
}
```

**Fields:**
- `workspaceId`: null for global permissions, specific ID for workspace-specific
- `resource`: The entity/module (e.g., "leads", "employees", "invoices")
- `action`: What can be done (e.g., "create", "read", "update", "delete", "approve")
- `scope`: Access scope (e.g., "own", "department", "all")

### 2. RolePermission (Role-Based Permissions)

Maps permissions to workspace roles. This is the **default permission set** for each role.

```prisma
model RolePermission {
  id           String        @id @default(uuid())
  workspaceId  String
  role         WorkspaceRole // OWNER, ADMIN, MANAGER, USER, VIEWER
  permissionId String
  permission   Permission    @relation(...)
}
```

**Purpose:**
- Define default permissions for each role
- Users automatically inherit these permissions based on their workspace role
- Easier to manage than individual user permissions

### 3. UserPermission (User-Specific Permissions)

Grants or revokes specific permissions for individual users.

```prisma
model UserPermission {
  id           String     @id @default(uuid())
  workspaceId  String
  userId       String
  permissionId String
  permission   Permission @relation(...)
  
  grantedBy    String
  grantedAt    DateTime
  expiresAt    DateTime?  // Optional expiration
}
```

**Purpose:**
- Override role permissions for specific users
- Grant additional permissions beyond role defaults
- Temporary access (via expiresAt)

## Permission Scopes

### 1. Own
User can only access their own records.

**Example:** Sales rep can only view their own leads.

```typescript
{
  resource: "leads",
  action: "read",
  scope: "own"
}
```

### 2. Department
User can access records within their department.

**Example:** Sales manager can view all leads in the sales department.

```typescript
{
  resource: "leads",
  action: "read",
  scope: "department"
}
```

### 3. All
User can access all records in the workspace.

**Example:** Admin can view all leads across all departments.

```typescript
{
  resource: "leads",
  action: "read",
  scope: "all"
}
```

## Default Role Permissions

### OWNER
- Full access to everything in the workspace
- Can manage workspace settings
- Can assign/revoke any permissions

### ADMIN
- Full access to all modules
- Can manage users and roles
- Cannot delete workspace

### MANAGER
- Full access within their department
- Can approve department-level actions
- Can view reports for their department

### USER
- Can create and edit their own records
- Can view department records (read-only)
- Cannot approve or delete

### VIEWER
- Read-only access to assigned modules
- Cannot create, edit, or delete
- Useful for auditors, stakeholders

## Example Permission Setup

### 1. Create Permissions

```typescript
// CRM Permissions
await prisma.permission.createMany({
  data: [
    // Lead permissions
    { workspaceId, resource: 'leads', action: 'create', scope: 'own' },
    { workspaceId, resource: 'leads', action: 'read', scope: 'own' },
    { workspaceId, resource: 'leads', action: 'read', scope: 'department' },
    { workspaceId, resource: 'leads', action: 'read', scope: 'all' },
    { workspaceId, resource: 'leads', action: 'update', scope: 'own' },
    { workspaceId, resource: 'leads', action: 'update', scope: 'all' },
    { workspaceId, resource: 'leads', action: 'delete', scope: 'all' },
    { workspaceId, resource: 'leads', action: 'approve', scope: 'department' },
    
    // Deal permissions
    { workspaceId, resource: 'deals', action: 'create', scope: 'own' },
    { workspaceId, resource: 'deals', action: 'read', scope: 'department' },
    { workspaceId, resource: 'deals', action: 'approve', scope: 'all' },
  ]
});
```

### 2. Assign Permissions to Roles

```typescript
// ADMIN role gets full access to leads
await prisma.rolePermission.createMany({
  data: [
    { workspaceId, role: 'ADMIN', permissionId: 'leads-read-all' },
    { workspaceId, role: 'ADMIN', permissionId: 'leads-update-all' },
    { workspaceId, role: 'ADMIN', permissionId: 'leads-delete-all' },
  ]
});

// MANAGER role gets department access
await prisma.rolePermission.createMany({
  data: [
    { workspaceId, role: 'MANAGER', permissionId: 'leads-read-department' },
    { workspaceId, role: 'MANAGER', permissionId: 'leads-approve-department' },
  ]
});

// USER role gets own access
await prisma.rolePermission.createMany({
  data: [
    { workspaceId, role: 'USER', permissionId: 'leads-create-own' },
    { workspaceId, role: 'USER', permissionId: 'leads-read-own' },
    { workspaceId, role: 'USER', permissionId: 'leads-update-own' },
  ]
});
```

### 3. Grant Special Permission to Specific User

```typescript
// Give a specific USER the ability to approve leads (exception)
await prisma.userPermission.create({
  data: {
    workspaceId,
    userId: 'user-123',
    permissionId: 'leads-approve-department',
    grantedBy: 'admin-456',
    expiresAt: new Date('2026-12-31'), // Temporary access
  }
});
```

## Permission Check Logic

### NestJS Guard Example

```typescript
@Injectable()
export class PermissionGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const { resource, action, scope } = this.extractPermission(context);
    
    // 1. Check if SUPERADMIN (bypass all checks)
    if (user.globalRole === 'SUPERADMIN') {
      return true;
    }
    
    // 2. Check workspace membership
    const membership = await this.getWorkspaceMembership(user.id, workspaceId);
    if (!membership) {
      return false;
    }
    
    // 3. Check if OWNER (full workspace access)
    if (membership.role === 'OWNER') {
      return true;
    }
    
    // 4. Check role permissions (inherited from role)
    const hasRolePermission = await this.checkRolePermission(
      workspaceId,
      membership.role,
      resource,
      action,
      scope
    );
    
    if (hasRolePermission) {
      return true;
    }
    
    // 5. Check user-specific permissions (overrides)
    const hasUserPermission = await this.checkUserPermission(
      workspaceId,
      user.id,
      resource,
      action,
      scope
    );
    
    return hasUserPermission;
  }
}
```

## Use Cases

### Use Case 1: Sales Team

**Scenario:** Sales team with reps, managers, and director.

**Setup:**
- Sales Reps (USER role):
  - Create/edit their own leads
  - View department leads (read-only)
  
- Sales Managers (MANAGER role):
  - View/edit all department leads
  - Approve deals in their department
  
- Sales Director (ADMIN role):
  - Full access to all sales data
  - Can reassign leads
  - Can approve all deals

### Use Case 2: HR Department

**Scenario:** HR team managing employee data.

**Setup:**
- HR Assistants (USER role):
  - Create employee records
  - Update attendance
  - Cannot access payroll
  
- HR Managers (MANAGER role):
  - Approve leave applications
  - View department payroll
  - Cannot modify salary structures
  
- HR Director (ADMIN role):
  - Full access to all HR data
  - Can modify salary structures
  - Can approve payroll runs

### Use Case 3: Finance Team

**Scenario:** Finance team with accountants and CFO.

**Setup:**
- Accountants (USER role):
  - Create invoices and journal entries
  - Cannot approve payments
  
- Finance Manager (MANAGER role):
  - Approve payments up to $10,000
  - View all financial reports
  
- CFO (ADMIN role):
  - Approve all payments
  - Access to all financial data
  - Can modify chart of accounts

## Best Practices

### 1. Start with Role Permissions
Define comprehensive role permissions first. Only use user permissions for exceptions.

### 2. Use Descriptive Resource Names
```typescript
// Good
resource: "payroll_runs"
resource: "employee_salary"

// Bad
resource: "payroll"  // Too broad
```

### 3. Implement Scope Checks
Always check scope in your business logic:

```typescript
async getLeads(userId: string, scope: string) {
  if (scope === 'own') {
    return prisma.lead.findMany({ where: { leadOwnerId: userId } });
  }
  if (scope === 'department') {
    const user = await this.getUserDepartment(userId);
    return prisma.lead.findMany({ where: { department: user.department } });
  }
  if (scope === 'all') {
    return prisma.lead.findMany();
  }
}
```

### 4. Audit Permission Changes
Log all permission grants/revokes in ActivityLog:

```typescript
await prisma.activityLog.create({
  data: {
    workspaceId,
    userId: grantedBy,
    entityType: 'UserPermission',
    entityId: userPermission.id,
    action: 'CREATE',
    changes: { userId, permissionId, expiresAt },
  }
});
```

### 5. Use Temporary Permissions
For temporary access, always set `expiresAt`:

```typescript
{
  expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
}
```

## Migration Strategy

### Phase 1: Define Core Permissions
Create permissions for all resources and actions.

### Phase 2: Set Up Role Permissions
Map permissions to each workspace role.

### Phase 3: Implement Guards
Add permission checks to all protected routes.

### Phase 4: UI Integration
Show/hide UI elements based on user permissions.

### Phase 5: Audit & Refine
Monitor permission usage and adjust as needed.

## API Endpoints

### Check Permission
```
GET /api/v1/permissions/check?resource=leads&action=read&scope=all
Response: { hasPermission: true }
```

### List User Permissions
```
GET /api/v1/users/:userId/permissions
Response: [{ resource, action, scope, source: 'role' | 'user' }]
```

### Grant User Permission
```
POST /api/v1/users/:userId/permissions
Body: { permissionId, expiresAt? }
```

### Revoke User Permission
```
DELETE /api/v1/users/:userId/permissions/:permissionId
```

## Summary

The 3-tier permission model provides:

✅ **Flexibility:** Role-based defaults + user-specific overrides  
✅ **Scalability:** Easy to manage large teams  
✅ **Security:** Fine-grained access control  
✅ **Auditability:** Track all permission changes  
✅ **Simplicity:** Intuitive role hierarchy
