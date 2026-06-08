process.env.BETTER_AUTH_TEST = "true";
import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import request from "supertest";
import { AppModule } from "../../src/app.module";
import { PrismaService } from "../../src/common/services/prisma.service";
import { BetterAuthService } from "../../src/auth/services/better-auth.service";
import { EmailQueueService } from "../../src/common/queues/email/email.queue";
import { TransformInterceptor } from "../../src/common/interceptors/transform.interceptor";
import * as crypto from "crypto";
import * as bcrypt from "bcryptjs";

describe("Workspace Invites (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let betterAuthService: BetterAuthService;
  let authToken: string;
  let adminCookie: string;
  let workspaceToken: string;
  let workspaceId: string;
  let ownerId: string;
  const testEmail = `test-invite-${crypto.randomUUID()}@example.com`;

  const mockEmailQueueService = {
    sendVerificationEmail: vi.fn().mockResolvedValue(undefined),
    sendWelcomeEmail: vi.fn().mockResolvedValue(undefined),
    sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
    sendSecurityNotification: vi.fn().mockResolvedValue(undefined),
    sendWorkspaceInviteEmail: vi.fn().mockResolvedValue(undefined),
  };

  const mockWinstonLogger = {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    log: vi.fn(),
  };

  beforeEach(async () => {
    // Ensure JWT secrets are available
    process.env.JWT_ACCESS_SECRET = "test-secret";
    process.env.JWT_REFRESH_SECRET = "test-secret";

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(EmailQueueService)
      .useValue(mockEmailQueueService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix("api/v1");
    app.useGlobalPipes(
      new ValidationPipe({ transform: true, whitelist: true }),
    );
    app.useGlobalInterceptors(
      new TransformInterceptor(mockWinstonLogger as any),
    );
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
    betterAuthService = app.get<BetterAuthService>(BetterAuthService);

    // 1. Create a test user manually with hashed password
    const email = `admin-${crypto.randomUUID()}@test.com`;
    const password = "Password123!";
    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.authUser.create({
      data: {
        email,
        password: hashedPassword,
        username: `user-${crypto.randomUUID().substring(0, 8)}`,
        verified: true,
        status: "ACTIVE",
        security: {
          create: {
            failedAttempts: 0,
            mfaEnabled: false,
            lastPasswordChange: new Date(),
          },
        },
      },
    });
    ownerId = user.id;

    // 2. Create a session using Better Auth test utilities
    const session = await (await betterAuthService.auth.$context).test.login({
      userId: user.id,
    });
    authToken = session.token;
    adminCookie = session.headers.get("cookie") || session.headers.get("set-cookie") || "";

    // 3. Create a workspace
    const workspaceRes = await request(app.getHttpServer())
      .post("/api/v1/workspaces/setup")
      .set("Cookie", adminCookie)
      .send({
        name: "Test Workspace",
        subdomain: `test-${crypto.randomUUID().substring(0, 8)}`,
        industry: "Technology",
        workspaceSize: "1-10",
      });

    if (workspaceRes.status !== 201) {
      console.error("Workspace setup failed:", JSON.stringify(workspaceRes.body, null, 2));
    }

    workspaceId = workspaceRes.body.data.workspace.id;
    // In the new system, authToken (session token) is the same regardless of workspace
    workspaceToken = authToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it("should prevent accepting a cancelled invite", async () => {
    // 1. Create an invite
    const inviteRes = await request(app.getHttpServer())
      .post(`/api/v1/workspaces/${workspaceId}/invites`)
      .set("Cookie", adminCookie)
      .set("x-workspace-id", workspaceId)
      .send({ email: testEmail, role: "USER" });

    expect(inviteRes.status).toBe(201);
    const inviteId = inviteRes.body.data.id;
    const inviteToken = inviteRes.body.data.token;

    // 2. Cancel the invite
    const cancelRes = await request(app.getHttpServer())
      .delete(`/api/v1/workspaces/${workspaceId}/invites/${inviteId}`)
      .set("Cookie", adminCookie)
      .set("x-workspace-id", workspaceId);

    expect(cancelRes.status).toBe(200);

    // 3. Create and verify the invited user manually
    const invitedUser = await prisma.authUser.create({
      data: {
        email: testEmail,
        password: await bcrypt.hash("Password123!", 12),
        username: `invited-${crypto.randomUUID().substring(0, 8)}`,
        verified: true,
        status: "ACTIVE",
        security: {
          create: {
            failedAttempts: 0,
            mfaEnabled: false,
            lastPasswordChange: new Date(),
          },
        },
      },
    });

    // Create session for invited user using Better Auth test utilities
    const invitedSession = await (await betterAuthService.auth.$context).test.login({
      userId: invitedUser.id,
    });

    const invitedAuthToken = invitedSession.token;
    const invitedCookie = invitedSession.headers.get("cookie") || invitedSession.headers.get("set-cookie") || "";

    // 4. Attempt to accept the cancelled invite
    const acceptRes = await request(app.getHttpServer())
      .post(`/api/v1/workspaces/invites/${inviteToken}/accept`)
      .set("Cookie", invitedCookie);

    // Should fail because status is no longer PENDING
    expect(acceptRes.status).toBe(400);
    expect(acceptRes.body.message).toContain(
      "expired or already been processed",
    );
  });

  it("should list pending invites and show they are gone after cancellation", async () => {
    // 1. Create an invite
    await request(app.getHttpServer())
      .post(`/api/v1/workspaces/${workspaceId}/invites`)
      .set("Cookie", adminCookie)
      .set("x-workspace-id", workspaceId)
      .send({
        email: `list-test-${crypto.randomUUID()}@example.com`,
        role: "USER",
      });

    // 2. List invites
    const listRes = await request(app.getHttpServer())
      .get(`/api/v1/workspaces/${workspaceId}/invites`)
      .set("Cookie", adminCookie)
      .set("x-workspace-id", workspaceId);

    expect(listRes.status).toBe(200);
    const pendingCount = listRes.body.data.filter(
      (i: any) => i.status === "PENDING",
    ).length;
    expect(pendingCount).toBeGreaterThan(0);

    const inviteId = listRes.body.data.find(
      (i: any) => i.status === "PENDING",
    ).id;

    // 3. Cancel it
    await request(app.getHttpServer())
      .delete(`/api/v1/workspaces/${workspaceId}/invites/${inviteId}`)
      .set("Cookie", adminCookie)
      .set("x-workspace-id", workspaceId);

    // 4. List again
    const listRes2 = await request(app.getHttpServer())
      .get(`/api/v1/workspaces/${workspaceId}/invites`)
      .set("Cookie", adminCookie)
      .set("x-workspace-id", workspaceId);

    const finalPendingCount = listRes2.body.data.filter(
      (i: any) => i.status === "PENDING",
    ).length;
    expect(finalPendingCount).toBe(pendingCount - 1);
  });
});
