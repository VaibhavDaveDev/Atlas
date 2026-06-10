# Adding an API Endpoint

Adding a new endpoint to an existing module follows a predictable pattern.

## 1. Controller Definition

Add the route handler to the existing controller. Use decorators to define the HTTP method, path, and security.

```typescript
import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard';
import { WorkspaceGuard } from '../../auth/guards/workspace.guard';
import { Workspace } from '../../auth/decorators/workspace.decorator';

@Controller('projects')
@UseGuards(AuthGuard, WorkspaceGuard) // Apply security
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post(':id/archive')
  async archiveProject(
    @Param('id') projectId: string,
    @Workspace() workspaceId: string // Get tenant ID
  ) {
    return this.projectsService.archive(projectId, workspaceId);
  }
}
```

## 2. Service Implementation

Implement the business logic in the service.

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async archive(projectId: string, workspaceId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, workspaceId }
    });

    if (!project) throw new NotFoundException('Project not found');

    return this.prisma.project.update({
      where: { id: projectId },
      data: { status: 'ARCHIVED' }
    });
  }
}
```

## 3. Frontend Integration

Add a wrapper function in `apps/web/src/lib/projects.ts` (or equivalent).

```typescript
import apiClient from './api-client';

export async function archiveProject(projectId: string) {
  const response = await apiClient.post(`/projects/${projectId}/archive`);
  return response.data;
}
```

## 4. React Query Mutation

In your React component, use `useMutation` to call the API and invalidate the cache upon success.

```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { archiveProject } from '@/lib/projects';

export function ArchiveButton({ projectId }) {
  const queryClient = useQueryClient();
  
  const mutation = useMutation({
    mutationFn: () => archiveProject(projectId),
    onSuccess: () => {
      // Refresh the projects list
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    }
  });

  return (
    <Button onClick={() => mutation.mutate()} isLoading={mutation.isPending}>
      Archive Project
    </Button>
  );
}
```