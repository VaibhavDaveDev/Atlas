import { Module } from "@nestjs/common";
import { WorkspaceController } from "./workspace.controller";
import { WorkspaceService } from "./workspace.service";
import { PrismaService } from "../common/services/prisma.service";
import { RedisService } from "../common/services/redis.service";
import { QueueModule } from "../common/modules";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [QueueModule, AuthModule],
  controllers: [WorkspaceController],
  providers: [WorkspaceService, PrismaService, RedisService],
  exports: [WorkspaceService],
})
export class WorkspaceModule {}
