# Backend Project Structure

The NestJS backend (`apps/api/src`) is organized around business domains (Modules), following Domain-Driven Design (DDD) principles where applicable.

## Directory Layout

```text
apps/api/src/
├── main.ts                     # Application entry point
├── app.module.ts               # Root module
├── auth/                       # Authentication and authorization
├── common/                     # Cross-cutting concerns shared everywhere
│   ├── config/                 # Environment configurations
│   ├── decorators/             # Custom NestJS decorators
│   ├── dto/                    # Standardized response DTOs
│   ├── errors/                 # Custom error classes
│   ├── filters/                # Global exception filters
│   ├── guards/                 # Security guards
│   ├── interceptors/           # Global interceptors
│   ├── modules/                # Core infrastructure modules (Logger, Queue)
│   ├── queues/                 # BullMQ queue processors
│   └── services/               # Shared services (Email, Redis)
├── finance/                    # Finance Domain Module
│   ├── accounts/
│   ├── invoices/
│   ├── journals/
│   └── payments/
├── hr/                         # Human Resources Domain Module
├── project/                    # Project Management Domain Module
│   ├── projects/
│   ├── tasks/
│   └── milestones/
├── role/                       # Role and Permissions management
├── user/                       # User profile management
├── workspace/                  # Workspace (Tenant) management
└── metrics/                    # System metrics collection
```

## Structure of a Feature Module

Inside a domain folder (like `finance` or `project`), you will typically find sub-modules or a single cohesive module depending on complexity. 

A standard feature component (e.g., `projects`) looks like this:

```text
projects/
├── dto/
│   ├── create-project.dto.ts   # Validation for POST
│   └── update-project.dto.ts   # Validation for PATCH
├── projects.controller.ts      # HTTP Route definitions
├── projects.service.ts         # Business logic and Prisma calls
├── projects.service.spec.ts    # Unit tests
└── project.module.ts           # Module definition, registering controllers/services
```

## The `common` Directory

The `common` directory is critical as it contains logic that is not tied to a specific business domain. 
- **`config/`**: Contains typed configuration files (e.g., `winston.config.ts`, `swagger.config.ts`).
- **`decorators/`**: Things like `@CurrentUser()`, `@Workspace()`.
- **`guards/`**: Things like `AuthGuard`, `WorkspaceGuard`.
- **`queues/`**: Background processors that multiple modules might need (like `email.processor.ts`).