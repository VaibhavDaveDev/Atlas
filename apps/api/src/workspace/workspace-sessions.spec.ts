import { Test, TestingModule } from "@nestjs/testing";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { WorkspaceService } from "./workspace.service";
import { PrismaService } from "../common/services/prisma.service";
import { EmailQueueService } from "../common/queues/email/email.queue";
import { BetterAuthService } from "../auth/services/better-auth.service";

describe("WorkspaceService - Session Management", () => {
  let service: WorkspaceService;
  let prismaService: any;

  beforeEach(async () => {
    const mockPrismaService = {
      workspace: {
        findUnique: vi.fn(),
      },
      workspaceMember: {
        findMany: vi.fn(),
      },
      authSession: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        delete: vi.fn(),
        deleteMany: vi.fn(),
      },
    };

    const mockEmailQueueService = {
      sendWorkspaceInviteEmail: vi.fn(),
    };

    const mockBetterAuthService = {
      createMagicLink: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkspaceService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: EmailQueueService, useValue: mockEmailQueueService },
        { provide: BetterAuthService, useValue: mockBetterAuthService },
      ],
    }).compile();

    service = module.get<WorkspaceService>(WorkspaceService);
    prismaService = module.get(PrismaService);
  });

  describe("listWorkspaceSessions", () => {
    const workspaceId = "workspace-123";
    const now = new Date();
    const futureDate = new Date(now.getTime() + 3600000); // 1 hour from now

    it("should return empty array when no members exist", async () => {
      prismaService.workspaceMember.findMany.mockResolvedValue([]);

      const result = await service.listWorkspaceSessions(workspaceId);

      expect(result).toEqual([]);
      expect(prismaService.workspaceMember.findMany).toHaveBeenCalledWith({
        where: { workspaceId, isActive: true },
        select: {
          userId: true,
          user: {
            select: {
              id: true,
              email: true,
              username: true,
              image: true,
              profile: {
                select: { firstName: true, lastName: true, avatarUrl: true },
              },
            },
          },
        },
      });
    });

    it("should return empty array when members exist but no sessions", async () => {
      const mockMembers = [
        {
          userId: "user-1",
          user: {
            id: "user-1",
            email: "user1@test.com",
            username: "user1",
            image: null,
            profile: null,
          },
        },
        {
          userId: "user-2",
          user: {
            id: "user-2",
            email: "user2@test.com",
            username: "user2",
            image: null,
            profile: null,
          },
        },
      ];

      prismaService.workspaceMember.findMany.mockResolvedValue(mockMembers);
      prismaService.authSession.findMany.mockResolvedValue([]);

      const result = await service.listWorkspaceSessions(workspaceId);

      expect(result).toEqual([]);
      expect(prismaService.authSession.findMany).toHaveBeenCalledWith({
        where: {
          userId: { in: ["user-1", "user-2"] },
          expiresAt: { gt: expect.any(Date) },
        },
        take: 100,
        orderBy: { updatedAt: "desc" },
      });
    });

    it("should return sessions with user details when sessions exist", async () => {
      const mockMembers = [
        {
          userId: "user-1",
          user: {
            id: "user-1",
            email: "user1@test.com",
            username: "user1",
            image: null,
            profile: {
              firstName: "John",
              lastName: "Doe",
              avatarUrl: "https://example.com/avatar1.jpg",
            },
          },
        },
        {
          userId: "user-2",
          user: {
            id: "user-2",
            email: "user2@test.com",
            username: "user2",
            image: null,
            profile: {
              firstName: "Jane",
              lastName: "Smith",
              avatarUrl: null,
            },
          },
        },
      ];

      const mockSessions = [
        {
          id: "session-1",
          token: "token-1",
          userId: "user-1",
          expiresAt: futureDate,
          ipAddress: "127.0.0.1",
          userAgent: "Mozilla/5.0",
          createdAt: now,
          updatedAt: now,
        },
        {
          id: "session-2",
          token: "token-2",
          userId: "user-2",
          expiresAt: futureDate,
          ipAddress: "192.168.1.1",
          userAgent: "Chrome/100.0",
          createdAt: now,
          updatedAt: now,
        },
      ];

      prismaService.workspaceMember.findMany.mockResolvedValue(mockMembers);
      prismaService.authSession.findMany.mockResolvedValue(mockSessions);

      const result = await service.listWorkspaceSessions(workspaceId);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: "session-1",
        token: "token-1",
        expiresAt: futureDate,
        ipAddress: "127.0.0.1",
        userAgent: "Mozilla/5.0",
        createdAt: now,
        updatedAt: now,
        user: {
          id: "user-1",
          email: "user1@test.com",
          username: "user1",
          image: "https://example.com/avatar1.jpg",
          name: "John Doe",
        },
      });
      expect(result[1]).toEqual({
        id: "session-2",
        token: "token-2",
        expiresAt: futureDate,
        ipAddress: "192.168.1.1",
        userAgent: "Chrome/100.0",
        createdAt: now,
        updatedAt: now,
        user: {
          id: "user-2",
          email: "user2@test.com",
          username: "user2",
          image: null,
          name: "Jane Smith",
        },
      });
    });

    it("should handle user with no profile gracefully", async () => {
      const mockMembers = [
        {
          userId: "user-1",
          user: {
            id: "user-1",
            email: "user1@test.com",
            username: "user1",
            image: "https://example.com/image.jpg",
            profile: null,
          },
        },
      ];

      const mockSessions = [
        {
          id: "session-1",
          token: "token-1",
          userId: "user-1",
          expiresAt: futureDate,
          ipAddress: "127.0.0.1",
          userAgent: "Mozilla/5.0",
          createdAt: now,
          updatedAt: now,
        },
      ];

      prismaService.workspaceMember.findMany.mockResolvedValue(mockMembers);
      prismaService.authSession.findMany.mockResolvedValue(mockSessions);

      const result = await service.listWorkspaceSessions(workspaceId);

      expect(result).toHaveLength(1);
      expect(result[0].user).toEqual({
        id: "user-1",
        email: "user1@test.com",
        username: "user1",
        image: "https://example.com/image.jpg",
        name: "user1@test.com",
      });
    });

    it("should filter out expired sessions", async () => {
      const pastDate = new Date(now.getTime() - 3600000); // 1 hour ago

      const mockMembers = [
        {
          userId: "user-1",
          user: {
            id: "user-1",
            email: "user1@test.com",
            username: "user1",
            image: null,
            profile: null,
          },
        },
      ];

      // Mock returns empty because expired sessions are filtered by the query
      prismaService.workspaceMember.findMany.mockResolvedValue(mockMembers);
      prismaService.authSession.findMany.mockResolvedValue([]);

      const result = await service.listWorkspaceSessions(workspaceId);

      expect(result).toEqual([]);
      expect(prismaService.authSession.findMany).toHaveBeenCalledWith({
        where: {
          userId: { in: ["user-1"] },
          expiresAt: { gt: expect.any(Date) },
        },
        take: 100,
        orderBy: { updatedAt: "desc" },
      });
    });

    it("should limit results to 100 sessions", async () => {
      const mockMembers = Array.from({ length: 50 }, (_, i) => ({
        userId: `user-${i}`,
        user: {
          id: `user-${i}`,
          email: `user${i}@test.com`,
          username: `user${i}`,
          image: null,
          profile: null,
        },
      }));

      prismaService.workspaceMember.findMany.mockResolvedValue(mockMembers);
      prismaService.authSession.findMany.mockResolvedValue([]);

      await service.listWorkspaceSessions(workspaceId);

      expect(prismaService.authSession.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 100,
        })
      );
    });
  });

  describe("revokeWorkspaceSession", () => {
    const workspaceId = "workspace-123";
    const sessionToken = "token-123";
    const now = new Date();
    const futureDate = new Date(now.getTime() + 3600000);

    it("should throw NotFoundException when session not found", async () => {
      prismaService.authSession.findFirst.mockResolvedValue(null);

      await expect(
        service.revokeWorkspaceSession(workspaceId, sessionToken)
      ).rejects.toThrow("Session not found in this workspace");

      expect(prismaService.authSession.findFirst).toHaveBeenCalledWith({
        where: {
          token: sessionToken,
          user: {
            workspaces: { some: { workspaceId, isActive: true } },
          },
        },
      });
    });

    it("should successfully revoke a valid session", async () => {
      const mockSession = {
        id: "session-123",
        token: sessionToken,
        userId: "user-1",
        expiresAt: futureDate,
        ipAddress: "127.0.0.1",
        userAgent: "Mozilla/5.0",
        createdAt: now,
        updatedAt: now,
      };

      prismaService.authSession.findFirst.mockResolvedValue(mockSession);
      prismaService.authSession.delete.mockResolvedValue(mockSession);

      const result = await service.revokeWorkspaceSession(
        workspaceId,
        sessionToken
      );

      expect(result).toEqual({ success: true });
      expect(prismaService.authSession.delete).toHaveBeenCalledWith({
        where: { id: "session-123" },
      });
    });
  });

  describe("revokeAllWorkspaceSessions", () => {
    const workspaceId = "workspace-123";
    const excludeUserId = "admin-user-123";

    it("should revoke all sessions except the calling user", async () => {
      prismaService.authSession.deleteMany.mockResolvedValue({ count: 5 });

      const result = await service.revokeAllWorkspaceSessions(
        workspaceId,
        excludeUserId
      );

      expect(result).toEqual({ success: true });
      expect(prismaService.authSession.deleteMany).toHaveBeenCalledWith({
        where: {
          userId: { not: excludeUserId },
          user: {
            workspaces: { some: { workspaceId, isActive: true } },
          },
        },
      });
    });

    it("should handle case when no sessions to revoke", async () => {
      prismaService.authSession.deleteMany.mockResolvedValue({ count: 0 });

      const result = await service.revokeAllWorkspaceSessions(
        workspaceId,
        excludeUserId
      );

      expect(result).toEqual({ success: true });
    });
  });

  describe("Integration - Full Session Flow", () => {
    it("should correctly map session data with all user information", async () => {
      const workspaceId = "workspace-123";
      const now = new Date();
      const futureDate = new Date(now.getTime() + 3600000);

      // Simulate a complete realistic scenario
      const mockMembers = [
        {
          userId: "user-1",
          user: {
            id: "user-1",
            email: "john.doe@company.com",
            username: "johndoe",
            image: null,
            profile: {
              firstName: "John",
              lastName: "Doe",
              avatarUrl: "https://cdn.example.com/avatars/john.jpg",
            },
          },
        },
        {
          userId: "user-2",
          user: {
            id: "user-2",
            email: "jane.smith@company.com",
            username: "janesmith",
            image: "https://gravatar.com/jane",
            profile: {
              firstName: "Jane",
              lastName: "Smith",
              avatarUrl: null,
            },
          },
        },
        {
          userId: "user-3",
          user: {
            id: "user-3",
            email: "bob.wilson@company.com",
            username: "bobwilson",
            image: null,
            profile: null,
          },
        },
      ];

      const mockSessions = [
        {
          id: "sess-001",
          token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.user1",
          userId: "user-1",
          expiresAt: futureDate,
          ipAddress: "192.168.1.100",
          userAgent:
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          createdAt: new Date("2026-06-08T10:00:00Z"),
          updatedAt: new Date("2026-06-08T12:30:00Z"),
        },
        {
          id: "sess-002",
          token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.user2",
          userId: "user-2",
          expiresAt: futureDate,
          ipAddress: "10.0.0.50",
          userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)",
          createdAt: new Date("2026-06-08T11:00:00Z"),
          updatedAt: new Date("2026-06-08T11:45:00Z"),
        },
        {
          id: "sess-003",
          token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.user3",
          userId: "user-3",
          expiresAt: futureDate,
          ipAddress: "172.16.0.1",
          userAgent: "Chrome/100.0.4896.127",
          createdAt: new Date("2026-06-08T09:00:00Z"),
          updatedAt: new Date("2026-06-08T13:00:00Z"),
        },
      ];

      prismaService.workspaceMember.findMany.mockResolvedValue(mockMembers);
      prismaService.authSession.findMany.mockResolvedValue(mockSessions);

      const result = await service.listWorkspaceSessions(workspaceId);

      // Verify all sessions are returned
      expect(result).toHaveLength(3);

      // Verify session 1 - user with profile and avatarUrl
      expect(result[0]).toMatchObject({
        id: "sess-001",
        token: expect.stringContaining("eyJ"),
        user: {
          id: "user-1",
          email: "john.doe@company.com",
          username: "johndoe",
          image: "https://cdn.example.com/avatars/john.jpg",
          name: "John Doe",
        },
        ipAddress: "192.168.1.100",
      });

      // Verify session 2 - user with profile but no avatarUrl (fallback to image)
      expect(result[1]).toMatchObject({
        id: "sess-002",
        user: {
          id: "user-2",
          email: "jane.smith@company.com",
          username: "janesmith",
          image: "https://gravatar.com/jane",
          name: "Jane Smith",
        },
      });

      // Verify session 3 - user with no profile (fallback to email)
      expect(result[2]).toMatchObject({
        id: "sess-003",
        user: {
          id: "user-3",
          email: "bob.wilson@company.com",
          username: "bobwilson",
          image: null,
          name: "bob.wilson@company.com",
        },
      });
    });
  });
});
