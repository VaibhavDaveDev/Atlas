import { describe, it, expect, beforeEach, vi } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { Reflector } from "@nestjs/core";
import { ExecutionContext, ForbiddenException } from "@nestjs/common";
import { PermissionGuard } from "./permission.guard";
import { PrismaService } from "../../common/services/prisma.service";

describe("PermissionGuard", () => {
  let guard: PermissionGuard;

  const mockPrismaService = {
    rolePermission: {
      findMany: vi.fn(),
    },
    userPermission: {
      findMany: vi.fn(),
    },
  };

  const mockReflector = {
    getAllAndOverride: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionGuard,
        { provide: Reflector, useValue: mockReflector },
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    guard = module.get<PermissionGuard>(PermissionGuard);

    // Clear mocks before each test
    mockPrismaService.rolePermission.findMany.mockClear();
    mockPrismaService.userPermission.findMany.mockClear();
  });

  it("should be defined", () => {
    expect(guard).toBeDefined();
  });

  it("should allow access if no permission requirement is set", async () => {
    mockReflector.getAllAndOverride.mockReturnValue(null);
    const context = {
      getHandler: vi.fn(),
      getClass: vi.fn(),
    } as unknown as ExecutionContext;

    expect(await guard.canActivate(context)).toBe(true);
  });

  it("should allow access for SUPERADMIN", async () => {
    mockReflector.getAllAndOverride.mockReturnValue({
      resource: "test",
      action: "read",
    });
    const context = {
      getHandler: vi.fn(),
      getClass: vi.fn(),
      switchToHttp: vi.fn().mockReturnValue({
        getRequest: vi.fn().mockReturnValue({
          user: { globalRole: "SUPERADMIN" },
        }),
      }),
    } as unknown as ExecutionContext;

    expect(await guard.canActivate(context)).toBe(true);
  });

  it("should allow access for OWNER", async () => {
    mockReflector.getAllAndOverride.mockReturnValue({
      resource: "test",
      action: "read",
    });
    const context = {
      getHandler: vi.fn(),
      getClass: vi.fn(),
      switchToHttp: vi.fn().mockReturnValue({
        getRequest: vi.fn().mockReturnValue({
          user: { workspaceRole: "OWNER" },
        }),
      }),
    } as unknown as ExecutionContext;

    expect(await guard.canActivate(context)).toBe(true);
  });

  it("should allow access if role has permission", async () => {
    mockReflector.getAllAndOverride.mockReturnValue({
      resource: "test",
      action: "read",
      scope: "all",
    });
    const context = {
      getHandler: vi.fn(),
      getClass: vi.fn(),
      switchToHttp: vi.fn().mockReturnValue({
        getRequest: vi.fn().mockReturnValue({
          user: { workspaceId: "w1", workspaceRole: "ADMIN" },
        }),
      }),
    } as unknown as ExecutionContext;

    mockPrismaService.rolePermission.findMany.mockResolvedValue([
      {
        id: "rp1",
        permission: { resource: "test", action: "read", scope: "all" },
      },
    ]);

    expect(await guard.canActivate(context)).toBe(true);
    expect(mockPrismaService.rolePermission.findMany).toHaveBeenCalledWith({
      where: {
        workspaceId: "w1",
        role: { name: "ADMIN" },
        permission: { resource: "test", action: "read" },
      },
      include: {
        permission: true,
      },
    });
  });

  it("should allow access if user has custom permission", async () => {
    mockReflector.getAllAndOverride.mockReturnValue({
      resource: "test",
      action: "read",
      scope: "all",
    });
    const context = {
      getHandler: vi.fn(),
      getClass: vi.fn(),
      switchToHttp: vi.fn().mockReturnValue({
        getRequest: vi.fn().mockReturnValue({
          user: { workspaceId: "w1", workspaceRole: "USER", userId: "u1" },
        }),
      }),
    } as unknown as ExecutionContext;

    mockPrismaService.rolePermission.findMany.mockResolvedValue([]);
    mockPrismaService.userPermission.findMany.mockResolvedValue([
      {
        id: "up1",
        permission: { resource: "test", action: "read", scope: "all" },
      },
    ]);

    expect(await guard.canActivate(context)).toBe(true);
  });

  it("should throw ForbiddenException if no permission is found", async () => {
    mockReflector.getAllAndOverride.mockReturnValue({
      resource: "test",
      action: "read",
      scope: "all",
    });
    const context = {
      getHandler: vi.fn(),
      getClass: vi.fn(),
      switchToHttp: vi.fn().mockReturnValue({
        getRequest: vi.fn().mockReturnValue({
          user: { workspaceId: "w1", workspaceRole: "USER", userId: "u1" },
        }),
      }),
    } as unknown as ExecutionContext;

    mockPrismaService.rolePermission.findMany.mockResolvedValue([]);
    mockPrismaService.userPermission.findMany.mockResolvedValue([]);

    await expect(guard.canActivate(context)).rejects.toThrow(
      ForbiddenException,
    );
  });
});
