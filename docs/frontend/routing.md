# Routing

Atlas ERP uses the **Next.js App Router** (`src/app/`) for handling all navigation and page rendering.

## Core Routing Concepts

### Route Groups
We use route groups (folders wrapped in parentheses like `(auth)`) to organize routes without affecting the URL path. This allows us to apply specific layouts to a group of routes.

```text
src/app/
├── (auth)/                 # URL: /login, /register (No dashboard sidebar)
│   ├── login/page.tsx
│   ├── register/page.tsx
│   └── layout.tsx          # Auth-specific layout (centered, clean background)
├── dashboard/              # URL: /dashboard/* (Includes sidebar)
│   ├── page.tsx
│   ├── finance/page.tsx
│   └── layout.tsx          # Applies the Sidebar and Topbar
```

### Dynamic Routes
For viewing specific records, we use dynamic segments (folders in brackets).

```text
src/app/dashboard/projects/
├── page.tsx                # List all projects
└── [projectId]/            
    ├── page.tsx            # Project details
    └── tasks/page.tsx      # Tasks for a specific project
```

## Layouts

Layouts (`layout.tsx`) wrap their child pages and preserve state across navigations.

### Root Layout (`src/app/layout.tsx`)
The Root Layout contains the HTML `<html>` and `<body>` tags, and wraps the entire application in essential providers:
- `ThemeProvider` (Dark/Light mode)
- `AuthProvider` (Better Auth context)
- `QueryClientProvider` (React Query)

### Dashboard Layout (`src/app/dashboard/layout.tsx`)
This layout is applied to all authenticated routes. It checks if the user is authenticated (redirecting to `/login` if not) and renders the `AppShell`, which includes the navigation sidebar and top header.

## Server vs. Client Components in Routing

By default, all `page.tsx` and `layout.tsx` files are React Server Components.

**When a page is a Server Component:**
- It can fetch initial data directly (though in our architecture, it calls the NestJS API rather than the database).
- It ships zero JavaScript to the client for its static parts.

**When to use `"use client"`:**
If a page needs heavy interactivity (like a complex drag-and-drop Kanban board), the specific interactive part is extracted into a Client Component inside `src/components/`, and the Server Component page imports it.

```tsx
// src/app/dashboard/projects/[projectId]/page.tsx
// This is a Server Component
import { KanbanBoard } from '@/components/projects/kanban/KanbanBoard';

export default async function ProjectPage({ params }) {
  // Fetch data on the server
  const initialData = await fetchProjectData(params.projectId);
  
  return (
    <div>
      <h1>Project Details</h1>
      {/* Pass data to the interactive client component */}
      <KanbanBoard initialData={initialData} />
    </div>
  );
}
```