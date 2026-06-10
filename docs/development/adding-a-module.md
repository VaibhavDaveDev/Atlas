# Adding a Module

This guide outlines the steps to add a brand new business domain (module) to Atlas ERP.

## 1. Database Schema
Always start with the data. 

1. Open `packages/database/prisma/schema.prisma`.
2. Define your new models. **Remember to add the `workspaceId` field and relation!**
3. Run `pnpm prisma migrate dev --name init_new_module`.

## 2. Backend Module Setup
Use the NestJS CLI to scaffold the backend structure.

```bash
cd apps/api
# Generate the Module
npx nest g module my-new-module
# Generate the Controller
npx nest g controller my-new-module
# Generate the Service
npx nest g service my-new-module
```

Move these files into a logically structured folder if the CLI didn't place them exactly where you want them.

## 3. Define DTOs
Create a `dto/` folder inside your new module directory.
Define your input validation classes using `class-validator`.

```typescript
// apps/api/src/my-new-module/dto/create-item.dto.ts
import { IsString, IsNotEmpty } from 'class-validator';

export class CreateItemDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}
```

## 4. Implement Logic
1. **Service:** Inject the `PrismaService` and write your CRUD operations, ensuring you pass the `workspaceId` to every query.
2. **Controller:** Map the HTTP verbs (`@Get()`, `@Post()`) to the service methods. Apply `@UseGuards(AuthGuard, WorkspaceGuard)` to the controller class.

## 5. Frontend Types
Because we use a monorepo, you can export types from the backend, but typically it is better to define shared interfaces in `packages/types/src/my-new-module.ts`.

## 6. Frontend API Client
Create a new file in `apps/web/src/lib/my-new-module.ts`.
Write functions that wrap `apiClient.get` and `apiClient.post` for your new endpoints.

## 7. Frontend UI
1. Add the new route to the Next.js App Router (e.g., `apps/web/src/app/dashboard/my-new-module/page.tsx`).
2. Update the Sidebar (`apps/web/src/components/layout/Sidebar.tsx`) to include a link to your new module.
3. Build the UI components using `shadcn/ui` and React Query to fetch the data.