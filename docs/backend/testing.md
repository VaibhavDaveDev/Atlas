# Backend Testing

Testing is critical to the stability of Atlas ERP. The backend leverages [Vitest](https://vitest.dev/) for both unit and end-to-end (e2e) testing, providing a fast, modern testing experience that is compatible with Jest syntax.

## Testing Strategy

1. **Unit Tests (`*.spec.ts`):** Focus on individual Services and Controllers in isolation. External dependencies (like the database or Redis) are strictly mocked.
2. **End-to-End Tests (`*.e2e-spec.ts`):** Focus on the entire request lifecycle. These tests interact with a real (test) database and hit the actual HTTP endpoints.

## Running Tests

You can run tests from the root using Turborepo, or directly inside the `apps/api` folder.

```bash
cd apps/api

# Run all unit tests
pnpm test

# Run unit tests in watch mode
pnpm test:watch

# Run e2e tests
pnpm test:e2e
```

## Unit Testing Example

When testing a Service, we use the NestJS `Test` module to create a testing module, mocking out dependencies like `PrismaService`.

```typescript
// apps/api/src/project/projects/projects.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { ProjectsService } from './projects.service';
import { PrismaService } from '../../common/services/prisma.service';

describe('ProjectsService', () => {
  let service: ProjectsService;
  let prisma: PrismaService;

  beforeEach(async () => {
    // Mock the Prisma Service
    const mockPrisma = {
      project: {
        findFirst: vi.fn(),
        create: vi.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    it('should return a project if found', async () => {
      const mockProject = { id: '1', name: 'Test', workspaceId: 'ws-1' };
      vi.spyOn(prisma.project, 'findFirst').mockResolvedValue(mockProject as any);

      const result = await service.findOne('1', 'ws-1');
      expect(result).toEqual(mockProject);
      expect(prisma.project.findFirst).toHaveBeenCalledWith({
        where: { id: '1', workspaceId: 'ws-1' },
      });
    });
  });
});
```

## End-to-End (E2E) Testing

E2E tests are located in `apps/api/test/`. They spin up the entire NestJS application and make HTTP requests using `supertest`.

### E2E Setup

E2E tests require a running database. Ensure your `DATABASE_URL` in the `.env.test` file points to a dedicated test database, **not your development or production database**.

```typescript
// apps/api/test/projects.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('ProjectsController (e2e)', () => {
  let app: INestApplication;
  let token: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    
    // Logic to generate or fetch a valid test Better Auth JWT
    token = 'test-jwt-token';
  });

  afterAll(async () => {
    await app.close();
  });

  it('/api/v1/projects (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/v1/projects')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
      });
  });
});
```