# Platform Administration (IT Admin)

The Platform Admin module (sometimes referred to as IT Admin) is the global control center for Atlas ERP. 

## Purpose

Unlike workspace-level administration (which manages a single tenant's data), the Platform Admin module manages the global deployment, system-wide configuration, and cross-tenant observability.

## Key Features

1. **Global Tenant Management:** View, suspend, or provision new workspaces globally.
2. **System Auditing:** View top-level system logs and audit trails.
3. **Configuration:** Manage global feature flags and system limits.
4. **Subscription / Billing:** (If applicable) Manage billing plans for different workspaces.

## File Structure

**Frontend (`apps/web/src/app/dashboard/platform-admin/`):**
- Contains pages and layouts exclusively accessible to users with a global `PlatformAdmin` role.

## Security Context

Platform Administration bypasses standard `WorkspaceGuard` restrictions because Platform Admins operate *above* the workspace level.

Instead, these routes are heavily protected by ensuring the user has a specific global role or boolean flag (`isSuperAdmin: true`) on their Better Auth `AuthUser` record. This guarantees that a regular user, even if they are a Workspace Admin, cannot access the platform administration portal.