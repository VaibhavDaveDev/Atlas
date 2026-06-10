# Backend Architecture

The backend of Atlas ERP is a monolithic REST/GraphQL API built with **NestJS 11**. It is responsible for handling all business logic, database interactions, authentication, and background job processing.

## Core Design Principles

1. **Modular Architecture:** The application is divided into feature-specific modules (e.g., `FinanceModule`, `HrModule`, `ProjectModule`). This makes the codebase easier to navigate and allows teams to work independently.
2. **Dependency Injection:** NestJS's robust DI container is used extensively to keep code testable and loosely coupled.
3. **Data Transfer Objects (DTOs):** All incoming request bodies and query parameters are strictly validated using DTO classes decorated with `class-validator`.
4. **Prisma ORM:** Database access is abstracted through Prisma, providing type-safe queries.

## In this section

- [Project Structure](project-structure.md) — How the `apps/api` directory is organized.
- **Modules** — Deep dives into specific business domains (e.g., [HR Module](modules/hr.md), [Finance Module](modules/finance.md)).
- [Guards & Middleware](guards-and-middleware.md) — How requests are secured and transformed.
- [Error Handling](error-handling.md) — Standardized error responses across the API.
- [Testing](testing.md) — Unit and End-to-End testing strategies for the backend.