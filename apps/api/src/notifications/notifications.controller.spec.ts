import { Test, TestingModule } from "@nestjs/testing";
import { NotificationsController } from "./notifications.controller";
import { NotificationsService } from "./notifications.service";
import { AuthGuard } from "../common/guards/auth.guard";
import { ConfigService } from "@nestjs/config";

describe("NotificationsController", () => {
  let controller: NotificationsController;
  let service: NotificationsService;

  const mockNotificationsService = {
    findAll: vi.fn(),
    getUnreadCount: vi.fn(),
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
  };

  const mockAuthGuard = {
    canActivate: vi.fn().mockReturnValue(true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [
        {
          provide: NotificationsService,
          useValue: mockNotificationsService,
        },
        {
          provide: ConfigService,
          useValue: {},
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue(mockAuthGuard)
      .compile();

    controller = module.get<NotificationsController>(NotificationsController);
    service = module.get<NotificationsService>(NotificationsService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("findAll", () => {
    it("should call service.findAll with req.user.userId", async () => {
      const req = { user: { userId: "u1" } };
      mockNotificationsService.findAll.mockResolvedValue([]);

      const result = await controller.findAll(req);
      expect(result).toEqual([]);
      expect(service.findAll).toHaveBeenCalledWith("u1");
    });
  });

  describe("getUnreadCount", () => {
    it("should call service.getUnreadCount with req.user.userId", async () => {
      const req = { user: { userId: "u1" } };
      mockNotificationsService.getUnreadCount.mockResolvedValue(5);

      const result = await controller.getUnreadCount(req);
      expect(result).toEqual({ count: 5 });
      expect(service.getUnreadCount).toHaveBeenCalledWith("u1");
    });
  });

  describe("markAsRead", () => {
    it("should call service.markAsRead with id and req.user.userId", async () => {
      const req = { user: { userId: "u1" } };
      await controller.markAsRead("n1", req);
      expect(service.markAsRead).toHaveBeenCalledWith("n1", "u1");
    });
  });

  describe("markAllAsRead", () => {
    it("should call service.markAllAsRead with req.user.userId", async () => {
      const req = { user: { userId: "u1" } };
      await controller.markAllAsRead(req);
      expect(service.markAllAsRead).toHaveBeenCalledWith("u1");
    });
  });
});
