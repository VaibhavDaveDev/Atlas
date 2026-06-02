import { Module } from "@nestjs/common";
import { UserService } from "./user.service";
import { UserController } from "./user.controller";
import { RedisService } from "../common/services/redis.service";
import { PrismaService } from "../common/services/prisma.service";

@Module({
  controllers: [UserController],
  providers: [UserService, RedisService, PrismaService],
})
export class UserModule {}
