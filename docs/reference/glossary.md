---
title: Glossary
description: Definitions of ERP-specific terms, technical concepts, and Atlas ERP terminology
tags:
  - reference
  - glossary
  - terminology
  - definitions
---

# Glossary

This glossary defines ERP-specific terms, technical concepts, and Atlas ERP-specific terminology used throughout the documentation.

## A

### API (Application Programming Interface)
A set of protocols and tools for building software applications. Atlas ERP provides both REST and GraphQL APIs for integration.

### Authentication
The process of verifying the identity of a user or system. Atlas ERP uses Better Auth with support for email/password, magic links, and OAuth.

### Authorization
The process of determining what actions an authenticated user is permitted to perform. Implemented through role-based access control (RBAC).

## B

### Background Job
A task that runs asynchronously outside the main request-response cycle. Atlas uses BullMQ for background job processing.

### Better Auth
The authentication library used by Atlas ERP, providing flexible authentication methods and session management.

### BullMQ
A Redis-based queue system for handling background jobs and asynchronous tasks in Atlas ERP.

## C

### Cache
A high-speed data storage layer. Atlas uses Redis for caching frequently accessed data to improve performance.

### Chart of Accounts (COA)
A structured list of all accounts used in the general ledger, organized by account type (assets, liabilities, equity, revenue, expenses).

### Cloud-Native
An approach to building applications designed to run in cloud environments, leveraging scalability and resilience features.

### CRUD
Create, Read, Update, Delete - the four basic operations of persistent storage.

## D

### Database Migration
A version-controlled change to the database schema. Atlas uses Prisma migrations to manage schema changes.

### Deployment
The process of making an application available for use. Atlas can be deployed to Vercel, Cloudflare Pages, Render, and other platforms.

### Dependency Injection
A design pattern where dependencies are provided to a class rather than created by it. Used extensively in NestJS.

## E

### Employee Self-Service (ESS)
A portal allowing employees to access and manage their personal information, leave requests, payslips, and other HR-related data.

### Enterprise Resource Planning (ERP)
Integrated management software that helps organizations manage and automate core business processes across finance, HR, supply chain, and more.

### Environment Variable
Configuration values stored outside the application code, typically in `.env` files, used to configure different deployment environments.

## F

### Finance Module
The Atlas ERP module that handles accounting, invoicing, expense tracking, and financial reporting.

### Frontend
The client-side part of the application that users interact with. Atlas uses Next.js and React for the frontend.

## G

### General Ledger (GL)
The primary accounting record that tracks all financial transactions across all accounts in the chart of accounts.

### GraphQL
A query language for APIs that allows clients to request exactly the data they need. Atlas provides a GraphQL API alongside REST.

### Guard
In NestJS, a class that determines whether a request should be handled by a route handler, typically used for authentication and authorization.

## H

### HR Module
The Human Resources module that manages employee data, recruitment, onboarding, leave management, and performance tracking.

### HRMS (Human Resource Management System)
Software that manages HR functions including employee records, payroll, benefits, and performance management.

## I

### i18n (Internationalization)
The process of designing software to support multiple languages and regions. Atlas uses Lingui for i18n support.

### Idempotent
An operation that produces the same result whether executed once or multiple times, important for API reliability.

## J

### JWT (JSON Web Token)
A compact, URL-safe token format used for authentication. Atlas uses JWTs for API authentication and session management.

## L

### Leave Management
The process of tracking employee time-off requests, approvals, and leave balances within the HR module.

### Loki
A log aggregation system used in Atlas's optional observability stack for centralized logging.

## M

### Middleware
Software that acts as a bridge between different applications or components. In NestJS, middleware processes requests before they reach route handlers.

### Migration
See Database Migration.

### Module
A logical grouping of related functionality. In Atlas ERP, modules include HR, Finance, Projects, and ESS. In NestJS, modules organize application structure.

### Monorepo
A software development strategy where code for multiple projects is stored in a single repository. Atlas uses Turborepo for monorepo management.

### Multi-Tenancy
An architecture where a single instance of software serves multiple customers (tenants), with data isolation between them.

## N

### NestJS
The Node.js framework used for Atlas ERP's backend API, providing structure and features like dependency injection.

### Next.js
The React framework used for Atlas ERP's frontend, providing server-side rendering, routing, and API routes.

## O

### OAuth
An open standard for access delegation, allowing users to grant applications access to their information without sharing passwords. Atlas supports Google OAuth.

### Observability
The ability to measure and understand the internal state of a system through logs, metrics, and traces. Atlas includes optional Grafana + Loki integration.

### ORM (Object-Relational Mapping)
A technique for converting data between incompatible type systems. Atlas uses Prisma ORM for database interactions.

## P

### Payroll
The process of calculating and distributing employee compensation, including salaries, deductions, and taxes.

### PostgreSQL
The relational database system used by Atlas ERP for data persistence.

### Prisma
The ORM (Object-Relational Mapping) tool used by Atlas ERP to interact with the PostgreSQL database.

### Projects Module
The Atlas ERP module for project management, tracking tasks, milestones, time tracking, and resource allocation.

## Q

### Queue
A data structure for managing tasks to be processed asynchronously. Atlas uses BullMQ with Redis for job queues.

## R

### RBAC (Role-Based Access Control)
An access control method where permissions are assigned to roles, and users are assigned to roles. Used throughout Atlas ERP.

### Redis
An in-memory data store used by Atlas for caching and job queue management.

### REST (Representational State Transfer)
An architectural style for building web APIs. Atlas provides RESTful endpoints alongside GraphQL.

### Role
A set of permissions defining what actions a user can perform. Atlas includes roles like Admin, Manager, Employee, and Accountant.

## S

### SaaS (Software as a Service)
A software licensing model where applications are hosted centrally and accessed over the internet. Atlas ERP is designed for SaaS deployment.

### Schema
The structure of a database, defining tables, columns, relationships, and constraints. Atlas uses Prisma schema definition.

### Seed Data
Initial data loaded into a database for development or testing purposes.

### Session
A server-side storage of user state and authentication information, maintained across multiple requests.

### SSR (Server-Side Rendering)
Rendering web pages on the server before sending them to the client. Next.js provides SSR capabilities.

## T

### Tenant
In multi-tenancy, a tenant is a group of users who share access to a specific instance of the software with isolated data.

### Transaction
A sequence of database operations treated as a single unit of work, ensuring data consistency (ACID properties).

### Turborepo
A high-performance build system for JavaScript and TypeScript monorepos, used by Atlas to manage multiple packages.

### TypeScript
A typed superset of JavaScript used throughout Atlas ERP for type safety and better developer experience.

## U

### Upstash
A serverless Redis provider that Atlas can use for caching and queue management in production.

## V

### Vercel
A cloud platform for deploying Next.js applications. Atlas frontend can be deployed to Vercel.

## W

### WebSocket
A protocol for full-duplex communication channels over a single TCP connection, enabling real-time features in Atlas.

### Workspace
In monorepo terminology, a package or application within the repository. Atlas has workspaces for frontend (web) and backend (api).

## Z

### Zustand
A lightweight state management library used in Atlas ERP's Next.js frontend for managing client-side application state.

---

## Additional Resources

- [Architecture Overview](../architecture/overview.md) - Understanding Atlas ERP's architecture
- [Tech Stack](../architecture/tech-stack.md) - Detailed technology choices
- [Troubleshooting Guide](troubleshooting-guide.md) - Common issues and solutions
- [Environment Variables Reference](environment-variables-reference.md) - Configuration options

---

**Tip:** Press `Ctrl+F` (or `Cmd+F` on Mac) to search for specific terms on this page.
