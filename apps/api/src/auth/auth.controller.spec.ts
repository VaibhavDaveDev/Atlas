import { Test, TestingModule } from "@nestjs/testing";
import { LegacyAuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { AuthGuard } from "../common/guards/auth.guard";
import { SelectWorkspaceDto } from "./dto/select-workspace.dto";
import { ChangePasswordDto } from "./dto/change-password.dto";
import type { Request } from "express";
import { CustomLoggerService } from "../common/services/custom-logger.service";
import { PrismaService } from "../common/services/prisma.service";

describe("LegacyAuthController", () => {
  let controller: LegacyAuthController;

  const mockAuthService = {
    getUserWorkspaces: vi.fn(),
    selectWorkspace: vi.fn(),
    getCurrentUser: vi.fn(),
    requestPasswordChangeOtp: vi.fn(),
    changePassword: vi.fn(),
  };

  const mockCustomLoggerService = {
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  };

  const mockPrismaService = {
    authSsoProvider: {
      findFirst: vi.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LegacyAuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: CustomLoggerService,
          useValue: mockCustomLoggerService,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<LegacyAuthController>(LegacyAuthController);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("getCurrentUser", () => {
    it("should return current user from request", async () => {
      const req = { user: { userId: "1" } } as any;
      mockAuthService.getCurrentUser.mockResolvedValue({ userId: "1" });
      const result = await controller.getCurrentUser(req);
      expect(result).toEqual({ userId: "1" });
    });
  });

  describe("getUserWorkspaces", () => {
    it("should return workspaces for user", async () => {
      const req = { user: { userId: "1" } } as any;
      await controller.getUserWorkspaces(req);
      expect(mockAuthService.getUserWorkspaces).toHaveBeenCalledWith("1");
    });
  });

  describe("selectWorkspace", () => {
    it("should select workspace", async () => {
      const dto: SelectWorkspaceDto = { workspaceId: "w1" };
      const req = { user: { userId: "1" } } as any;
      await controller.selectWorkspace(dto, req);
      expect(mockAuthService.selectWorkspace).toHaveBeenCalledWith("1", "w1");
    });
  });

  describe("requestChangePasswordOtp", () => {
    it("should request otp", async () => {
      const req = { user: { userId: "1" } } as any;
      mockAuthService.getCurrentUser.mockResolvedValue({
        email: "test@test.com",
      });
      await controller.requestChangePasswordOtp(req);
      expect(mockAuthService.requestPasswordChangeOtp).toHaveBeenCalledWith(
        "1",
        "test@test.com",
      );
    });
  });

  describe("changePassword", () => {
    it("should change password", async () => {
      const dto: ChangePasswordDto = {
        otp: "123456",
        newPassword: "newPassword123!",
      };
      const req = {
        user: { userId: "1" },
        ip: "1.1.1.1",
        headers: { "user-agent": "UA" },
      } as any;
      await controller.changePassword(dto, req);
      expect(mockAuthService.changePassword).toHaveBeenCalled();
    });
  });

  describe("checkSsoDomain", () => {
    it("should return hasSso true if provider exists", async () => {
      mockPrismaService.authSsoProvider.findFirst.mockResolvedValue({ providerId: "google" });
      const result = await controller.checkSsoDomain("test.com");
      expect(result).toEqual({ hasSso: true, providerId: "google" });
    });

    it("should return hasSso false if provider does not exist", async () => {
      mockPrismaService.authSsoProvider.findFirst.mockResolvedValue(null);
      const result = await controller.checkSsoDomain("test.com");
      expect(result).toEqual({ hasSso: false, providerId: null });
    });
  });
});
