import { describe, it, expect, beforeEach, vi } from "vitest";
import { ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { WorkspaceGuard } from "./workspace.guard";
import { PrismaService } from "../../common/services/prisma.service";

describe("WorkspaceGuard", () => {
  let guard: WorkspaceGuard;
  let mockPrismaService: any;

  beforeEach(() => {
    mockPrismaService = {
      workspaceMember: {
        findUnique: vi.fn(),
      },
    };
    guard = new WorkspaceGuard(mockPrismaService as unknown as PrismaService);
  });

  it("should be defined", () => {
    expect(guard).toBeDefined();
  });

  it("should throw UnauthorizedException if no user is authenticated", async () => {
    const context = {
      switchToHttp: vi.fn().mockReturnValue({
        getRequest: vi.fn().mockReturnValue({ user: null }),
      }),
    } as unknown as ExecutionContext;

    await expect(guard.canActivate(context)).rejects.toThrow(
      new UnauthorizedException("User not authenticated"),
    );
  });

  it("should allow access if user is SUPERADMIN", async () => {
    const context = {
      switchToHttp: vi.fn().mockReturnValue({
        getRequest: vi.fn().mockReturnValue({
          user: { globalRole: "SUPERADMIN" },
        }),
      }),
    } as unknown as ExecutionContext;

    expect(await guard.canActivate(context)).toBe(true);
  });

  it("should throw UnauthorizedException if workspaceId is missing in token", async () => {
    const context = {
      switchToHttp: vi.fn().mockReturnValue({
        getRequest: vi.fn().mockReturnValue({
          user: { globalRole: "USER", userId: "u1" }, // No workspaceId
        }),
      }),
    } as unknown as ExecutionContext;

    await expect(guard.canActivate(context)).rejects.toThrow(
      new UnauthorizedException(
        "No workspace selected. Please call /auth/select-workspace first."
      ),
    );
  });

  it("should throw UnauthorizedException if user is not a member of the workspace", async () => {
    const context = {
      switchToHttp: vi.fn().mockReturnValue({
        getRequest: vi.fn().mockReturnValue({
          user: { globalRole: "USER", userId: "u1", workspaceId: "w1" },
        }),
      }),
    } as unknown as ExecutionContext;

    mockPrismaService.workspaceMember.findUnique.mockResolvedValue(null);

    await expect(guard.canActivate(context)).rejects.toThrow(
      new UnauthorizedException("User is not a member of this workspace"),
    );
  });

  it("should throw UnauthorizedException if workspace is not ACTIVE", async () => {
    const context = {
      switchToHttp: vi.fn().mockReturnValue({
        getRequest: vi.fn().mockReturnValue({
          user: { globalRole: "USER", userId: "u1", workspaceId: "w1" },
        }),
      }),
    } as unknown as ExecutionContext;

    mockPrismaService.workspaceMember.findUnique.mockResolvedValue({
      workspace: { status: "SUSPENDED" },
      role: { name: "USER" },
    });

    await expect(guard.canActivate(context)).rejects.toThrow(
      new UnauthorizedException("Workspace is not active"),
    );
  });

  it("should allow access and attach workspace info to request if valid", async () => {
    const req = {
      user: { globalRole: "USER", userId: "u1", workspaceId: "w1" },
    };
    const context = {
      switchToHttp: vi.fn().mockReturnValue({
        getRequest: vi.fn().mockReturnValue(req),
      }),
    } as unknown as ExecutionContext;

    mockPrismaService.workspaceMember.findUnique.mockResolvedValue({
      workspace: { status: "ACTIVE" },
      role: { name: "ADMIN" },
      department: "Engineering",
    });

    expect(await guard.canActivate(context)).toBe(true);
    expect(req.user.workspaceRole).toBe("ADMIN");
    expect(req.user.department).toBe("Engineering");
  });
});
