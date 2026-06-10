# Frontend Architecture

The frontend of Atlas ERP is built using **Next.js 15** with the **App Router**, leveraging **React 19** capabilities. It provides a fast, responsive, and highly interactive user interface designed with TailwindCSS and shadcn/ui.

## Core Design Principles

1. **Server Components by Default:** We default to React Server Components (RSC) to reduce the JavaScript bundle size shipped to the client and improve initial load performance.
2. **Client Components When Necessary:** We use `"use client"` only for components that require interactivity (hooks like `useState`, `useEffect`, or event listeners).
3. **API-Driven:** The frontend is completely decoupled from the database. It fetches all data from the NestJS backend via HTTP REST calls.
4. **Optimistic UI:** Where appropriate, the UI updates optimistically before the server responds to provide a snappy user experience.

## In this section

- [Project Structure](project-structure.md) — How the `apps/web` directory is organized.
- [Routing](routing.md) — Next.js App Router conventions and file structure.
- [State Management](state-management.md) — How we use Zustand and React Context.
- [Internationalization](internationalization.md) — Multi-language support using Lingui.
- [Styling](styling.md) — TailwindCSS conventions and component design.
- [Testing](testing.md) — Frontend testing strategies.