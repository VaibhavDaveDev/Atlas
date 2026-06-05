import { Module } from "@nestjs/common";
import { LogsController } from "./logs.controller";
import { LogsService } from "./logs.service";
import { AuditTrailService } from "./audit-trail.service";
import { PrismaService } from "../common/services/prisma.service";

@Module({
  controllers: [LogsController],
  providers: [LogsService, AuditTrailService, PrismaService],
  exports: [LogsService, AuditTrailService],
})
export class LogsModule {}
