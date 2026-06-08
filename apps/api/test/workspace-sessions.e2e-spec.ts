process.env.BETTER_AUTH_TEST = "true";
import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import { PrismaService } from "../src/common/services/prisma.service";
import { BetterAuthService } from "../src/auth/services/better-auth.service";
import { AppModule } from "../src/app.module";
import * as bcrypt from "bcryptjs";
import { TransformInterceptor } from "../src/common/interceptors/transform.interceptor";
import { WINSTON_MODULE_PROVIDER } from "nest-winston";
import cookieParser from "cookie-parser";

describe("Workspace Sessions (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let betterAuthService: BetterAuthService;
  let workspaceId: string;
  let adminUserId: string;
  let adminToken: string;
  let adminCookie: string;
  let employeeUserId: string;
  let employeeToken: string;
  let employeeCookie: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.setGlobalPrefix("api/v1");
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    
    const winstonLogger = app.get(WINSTON_MODULE_PROVIDER);
    app.useGlobalInterceptors(new TransformInterceptor(winstonLogger));

    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
    betterAuthService = app.get<BetterAuthService>(BetterAuthService);
    
    console.log("Better Auth properties:", Object.keys(betterAuthService.auth));
    console.log("Better Auth API properties:", Object.keys(betterAuthService.auth.api));
  });

  afterAll(async () => {
    // Cleanup test data
    if (workspaceId) {
      await prisma.authSession.deleteMany({
        where: { user: { workspaces: { some: { workspaceId } } } },
      });
      await prisma.workspaceMember.deleteMany({ where: { workspaceId } });
      await prisma.workspace.delete({ where: { id: workspaceId } }).catch(() => {});
    }
    if (adminUserId) {
      await prisma.authUser.delete({ where: { id: adminUserId } }).catch(() => {});
    }
    if (employeeUserId) {
      await prisma.authUser.delete({ where: { id: employeeUserId } }).catch(() => {});
    }

    await app.close();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Setup test data
    const hashedPassword = await bcrypt.hash("TestPassword123!", 12);

    // Create admin user
    const adminUser = await prisma.authUser.create({
      data: {
        email: `admin-${Date.now()}@test.com`,
        username: `admin_${Date.now()}`,
        name: "Test Admin",
        password: hashedPassword,
        verified: true,
      },
    });
    adminUserId = adminUser.id;

    // Create employee user
    const employeeUser = await prisma.authUser.create({
      data: {
        email: `employee-${Date.now()}@test.com`,
        username: `employee_${Date.now()}`,
        name: "Test Employee",
        password: hashedPassword,
        verified: true,
      },
    });
    employeeUserId = employeeUser.id;

    // Create workspace
    const workspace = await prisma.workspace.create({
      data: {
        name: `Test Workspace ${Date.now()}`,
        subdomain: `test-${Date.now()}`,
        status: "ACTIVE",
      },
    });
    workspaceId = workspace.id;

    // Create roles
    const adminRole = await prisma.role.create({
      data: {
        workspaceId: workspace.id,
        name: "OWNER",
        description: "Owner role",
      },
    });

    const userRole = await prisma.role.create({
      data: {
        workspaceId: workspace.id,
        name: "USER",
        description: "User role",
      },
    });

    // Add members to workspace
    await prisma.workspaceMember.create({
      data: {
        workspaceId: workspace.id,
        userId: adminUserId,
        roleId: adminRole.id,
        isActive: true,
      },
    });

    await prisma.workspaceMember.create({
      data: {
        workspaceId: workspace.id,
        userId: employeeUserId,
        roleId: userRole.id,
        isActive: true,
      },
    });

    // Create sessions using Better Auth test utilities
    const ctx = await betterAuthService.auth.$context;
    const adminSession = await ctx.test.login({
      userId: adminUserId,
    });
    console.log("LOGIN COOKIES:", adminSession.cookies);
    console.log("LOGIN HEADERS:", Object.fromEntries(adminSession.headers.entries()));
    adminToken = adminSession.token;
    adminCookie = adminSession.headers.get("cookie") || adminSession.headers.get("set-cookie") || "";

    const employeeSession = await ctx.test.login({
      userId: employeeUserId,
    });
    employeeToken = employeeSession.token;
    employeeCookie = employeeSession.headers.get("cookie") || employeeSession.headers.get("set-cookie") || "";
  });

  describe("GET /api/v1/workspaces/:workspaceId/sessions", () => {
    it("should return list of active sessions for workspace members", async () => {
      console.log("Testing with:", {
        workspaceId,
        adminUserId,
        employeeUserId,
        adminToken,
        employeeToken,
      });

      // First, verify sessions exist in database
      const sessionsInDb = await prisma.authSession.findMany({
        where: {
          userId: { in: [adminUserId, employeeUserId] },
          expiresAt: { gt: new Date() },
        },
      });

      console.log("Sessions in database:", sessionsInDb);
      expect(sessionsInDb.length).toBeGreaterThanOrEqual(2);

      // Now test the API endpoint
      const response = await request(app.getHttpServer())
        .get(`/api/v1/workspaces/${workspaceId}/sessions`)
        .set("Cookie", adminCookie)
        .set("x-workspace-id", workspaceId)
        .expect(200);

      console.log("API Response:", JSON.stringify(response.body, null, 2));

      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("data");
      expect(Array.isArray(response.body.data)).toBe(true);
      
      // This is the actual test - we should have 2 sessions
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);

      // Verify session structure
      const session = response.body.data[0];
      expect(session).toHaveProperty("id");
      expect(session).toHaveProperty("token");
      expect(session).toHaveProperty("expiresAt");
      expect(session).toHaveProperty("ipAddress");
      expect(session).toHaveProperty("userAgent");
      expect(session).toHaveProperty("user");
      expect(session.user).toHaveProperty("id");
      expect(session.user).toHaveProperty("email");
      expect(session.user).toHaveProperty("username");
    });

    it("should return empty array for workspace with no active sessions", async () => {
      // Delete all sessions
      await prisma.authSession.deleteMany({
        where: {
          userId: { in: [adminUserId, employeeUserId] },
        },
      });

      const response = await request(app.getHttpServer())
        .get(`/api/v1/workspaces/${workspaceId}/sessions`)
        .set("Cookie", adminCookie)
        .set("x-workspace-id", workspaceId)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    });

    it("should only return sessions for active workspace members", async () => {
      // Deactivate employee
      await prisma.workspaceMember.update({
        where: {
          workspaceId_userId: {
            workspaceId,
            userId: employeeUserId,
          },
        },
        data: { isActive: false },
      });

      const response = await request(app.getHttpServer())
        .get(`/api/v1/workspaces/${workspaceId}/sessions`)
        .set("Cookie", adminCookie)
        .set("x-workspace-id", workspaceId)
        .expect(200);

      // Should only have admin session now
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].user.id).toBe(adminUserId);
    });

    it("should not return expired sessions", async () => {
      // Create an expired session
      const pastDate = new Date();
      pastDate.setHours(pastDate.getHours() - 1);

      await prisma.authSession.create({
        data: {
          id: `expired_session_${Date.now()}`,
          token: `expired_token_${Date.now()}`,
          userId: employeeUserId,
          expiresAt: pastDate,
          ipAddress: "127.0.0.3",
          userAgent: "Mozilla/5.0 Expired",
        },
      });

      const response = await request(app.getHttpServer())
        .get(`/api/v1/workspaces/${workspaceId}/sessions`)
        .set("Cookie", adminCookie)
        .set("x-workspace-id", workspaceId)
        .expect(200);

      // Should still have only the 2 non-expired sessions
      expect(response.body.data.length).toBe(2);
    });
  });

  describe("DELETE /api/v1/workspaces/:workspaceId/sessions/:sessionToken", () => {
    it("should revoke a specific session", async () => {
      const response = await request(app.getHttpServer())
        .delete(`/api/v1/workspaces/${workspaceId}/sessions/${employeeToken}`)
        .set("Cookie", adminCookie)
        .set("x-workspace-id", workspaceId)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify session was deleted
      const session = await prisma.authSession.findUnique({
        where: { token: employeeToken },
      });
      expect(session).toBeNull();
    });

    it("should return 404 for non-existent session", async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/workspaces/${workspaceId}/sessions/invalid-token`)
        .set("Cookie", adminCookie)
        .set("x-workspace-id", workspaceId)
        .expect(404);
    });
  });

  describe("DELETE /api/v1/workspaces/:workspaceId/sessions", () => {
    it("should revoke all sessions except caller's", async () => {
      const response = await request(app.getHttpServer())
        .delete(`/api/v1/workspaces/${workspaceId}/sessions`)
        .set("Cookie", adminCookie)
        .set("x-workspace-id", workspaceId)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify employee session was deleted
      const employeeSession = await prisma.authSession.findUnique({
        where: { token: employeeToken },
      });
      expect(employeeSession).toBeNull();

      // Verify admin session still exists
      const adminSession = await prisma.authSession.findUnique({
        where: { token: adminToken },
      });
      expect(adminSession).not.toBeNull();
    });
  });
});
