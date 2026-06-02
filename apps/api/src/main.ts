import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { AllExceptionsFilter } from "./common/filters/all-exception.filter";
import { LoggerService, ValidationPipe } from "@nestjs/common";
import { TransformInterceptor } from "./common/interceptors/transform.interceptor";
import {
  WINSTON_MODULE_NEST_PROVIDER,
  WINSTON_MODULE_PROVIDER,
} from "nest-winston";
import { Logger } from "winston";
import helmet from "helmet";
import { setupSwagger } from "./common/config/swagger.config";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  // Set global prefix for all API routes
  app.setGlobalPrefix("api/v1");

  // Use Winston logger
  const nestLogger = app.get<LoggerService>(WINSTON_MODULE_NEST_PROVIDER);
  app.useLogger(nestLogger);

  const winstonLogger = app.get<Logger>(WINSTON_MODULE_PROVIDER);
  app.useGlobalFilters(new AllExceptionsFilter(winstonLogger));
  app.useGlobalInterceptors(new TransformInterceptor(winstonLogger));

  // ── CORS ──────────────────────────────────────────────────────────────────
  // Allow the Next.js frontend to call the API from the browser.
  // In development this covers localhost on common ports.
  // In production, set CORS_ORIGIN env var to the real frontend domain (comma-separated).
  const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(",").map((o) => o.trim())
    : [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "http://127.0.0.1:3000",
      ];

  app.enableCors({
    origin: allowedOrigins,
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "x-device",
      "x-workspace-id",
    ],
  });
  nestLogger.log(`CORS enabled for: ${allowedOrigins.join(", ")}`, "Bootstrap");
  // ─────────────────────────────────────────────────────────────────────────

  // Check environment for Swagger setup
  const isProduction = process.env.NODE_ENV === "production";
  const enableSwagger = process.env.ENABLE_SWAGGER !== "false"; // Default true

  // Security middleware
  const helmetConfig =
    !isProduction || enableSwagger
      ? {
          contentSecurityPolicy: {
            directives: {
              defaultSrc: ["'self'"],
              styleSrc: ["'self'", "'unsafe-inline'"],
              imgSrc: ["'self'", "data:", "https:"],
              scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Swagger UI needs this
            },
          },
          frameguard: { action: "deny" as const },
          hidePoweredBy: true,
          hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
          noSniff: true,
          dnsPrefetchControl: { allow: false },
          referrerPolicy: {
            policy: "strict-origin-when-cross-origin" as const,
          },
        }
      : {
          contentSecurityPolicy: {
            directives: {
              defaultSrc: ["'self'"],
              styleSrc: ["'self'", "'unsafe-inline'"],
              imgSrc: ["'self'", "data:", "https:"],
              scriptSrc: ["'self'"],
            },
          },
          frameguard: { action: "deny" as const },
          hidePoweredBy: true,
          hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
          noSniff: true,
          dnsPrefetchControl: { allow: false },
          referrerPolicy: {
            policy: "strict-origin-when-cross-origin" as const,
          },
        };

  app.use(helmet(helmetConfig));

  // Swagger docs
  if (!isProduction || enableSwagger) {
    setupSwagger(app);
    nestLogger.log("Swagger documentation available at /docs", "Bootstrap");
  } else {
    nestLogger.log("Swagger documentation disabled in production", "Bootstrap");
  }

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strip unknown properties
      forbidNonWhitelisted: true, // throw on unknown properties
      transform: true, // auto-convert types (string → number etc.)
    }),
  );

  // Read port from API_PORT (our .env convention), then PORT, then fallback to 3001
  const port = process.env.API_PORT ?? process.env.PORT ?? 3001;

  nestLogger.log("Application is starting...", "Bootstrap");

  await app.listen(port, "0.0.0.0");

  nestLogger.log(
    `Application is running on: ${await app.getUrl()}`,
    "Bootstrap",
  );
}

bootstrap().catch((err) => {
  console.error("Error during bootstrap:", err);
  process.exit(1);
});
