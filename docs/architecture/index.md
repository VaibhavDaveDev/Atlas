# Architecture

Welcome to the Atlas ERP Architecture documentation. This section covers the core system design, technical decisions, and patterns used throughout the application.

## Overview

Atlas ERP is a cloud-native, multi-tenant enterprise application built using a modern TypeScript stack. It strictly separates the frontend (Next.js) from the backend (NestJS API), ensuring a scalable, secure, and maintainable codebase.

## In this section

- [Overview](overview.md) — High-level introduction to the architecture.
- [Tech Stack](tech-stack.md) — Detailed list of technologies used and why.
- [System Diagram](system-diagram.md) — Visual representation of the system components.
- [Monorepo Structure](monorepo-structure.md) — How the Turborepo workspace is organized.
- [Multi-Tenancy](multi-tenancy.md) — How data is isolated between different tenant organizations.
- [Request Lifecycle](request-lifecycle.md) — The path an HTTP request takes through the system.
- [Background Jobs](background-jobs.md) — How asynchronous tasks are handled via BullMQ.
- [Authentication](authentication.md) — Overview of the Better Auth integration.
- [Observability](observability.md) — Logging and monitoring using Grafana and Loki.