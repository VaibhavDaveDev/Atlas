import { Module } from "@nestjs/common";
import { HrController } from "./hr.controller";
import { HrService } from "./hr.service";
import { PrismaService } from "../common/services/prisma.service";
import { RedisService } from "../common/services/redis.service";
import { FinanceModule } from "../finance/finance.module";

@Module({
  imports: [FinanceModule],
  controllers: [HrController],
  providers: [HrService, PrismaService, RedisService],
  exports: [HrService],
})
export class HrModule {}
