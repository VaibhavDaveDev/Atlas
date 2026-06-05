import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Inject,
} from "@nestjs/common";
import { Response, Request } from "express";
import { WINSTON_MODULE_PROVIDER } from "nest-winston";
import { Logger } from "winston";

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
  ) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Ignore favicon requests - this is normal browser behavior
    if (request.url === "/favicon.ico") {
      response.status(204).end();
      return;
    }

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = "Internal Server Error";
    let error = "Error";

    // 1. Determine the status code and error name first
    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      error = exception.name;
      const res = exception.getResponse();
      if (typeof res === "string") message = res;
      else if (typeof res === "object" && res["message"]) {
        const resMessage = res["message"] as string | string[];
        message = Array.isArray(resMessage)
          ? resMessage.join(", ")
          : String(resMessage);
      }
    } else if (
      typeof exception === "object" &&
      exception !== null &&
      "status" in exception &&
      typeof exception.status === "number"
    ) {
      statusCode = exception.status;
      error = (exception as any).name || "Error";
      message = (exception as any).message || String(exception);
    } else if (exception instanceof Error) {
      message = exception.message;
      error = exception.name;
    } else {
      message = String(exception);
    }

    // 2. Decide if we should log the stack trace
    // Don't log stack traces for 4xx errors (except maybe 401/403) or specific noisier exceptions
    const isCritical = statusCode >= 500;
    const isNoisy = error === 'ThrottlerException' || request.url.includes('/metrics');
    const stack = exception instanceof Error && isCritical ? exception.stack : undefined;
    const exceptionMessage = exception instanceof Error ? exception.message : String(exception);

    // 3. Log the exception with correct metadata
    if (!isNoisy) {
      this.logger.error(`${error}: ${exceptionMessage}`, {
        context: "AllExceptionsFilter",
        statusCode,
        path: request.url,
        method: request.method,
        stack: stack,
      });
    }

    response.status(statusCode).json({
      success: false,
      statusCode,
      message,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
      stack:
        process.env.NODE_ENV === "development" && exception instanceof Error
          ? exception.stack
          : null,
    });
  }
}
