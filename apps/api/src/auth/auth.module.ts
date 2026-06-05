import { Module, Global } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { LegacyAuthController } from "./auth.controller";
import { BetterAuthController } from "./better-auth.controller";
import { AuthUtilsService } from "./services/auth-utils.service";
import { GoogleOAuthService } from "./services/google-oauth.service";
import { BetterAuthService } from "./services/better-auth.service";
import { PrismaService } from "../common/services/prisma.service";
import { ActivityLogService } from "../common/services/activity-log.service";
import { EmailService } from "../common/services/email.service";
import { RedisService } from "../common/services/redis.service";
import { QueueModule } from "../common/modules";
import { AuthGuard } from "../common/guards/auth.guard";

@Global()
@Module({
  imports: [QueueModule],
  controllers: [LegacyAuthController, BetterAuthController],
  providers: [
    AuthService,
    AuthUtilsService,
    GoogleOAuthService,
    BetterAuthService,
    AuthGuard,
    PrismaService,
    ActivityLogService,
    EmailService,
    RedisService,
  ],
  exports: [
    AuthService,
    AuthUtilsService,
    GoogleOAuthService,
    BetterAuthService,
    AuthGuard,
  ],
})
export class AuthModule {}
