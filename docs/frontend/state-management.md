# State Management

Managing state in a complex ERP requires a thoughtful approach to avoid prop drilling and ensure performance. Atlas ERP uses a combination of built-in React features, Zustand for global UI state, and React Query (or similar tools) for server state.

## 1. Server State (Data Fetching)

We strictly differentiate between "Server State" (data that lives in the PostgreSQL database) and "Client State" (e.g., is a modal open?).

For Server State, we use data fetching libraries (like **React Query** or **SWR**) or Next.js 15 Server Actions.

**Why?**
- It handles caching, background updates, and stale data automatically.
- It prevents us from manually writing `useEffect` and `useState` for loading/error states.

```tsx
// Example of fetching server state
function ProjectList() {
  const { data: projects, isLoading } = useQuery(['projects'], fetchProjects);

  if (isLoading) return <Skeleton />;
  return <ul>{projects.map(p => <li key={p.id}>{p.name}</li>)}</ul>;
}
```

## 2. Global Client State (Zustand)

For global UI state—data that needs to be accessed by components across completely different parts of the React tree—we use [Zustand](https://github.com/pmndrs/zustand).

### What goes in Zustand?
- The currently selected Workspace.
- The user's active theme (Light/Dark).
- Global UI toggles (e.g., is the mobile sidebar open?).

### Example Store

Stores are located in `src/stores/`.

```typescript
// src/stores/useUserStore.ts
import { create } from 'zustand';

interface UserState {
  activeWorkspaceId: string | null;
  setWorkspace: (id: string) => void;
}

export const useUserStore = create<UserState>((set) => ({
  activeWorkspaceId: null,
  setWorkspace: (id) => set({ activeWorkspaceId: id }),
}));
```

### Usage

```tsx
import { useUserStore } from '@/stores/useUserStore';

function WorkspaceSelector() {
  const { activeWorkspaceId, setWorkspace } = useUserStore();
  
  return (
    <select 
      value={activeWorkspaceId} 
      onChange={(e) => setWorkspace(e.target.value)}
    >
      {/* options */}
    </select>
  );
}
```

## 3. Local Client State

For state that only matters to a single component or its immediate children, we use standard React `useState` and `useReducer`.

### What goes in Local State?
- Form input values (if not using a library like `react-hook-form`).
- Accordion open/close states.
- Local component loading states.

## 4. React Context

We use React Context sparingly, primarily for dependency injection or deeply nested settings where Zustand might be overkill.

Examples in Atlas:
- `AuthContext`: Provides the authenticated user object and authentication methods throughout the app.
- `AbilityContext`: (If using CASL) Provides the user's permission checking functions to deeply nested components.