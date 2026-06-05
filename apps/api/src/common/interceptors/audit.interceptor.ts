import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditTrailService } from '../../logs/audit-trail.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(private readonly auditTrailService: AuditTrailService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, user, ip } = request;
    const userAgent = request.get('user-agent');

    // Only audit mutations (POST, PUT, PATCH, DELETE)
    const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
    
    // Skip specific paths that shouldn't be audited or are too noisy
    const isExcluded = url.includes('/logs/') || url.includes('/metrics') || url.includes('/auth/');

    if (!isMutation || isExcluded) {
      return next.handle();
    }

    return next.handle().pipe(
      tap({
        next: (data) => {
          // If we have a user and workspace, log the audit event
          if (user && user.workspaceId) {
            this.auditTrailService.log({
              workspaceId: user.workspaceId,
              userId: user.userId,
              action: method,
              entity: this.extractEntity(url),
              entityId: this.extractEntityId(url, data),
              details: {
                path: url,
                body: this.sanitizeBody(body),
                response: this.sanitizeResponse(data),
              },
              ipAddress: ip,
              userAgent,
            }).catch(err => {
              this.logger.error(`Failed to log audit event: ${err.message}`);
            });
          }
        },
        error: (err) => {
          // Optionally log failed mutations as well
          this.logger.debug(`Mutation failed: ${method} ${url}`);
        }
      }),
    );
  }

  private extractEntity(url: string): string {
    const parts = url.split('/');
    // Assuming /api/v1/:entity/...
    return parts[3] || 'unknown';
  }

  private extractEntityId(url: string, responseData: any): string | undefined {
    // Try to get ID from URL params (parts[4])
    const parts = url.split('/');
    if (parts[4] && parts[4].length > 8) {
      return parts[4];
    }
    // Or from response data
    return responseData?.id || responseData?.workspaceId;
  }

  private sanitizeBody(body: any): any {
    if (!body) return undefined;
    const sanitized = { ...body };
    // Remove sensitive fields
    const sensitiveFields = ['password', 'token', 'secret', 'apiKey'];
    sensitiveFields.forEach(field => {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    });
    return sanitized;
  }

  private sanitizeResponse(data: any): any {
    if (!data) return undefined;
    // We probably don't want to store the whole response, just keys or something
    // For now just return a summary or the ID
    return data.id ? { id: data.id } : undefined;
  }
}
