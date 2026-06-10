# Code Style

Atlas ERP enforces a strict but pragmatic code style to ensure consistency across a large codebase.

## Tooling
- **ESLint:** Catches potential errors and anti-patterns.
- **Prettier:** Handles all code formatting (spacing, quotes, line lengths).

Both are configured in the `packages/config` directory and shared across `apps/api` and `apps/web`.

## TypeScript Conventions

1. **Strict Mode:** TypeScript `strict` mode is enabled. Do not use `any` unless absolutely necessary (use `unknown` if you must bypass type checking temporarily).
2. **Interfaces over Types:** Prefer `interface` over `type` for defining object shapes, as interfaces are slightly more performant for the TypeScript compiler to merge.
3. **PascalCase for Types:** All classes, interfaces, types, and enums must use `PascalCase`.
4. **camelCase for Variables:** All variables, functions, and instances must use `camelCase`.
5. **UPPER_SNAKE_CASE for Constants:** Global, hardcoded constants must use `UPPER_SNAKE_CASE`.

## Backend (NestJS) Conventions

1. **Dependency Injection:** Never use `new ClassName()`. Always inject dependencies via the constructor.
2. **DTOs:** Every `POST`, `PUT`, and `PATCH` route MUST have a dedicated DTO class using `class-validator`.
3. **Fat Services, Skinny Controllers:** Controllers should only extract the request payload, call a service, and return the result. All business logic belongs in the service.
4. **Early Returns:** Prefer early `return` or `throw` statements over deeply nested `if/else` blocks.

## Frontend (React) Conventions

1. **Functional Components:** Always use functional components with Hooks. Do not use Class components.
2. **Destructuring:** Destructure props in the function signature.
   ```tsx
   // Good
   function Button({ onClick, children }: ButtonProps) { ... }
   
   // Bad
   function Button(props: ButtonProps) { ... }
   ```
3. **Tailwind Class Sorting:** Use the Prettier Tailwind plugin to automatically sort classes consistently.
4. **Colocation:** Keep component-specific hooks, styles, or sub-components in the same folder as the main component.