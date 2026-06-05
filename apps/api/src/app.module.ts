import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
// import { BlogModule } from './blog/blog.module';
import { AuthModule } from "./auth/auth.module";
import { UserModule } from "./user/user.module";
import { WorkspaceModule } from "./workspace/workspace.module";
import { HrModule } from "./hr/hr.module";
import { FinanceModule } from "./finance/finance.module";
import { ProjectModule } from "./project/project.module";
import { RoleModule } from "./role/role.module";
import { SelfServiceModule } from "./self-service/self-service.module";
// import { JobModule } from './job/job.module'; // Removed - not needed for ERP
import { RedisModule } from "./common/modules/redis.module";
import { RateLimitModule } from "./common/modules/rate-limit.module";
import { MetricsModule } from "./metrics/metrics.module";
import { WinstonModule } from "nest-winston";
import { winstonConfig } from "./common/config/winston.config";
import { LoggerModule } from "./common/modules/logger.module";
import { LogsModule } from "./logs/logs.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { AuditInterceptor } from "./common/interceptors/audit.interceptor";

@Module({
  imports: [
    // Load environment variables globally
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env.local", ".env"],
    }),
    // Winston logger module (global - can be injected anywhere)
    WinstonModule.forRoot(winstonConfig),
    // Custom logger module (global - can be injected anywhere)
    LoggerModule,
    // Redis module (global - can be injected anywhere)
    RedisModule,
    // Rate limiting module (global - throttles requests using Redis)
    RateLimitModule,
    // Metrics module (global - Prometheus metrics)
    MetricsModule,
    // Logs module (centralized logging & audit logs)
    LogsModule,
    // BlogModule,
    AuthModule,
    UserModule,
    WorkspaceModule,
    HrModule,
    FinanceModule,
    ProjectModule,
    RoleModule,
    SelfServiceModule,
    NotificationsModule,
    // JobModule, // Removed - not needed for ERP
  ],

  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
})
export class AppModule {}
