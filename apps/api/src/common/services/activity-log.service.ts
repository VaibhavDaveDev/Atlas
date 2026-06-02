import { Injectable } from "@nestjs/common";
import { PrismaService } from "./prisma.service";
import { Prisma } from "@atlas/database";
import { CustomLoggerService } from "./custom-logger.service";

/**
 * Activity Log Service
 * Simplified version for Atlas ERP
 */
@Injectable()
export class ActivityLogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly customLogger: CustomLoggerService,
  ) {}

  /**
   * Log a create action
   */
  async logCreate(
    entityType: string,
    entityId: string,
    data: Record<string, any>,
    metadata: {
      ip: string;
      userAgent: string;
      actionedBy: string;
      device?: string;
    },
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const prismaClient = tx || this.prisma;

    try {
      await prismaClient.activityLog.create({
        data: {
          workspaceId: "system", // For auth actions, use 'system'
          userId: metadata.actionedBy,
          entityType,
          entityId,
          action: "CREATE",
          changes: data,
          ipAddress: metadata.ip,
          userAgent: metadata.userAgent,
        },
      });
    } catch (error) {
      this.customLogger.error(
        `Failed to log create action for ${entityType}:${entityId}`,
        error instanceof Error ? error.stack : undefined,
        "ActivityLogService",
      );
    }
  }

  /**
   * Log an update action
   */
  async logUpdate(
    entityType: string,
    entityId: string,
    changes: Array<{ fieldName: string; oldValue: any; newValue: any }>,
    metadata: {
      ip: string;
      userAgent: string;
      actionedBy: string;
      device?: string;
    },
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const prismaClient = tx || this.prisma;

    try {
      await prismaClient.activityLog.create({
        data: {
          workspaceId: "system",
          userId: metadata.actionedBy,
          entityType,
          entityId,
          action: "UPDATE",
          changes: { fields: changes },
          ipAddress: metadata.ip,
          userAgent: metadata.userAgent,
        },
      });
    } catch (error) {
      this.customLogger.error(
        `Failed to log update action for ${entityType}:${entityId}`,
        error instanceof Error ? error.stack : undefined,
        "ActivityLogService",
      );
    }
  }

  /**
   * Log a delete action
   */
  async logDelete(
    entityType: string,
    entityId: string,
    metadata: {
      ip: string;
      userAgent: string;
      actionedBy: string;
      device?: string;
    },
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const prismaClient = tx || this.prisma;

    try {
      await prismaClient.activityLog.create({
        data: {
          workspaceId: "system",
          userId: metadata.actionedBy,
          entityType,
          entityId,
          action: "DELETE",
          ipAddress: metadata.ip,
          userAgent: metadata.userAgent,
        },
      });
    } catch (error) {
      this.customLogger.error(
        `Failed to log delete action for ${entityType}:${entityId}`,
        error instanceof Error ? error.stack : undefined,
        "ActivityLogService",
      );
    }
  }

  /**
   * Log a custom event
   */
  async logCustomEvent(
    entityType: string,
    entityId: string,
    eventType: string,
    metadata: {
      ip: string;
      userAgent: string;
      actionedBy: string;
      device?: string;
    },
    changes?: Array<{ fieldName: string; oldValue: any; newValue: any }>,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const prismaClient = tx || this.prisma;

    try {
      await prismaClient.activityLog.create({
        data: {
          workspaceId: "system",
          userId: metadata.actionedBy,
          entityType,
          entityId,
          action: "UPDATE", // Custom events are treated as updates
          changes: changes ? { fields: changes, eventType } : { eventType },
          ipAddress: metadata.ip,
          userAgent: metadata.userAgent,
        },
      });
    } catch (error) {
      this.customLogger.error(
        `Failed to log custom event ${eventType} for ${entityType}:${entityId}`,
        error instanceof Error ? error.stack : undefined,
        "ActivityLogService",
      );
    }
  }
}
