import { Module } from "@nestjs/common";
import { WorkspaceController } from "./workspace.controller";
import { WorkspaceService } from "./workspace.service";
import { PrismaService } from "../common/services/prisma.service";
import { RedisService } from "../common/services/redis.service";
import { QueueModule } from "../common/modules";

@Module({
  imports: [QueueModule],
  controllers: [WorkspaceController],
  providers: [WorkspaceService, PrismaService, RedisService],
  exports: [WorkspaceService],
})
export class WorkspaceModule {}
