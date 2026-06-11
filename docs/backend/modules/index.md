# Backend Modules

The Atlas ERP backend is divided into logical, domain-driven modules. Each module encapsulates the controllers, services, and logic for a specific area of the application.

## Available Modules

- [Auth Module](auth.md) — Authentication, sessions, and OAuth logic.
- [Finance Module](finance.md) — Accounts, invoices, journals, and payments.
- [HR Module](hr.md) — Employees, attendance, leaves, and payroll.
- [Project Module](project.md) — Projects, tasks, milestones, and time tracking.

## Infrastructure Modules

These modules provide cross-cutting functionality to the domain modules:

- **LoggerModule:** Configures Winston and Loki integrations.
- **QueueModule:** Configures BullMQ and Redis connections for background jobs.
- **RedisModule:** Provides a generic caching and key-value store interface.
- **RateLimitModule:** Configures `ThrottlerGuard` for API endpoint protection.
- **WorkspaceModule:** Tenant isolation and organization settings.
- **RoleModule:** RBAC, permissions, and roles.
- **NotificationsModule:** In-app alerts and email dispatches.
- **LogsModule:** Audit trails and system activity logs.