# System Diagram

The following diagram illustrates the high-level architecture of Atlas ERP, showing the flow of data between the user, frontend, backend, and external services.

```mermaid
graph TD
    %% Users
    Client[Client Browser / User]
    
    %% External Services
    Cloudflare[Cloudflare Turnstile]
    Google[Google OAuth]
    Gravatar[Gravatar API]
    Brevo[Brevo Email API]
    
    %% Frontend Layer
    subgraph Frontend [Vercel / Edge]
        WebApp[Next.js 15 Web App]
    end
    
    %% Backend Layer
    subgraph Backend [Render / App Runner]
        NestAPI[NestJS 11 API]
        BullWorker[BullMQ Worker Processes]
    end
    
    %% Data Layer
    subgraph Data [Data Persistence]
        Postgres[(PostgreSQL 17)]
        Redis[(Redis 8)]
    end
    
    %% Connections
    Client -->|HTTPS / REST| WebApp
    WebApp -->|HTTPS / REST| NestAPI
    
    %% External Integrations
    Client -.->|Verify CAPTCHA| Cloudflare
    WebApp -.->|OAuth Flow| Google
    WebApp -.->|Fetch Avatar| Gravatar
    NestAPI -.->|Send Transactional Emails| Brevo
    
    %% Internal Connections
    NestAPI <-->|Read / Write| Postgres
    NestAPI <-->|Cache / Queue| Redis
    BullWorker <-->|Pop Jobs| Redis
    BullWorker <-->|Update State| Postgres
    BullWorker -.->|Async Emails| Brevo
    
    classDef primary fill:#4f46e5,stroke:#3730a3,stroke-width:2px,color:#fff;
    classDef database fill:#059669,stroke:#312e81,stroke-width:2px,color:#fff;
    classDef external fill:#475569,stroke:#334155,stroke-width:2px,color:#fff;
    
    class WebApp,NestAPI,BullWorker primary;
    class Postgres,Redis database;
    class Cloudflare,Google,Gravatar,Brevo external;
```

## Component Roles

- **Next.js Web App:** Renders the UI, manages client-side state, and proxies user interactions to the backend API.
- **NestJS API:** The core monolithic API that enforces business rules, handles authentication (Better Auth), and executes complex logic.
- **PostgreSQL:** The source of truth for all business data, including multi-tenant ERP records, users, and roles.
- **Redis:** Handles fast in-memory caching, session management for Better Auth, rate limiting data, and queue storage.
- **BullMQ Workers:** Asynchronous processors that handle tasks like report generation, bulk data imports, and email dispatching without blocking the main API thread.
- **External Services:** Provide specialized capabilities like CAPTCHA verification, SSO, profile images, and email delivery.