# Tech Stack

Atlas ERP is built on a modern, robust, and scalable technology stack, utilizing TypeScript across both the frontend and backend.

## Frontend (Web App)

| Technology | Purpose | Why We Chose It |
|------------|---------|-----------------|
| **[Next.js 15](https://nextjs.org/)** | React Framework | Provides Server-Side Rendering (SSR), App Router, and excellent developer experience. |
| **[React 19](https://react.dev/)** | UI Library | The industry standard for building interactive user interfaces. |
| **[TailwindCSS](https://tailwindcss.com/)** | Styling | Utility-first CSS framework for rapid UI development without context switching. |
| **[Zustand](https://docs.pmnd.rs/zustand/getting-started/introduction)** | State Management | A small, fast, and scalable bearbones state-management solution. |
| **[shadcn/ui](https://ui.shadcn.com/)** | Component Library | Beautifully designed components that you can copy and paste into your apps. |
| **[Lingui](https://lingui.dev/)** | Internationalization | Lightweight and powerful i18n framework for React. |

## Backend (API)

| Technology | Purpose | Why We Chose It |
|------------|---------|-----------------|
| **[NestJS 11](https://nestjs.com/)** | Node.js Framework | Provides a strict, Angular-like architecture for Node.js, promoting maintainability and dependency injection. |
| **[Prisma ORM](https://www.prisma.io/)** | Database ORM | Type-safe database client with an intuitive schema definition language. |
| **[Better Auth](https://better-auth.com/)** | Authentication | Comprehensive, framework-agnostic authentication solution handling JWTs, sessions, and OAuth. |
| **[BullMQ](https://docs.bullmq.io/)** | Message Queue | Fast and reliable Redis-based queue for handling background jobs (emails, reports). |
| **[Winston](https://github.com/winstonjs/winston)** | Logging | Universal logging library with multiple transports (Console, File, Loki). |

## Data Layer & Infrastructure

| Technology | Purpose | Why We Chose It |
|------------|---------|-----------------|
| **[PostgreSQL 17](https://www.postgresql.org/)** | Primary Database | The world's most advanced open-source relational database. Perfect for complex ERP data relationships. |
| **[Redis 8](https://redis.io/)** | Cache & Queue | In-memory data structure store used for fast caching, rate limiting, and BullMQ task queues. |
| **[Turborepo](https://turbo.build/)** | Build System | High-performance build system for JavaScript and TypeScript codebases. |

## Third-Party Integrations

- **[Brevo](https://www.brevo.com/):** Transactional email delivery.
- **[Cloudflare Turnstile](https://www.cloudflare.com/products/turnstile/):** Privacy-preserving CAPTCHA alternative.
- **[Google OAuth](https://developers.google.com/identity/protocols/oauth2):** Single Sign-On (SSO) provider.
- **[Gravatar](https://gravatar.com/):** Globally recognized avatars for user profiles.

## Observability (Optional)

- **[Grafana](https://grafana.com/):** Open observability platform for monitoring dashboards.
- **[Loki](https://grafana.com/oss/loki/):** Horizontally-scalable, highly-available, multi-tenant log aggregation system.