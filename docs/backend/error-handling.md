# Error Handling

Atlas ERP implements a robust, centralized error handling strategy using NestJS Exception Filters. This ensures that the frontend always receives predictable, cleanly formatted error messages, regardless of where the error originated.

## The Global Exception Filter

The `AllExceptionFilter` is bound globally in `main.ts`. It catches all unhandled exceptions thrown during request processing.

```typescript
// apps/api/src/common/filters/all-exception.filter.ts
import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let details = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      // Handle class-validator validation errors
      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        message = (exceptionResponse as any).message || message;
        details = (exceptionResponse as any).error;
      } else {
        message = exceptionResponse as string;
      }
    } 
    // Handle Prisma specific errors
    else if (exception?.constructor?.name?.includes('PrismaClientKnownRequestError')) {
      const prismaError = exception as any;
      if (prismaError.code === 'P2002') {
        status = HttpStatus.CONFLICT;
        message = 'Unique constraint failed. Record already exists.';
      } else if (prismaError.code === 'P2025') {
        status = HttpStatus.NOT_FOUND;
        message = 'Record not found.';
      }
    }

    response.status(status).json({
      success: false,
      error: {
        statusCode: status,
        message,
        details,
        timestamp: new Date().toISOString(),
      }
    });
  }
}
```

## Standard Error Response Format

Because of the global filter, the frontend can strictly type and expect errors in the following format:

```json
{
  "success": false,
  "error": {
    "statusCode": 400,
    "message": ["email must be an email", "password must be longer than 8 characters"],
    "details": "Bad Request",
    "timestamp": "2026-06-11T12:00:00.000Z"
  }
}
```

## Throwing Errors in Services

When building business logic in your services, you should throw standard NestJS `HttpException` instances (or derived classes like `NotFoundException`, `BadRequestException`).

```typescript
// Good
async getProject(id: string, workspaceId: string) {
  const project = await this.prisma.project.findFirst({ where: { id, workspaceId } });
  
  if (!project) {
    throw new NotFoundException(`Project with ID ${id} not found`);
  }
  
  return project;
}
```

### Custom Application Errors

For complex domain logic, you can define custom error classes in `apps/api/src/common/errors/app.error.ts`. These can extend `HttpException` to provide specific HTTP status codes based on the business rule violation.

```typescript
export class InsufficientFundsException extends BadRequestException {
  constructor() {
    super('Account has insufficient funds for this transaction');
  }
}
```