import { Module } from "@nestjs/common";
import { SelfServiceService } from "./self-service.service";
import { SelfServiceController } from "./self-service.controller";
import { PrismaService } from "../common/services/prisma.service";

@Module({
  controllers: [SelfServiceController],
  providers: [SelfServiceService, PrismaService],
})
export class SelfServiceModule {}
