import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../common/services/prisma.service";
import { NotificationType, Notification } from "@atlas/database";

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    workspaceId: string;
    userId: string;
    title: string;
    message: string;
    type?: NotificationType;
    metadata?: any;
  }): Promise<Notification> {
    return this.prisma.notification.create({
      data: {
        workspaceId: data.workspaceId,
        userId: data.userId,
        title: data.title,
        message: data.message,
        type: data.type || "INFO",
        metadata: data.metadata || {},
      },
    });
  }

  async notifyMany(data: {
    workspaceId: string;
    userIds: string[];
    title: string;
    message: string;
    type?: NotificationType;
    metadata?: any;
  }) {
    if (data.userIds.length === 0) return;

    return this.prisma.notification.createMany({
      data: data.userIds.map((userId) => ({
        workspaceId: data.workspaceId,
        userId: userId,
        title: data.title,
        message: data.message,
        type: data.type || "INFO",
        metadata: data.metadata || {},
      })),
    });
  }

  async findAll(userId: string): Promise<Notification[]> {
    // Get user's retention setting
    const profile = await this.prisma.userProfile.findUnique({
      where: { authId: userId },
      select: { notificationRetentionDays: true },
    });

    const retentionDays = profile?.notificationRetentionDays ?? 30;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    return this.prisma.notification.findMany({
      where: {
        userId,
        createdAt: {
          gte: cutoffDate,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async getUnreadCount(userId: string) {
    const profile = await this.prisma.userProfile.findUnique({
      where: { authId: userId },
      select: { notificationRetentionDays: true },
    });

    const retentionDays = profile?.notificationRetentionDays ?? 30;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    return this.prisma.notification.count({
      where: {
        userId,
        isRead: false,
        createdAt: {
          gte: cutoffDate,
        },
      },
    });
  }

  async markAsRead(id: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: {
        id,
        userId,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }
}
