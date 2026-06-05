import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../common/services/prisma.service";
import * as crypto from 'crypto';

@Injectable()
export class AuditTrailService {
  private readonly logger = new Logger(AuditTrailService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Log an audit event with tamper-evident hash chaining.
   */
  async log(data: {
    workspaceId: string;
    userId?: string;
    action: string;
    entity: string;
    entityId?: string;
    details?: any;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    try {
      // Check if auditing is enabled for this workspace
      const workspace = await this.prisma.workspace.findUnique({
        where: { id: data.workspaceId },
        select: { isAuditEnabled: true },
      });

      if (!workspace?.isAuditEnabled) {
        return;
      }

      await this.prisma.$transaction(async (tx) => {
        // Lock the workspace row to serialize audit trail writes for this workspace
        // This prevents race conditions in hash chaining
        await tx.$queryRaw`SELECT id FROM "workspaces" WHERE id = ${data.workspaceId}::uuid FOR UPDATE`;

        // Get the last audit record's hash for chaining
        const lastRecord = await tx.auditTrail.findFirst({
          where: { workspaceId: data.workspaceId },
          orderBy: { createdAt: 'desc' },
          select: { hash: true },
        });

        const previousHash = lastRecord?.hash || '0'.repeat(64);
        
        // Calculate current record's hash using canonical JSON for stability
        const content = this.canonicalStringify({
          workspaceId: data.workspaceId,
          userId: data.userId || null,
          action: data.action,
          entity: data.entity,
          entityId: data.entityId || null,
          details: data.details || null,
          previousHash,
        });
        
        const hash = crypto.createHash('sha256').update(content).digest('hex');

        // Record to TimescaleDB
        await tx.auditTrail.create({
          data: {
            workspaceId: data.workspaceId,
            userId: data.userId,
            action: data.action,
            entity: data.entity,
            entityId: data.entityId,
            details: data.details,
            ipAddress: data.ipAddress,
            userAgent: data.userAgent,
            hash,
            previousHash,
          },
        });
      });
    } catch (error) {
      this.logger.error(`Failed to record audit trail: ${error.message}`, error.stack);
    }
  }

  /**
   * Verify the integrity of the audit hash chain
   */
  async verifyIntegrity(workspaceId: string): Promise<{ isValid: boolean; invalidRecordId?: string }> {
    const logs = await this.prisma.auditTrail.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'asc' }, // Verify from oldest to newest
    });

    let expectedPreviousHash = '0'.repeat(64);

    for (const log of logs) {
      if (log.previousHash !== expectedPreviousHash) {
        this.logger.warn(`Integrity check failed at log ${log.id}: previousHash mismatch. Expected ${expectedPreviousHash}, got ${log.previousHash}`);
        return { isValid: false, invalidRecordId: log.id };
      }

      // Must exactly match the structure and stringification in log()
      const content = this.canonicalStringify({
        workspaceId: log.workspaceId,
        userId: log.userId || null,
        action: log.action,
        entity: log.entity,
        entityId: log.entityId || null,
        details: log.details || null,
        previousHash: log.previousHash,
      });

      const calculatedHash = crypto.createHash('sha256').update(content).digest('hex');

      if (log.hash !== calculatedHash) {
        this.logger.warn(`Integrity check failed at log ${log.id}: hash mismatch. Calculated ${calculatedHash}, stored ${log.hash}`);
        return { isValid: false, invalidRecordId: log.id };
      }

      expectedPreviousHash = log.hash;
    }

    return { isValid: true };
  }

  /**
   * Recomputes all hashes for a workspace's audit trail.
   * Useful for initializing or repairing the chain.
   */
  async recalculateHashes(workspaceId: string): Promise<{ count: number }> {
    this.logger.log(`Recalculating audit hashes for workspace ${workspaceId}`);
    
    return await this.prisma.$transaction(async (tx) => {
      // Lock workspace to prevent new logs during recalculation
      await tx.$queryRaw`SELECT id FROM "workspaces" WHERE id = ${workspaceId}::uuid FOR UPDATE`;

      const logs = await tx.auditTrail.findMany({
        where: { workspaceId },
        orderBy: { createdAt: 'asc' },
      });

      let currentPreviousHash = '0'.repeat(64);
      let count = 0;

      for (const log of logs) {
        const content = this.canonicalStringify({
          workspaceId: log.workspaceId,
          userId: log.userId || null,
          action: log.action,
          entity: log.entity,
          entityId: log.entityId || null,
          details: log.details || null,
          previousHash: currentPreviousHash,
        });

        const newHash = crypto.createHash('sha256').update(content).digest('hex');

        await tx.auditTrail.update({
          where: { id: log.id },
          data: {
            hash: newHash,
            previousHash: currentPreviousHash,
          },
        });

        currentPreviousHash = newHash;
        count++;
      }

      return { count };
    });
  }

  /**
   * Deterministic JSON stringification to ensure stable hashes.
   */
  private canonicalStringify(obj: any): string {
    return JSON.stringify(obj, (key, value) => {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        return Object.keys(value)
          .sort()
          .reduce((result, k) => {
            result[k] = value[k];
            return result;
          }, {} as any);
      }
      return value;
    });
  }

  /**
   * Query audit logs with strict tenant isolation
   */
  async getLogs(params: {
    workspaceId?: string; // Optional for Super Admins
    userId?: string;
    entity?: string;
    action?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<{ logs: any[]; total: number }> {
    const { workspaceId, userId, entity, action, startDate, endDate, limit = 50, offset = 0 } = params;

    const where: any = {};
    if (workspaceId) where.workspaceId = workspaceId;
    if (userId) where.userId = userId;
    if (entity) where.entity = entity;
    if (action) where.action = action;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditTrail.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      this.prisma.auditTrail.count({ where }),
    ]);

    return { logs, total };
  }
}
