import { Test, TestingModule } from "@nestjs/testing";
import { NotificationsService } from "./notifications.service";
import { PrismaService } from "../common/services/prisma.service";

describe("NotificationsService", () => {
  let service: NotificationsService;

  const mockPrismaService = {
    notification: {
      create: vi.fn(),
      createMany: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      updateMany: vi.fn(),
    },
    userProfile: {
      findUnique: vi.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("create", () => {
    it("should create a notification", async () => {
      const data = {
        workspaceId: "w1",
        userId: "u1",
        title: "Test",
        message: "Message",
      };
      mockPrismaService.notification.create.mockResolvedValue(data);

      const result = await service.create(data);
      expect(result).toEqual(data);
      expect(mockPrismaService.notification.create).toHaveBeenCalledWith({
        data: {
          workspaceId: "w1",
          userId: "u1",
          title: "Test",
          message: "Message",
          type: "INFO",
          metadata: {},
        },
      });
    });
  });

  describe("notifyMany", () => {
    it("should create multiple notifications", async () => {
      const data = {
        workspaceId: "w1",
        userIds: ["u1", "u2"],
        title: "Test",
        message: "Message",
      };

      await service.notifyMany(data);
      expect(mockPrismaService.notification.createMany).toHaveBeenCalledWith({
        data: [
          {
            workspaceId: "w1",
            userId: "u1",
            title: "Test",
            message: "Message",
            type: "INFO",
            metadata: {},
          },
          {
            workspaceId: "w1",
            userId: "u2",
            title: "Test",
            message: "Message",
            type: "INFO",
            metadata: {},
          },
        ],
      });
    });

    it("should do nothing if userIds is empty", async () => {
      await service.notifyMany({
        workspaceId: "w1",
        userIds: [],
        title: "T",
        message: "M",
      });
      expect(mockPrismaService.notification.createMany).not.toHaveBeenCalled();
    });
  });

  describe("findAll", () => {
    it("should find notifications with retention filter", async () => {
      const userId = "u1";
      mockPrismaService.userProfile.findUnique.mockResolvedValue({
        notificationRetentionDays: 7,
      });
      mockPrismaService.notification.findMany.mockResolvedValue([]);

      await service.findAll(userId);

      expect(mockPrismaService.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId,
            createdAt: expect.objectContaining({
              gte: expect.any(Date),
            }),
          }),
        }),
      );
    });
  });

  describe("getUnreadCount", () => {
    it("should count unread notifications with retention filter", async () => {
      const userId = "u1";
      mockPrismaService.userProfile.findUnique.mockResolvedValue({
        notificationRetentionDays: 30,
      });
      mockPrismaService.notification.count.mockResolvedValue(5);

      const result = await service.getUnreadCount(userId);
      expect(result).toBe(5);
      expect(mockPrismaService.notification.count).toHaveBeenCalled();
    });
  });

  describe("markAsRead", () => {
    it("should mark a notification as read", async () => {
      await service.markAsRead("n1", "u1");
      expect(mockPrismaService.notification.updateMany).toHaveBeenCalledWith({
        where: { id: "n1", userId: "u1" },
        data: { isRead: true, readAt: expect.any(Date) },
      });
    });
  });

  describe("markAllAsRead", () => {
    it("should mark all unread notifications as read", async () => {
      await service.markAllAsRead("u1");
      expect(mockPrismaService.notification.updateMany).toHaveBeenCalledWith({
        where: { userId: "u1", isRead: false },
        data: { isRead: true, readAt: expect.any(Date) },
      });
    });
  });
});
