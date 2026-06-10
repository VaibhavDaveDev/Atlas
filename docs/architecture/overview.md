# Architecture Overview

Atlas ERP is designed as a modern, cloud-native Enterprise Resource Planning system. It leverages a multi-tier architecture to ensure scalability, security, and developer productivity.

## Core Architectural Principles

### 1. Multi-Tenant Isolation
Atlas is built from the ground up to support Software-as-a-Service (SaaS) deployments. Tenant isolation is primarily handled at the application and database level (row-level security/tenant IDs).

### 2. Monorepo Organization
The entire codebase is housed in a single Turborepo monorepo. This allows seamless sharing of types, UI components, and configuration between the frontend (`apps/web`) and backend (`apps/api`).

### 3. API-First Design
The backend is a standalone NestJS application that exposes a robust REST (and GraphQL capable) API. The Next.js frontend acts solely as a client to this API, ensuring that third-party integrations or future mobile apps can utilize the exact same endpoints.

### 4. Asynchronous Processing
Heavy operations (such as sending emails, generating reports, or processing payroll) are offloaded to background queues using BullMQ and Redis, keeping the main HTTP request-response cycle fast.

### 5. Stateless Authentication
Authentication relies on stateless JWTs and Better Auth, allowing the backend to scale horizontally without sticky sessions. Redis is used for token blacklisting and rate limiting.

## High-Level Components

- **Frontend (Web):** A React application built with Next.js 15, utilizing TailwindCSS for styling and Zustand for state management. It communicates with the backend via HTTP REST calls.
- **Backend (API):** A NestJS 11 application that orchestrates business logic, authentication, and database access.
- **Database:** PostgreSQL 17 serves as the primary persistent data store, managed via Prisma ORM.
- **Cache & Queue:** Redis 8 is used for caching frequent queries, managing background job queues (BullMQ), and rate limiting.

For a visual representation of how these components interact, see the [System Diagram](system-diagram.md).