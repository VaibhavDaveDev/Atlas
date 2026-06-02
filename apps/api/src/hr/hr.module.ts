import { Module } from "@nestjs/common";
import { HrController } from "./hr.controller";
import { HrService } from "./hr.service";
import { PrismaService } from "../common/services/prisma.service";
import { RedisService } from "../common/services/redis.service";

@Module({
  controllers: [HrController],
  providers: [HrService, PrismaService, RedisService],
  exports: [HrService],
})
export class HrModule {}
