# Frontend Testing

The Next.js frontend uses **Vitest** for unit and component testing, and **Playwright** (or Cypress) for end-to-end (E2E) testing.

## Unit and Component Testing

We use Vitest combined with React Testing Library to test individual components, hooks, and utility functions.

### Running Tests

```bash
cd apps/web

# Run tests once
pnpm test

# Run tests in watch mode
pnpm test:watch
```

### Example Component Test

When testing components, focus on user interactions and accessibility (using `getByRole`, `getByText`).

```tsx
// src/components/ui/button.spec.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './button';

describe('Button', () => {
  it('renders the button text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('calls onClick handler when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByRole('button', { name: /click me/i }));
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is passed', () => {
    render(<Button disabled>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeDisabled();
  });
});
```

### Mocking API Calls

Because the frontend uses `fetch` or Axios via `src/lib/api-client.ts`, we mock these network requests during tests. We recommend using **MSW (Mock Service Worker)** for intercepting network requests in tests, ensuring the components behave as if they are communicating with the real backend.

## End-to-End (E2E) Testing

E2E tests verify that the frontend application works correctly from a user's perspective, running in a real headless browser.

*Note: E2E tests are typically configured at the monorepo root or in a dedicated `e2e` folder.*

### Running E2E Tests

```bash
# E2E test command (example using Playwright)
pnpm run test:e2e
```

### What to E2E Test

Do not E2E test everything. Focus on critical user journeys:
1. User Login and Logout
2. Creating a new Project
3. Generating an Invoice
4. Submitting a Leave Application

These tests provide confidence that the frontend and backend are communicating correctly in a production-like environment.