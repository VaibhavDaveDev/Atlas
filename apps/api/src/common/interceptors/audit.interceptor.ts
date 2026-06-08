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
              action: this.deriveAction(method, url),
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

  /**
   * Derive a meaningful, semantic action name from the HTTP method + URL path.
   * e.g. DELETE /api/v1/workspaces/:id/sessions/:token → SESSION_REVOKED
   */
  private deriveAction(method: string, url: string): string {
    const path = url.split('?')[0]; // strip query params
    const segments = path.split('/').filter(Boolean);

    const ACTION_MAP: Array<{ method: string; pattern: RegExp; action: string }> = [
      // Sessions
      { method: 'DELETE', pattern: /\/sessions\/[^/]+$/, action: 'SESSION_REVOKED' },
      { method: 'DELETE', pattern: /\/sessions$/, action: 'ALL_SESSIONS_REVOKED' },
      // Members
      { method: 'PATCH',  pattern: /\/members\/[^/]+\/role$/, action: 'MEMBER_ROLE_CHANGED' },
      { method: 'DELETE', pattern: /\/members\/[^/]+$/, action: 'MEMBER_REMOVED' },
      { method: 'POST',   pattern: /\/invites$/, action: 'MEMBER_INVITED' },
      { method: 'POST',   pattern: /\/invites\/[^/]+\/accept$/, action: 'INVITE_ACCEPTED' },
      { method: 'DELETE', pattern: /\/invites\/[^/]+$/, action: 'INVITE_CANCELLED' },
      // SSO
      { method: 'POST',   pattern: /\/sso-providers$/, action: 'SSO_PROVIDER_ADDED' },
      { method: 'DELETE', pattern: /\/sso-providers\/[^/]+$/, action: 'SSO_PROVIDER_REMOVED' },
      // Workspace settings
      { method: 'PATCH',  pattern: /\/mfa-policy$/, action: 'MFA_POLICY_UPDATED' },
      { method: 'POST',   pattern: /\/audit\/enable$/, action: 'AUDIT_TRAIL_ENABLED' },
      { method: 'PATCH',  pattern: /\/workspaces\/[^/]+$/, action: 'WORKSPACE_UPDATED' },
      // Roles
      { method: 'POST',   pattern: /\/roles$/, action: 'ROLE_CREATED' },
      { method: 'PATCH',  pattern: /\/roles\/[^/]+$/, action: 'ROLE_UPDATED' },
      { method: 'DELETE', pattern: /\/roles\/[^/]+$/, action: 'ROLE_DELETED' },
      // Finance
      { method: 'POST',   pattern: /\/finance\//, action: 'FINANCE_RECORD_CREATED' },
      { method: 'PATCH',  pattern: /\/finance\//, action: 'FINANCE_RECORD_UPDATED' },
      { method: 'DELETE', pattern: /\/finance\//, action: 'FINANCE_RECORD_DELETED' },
      // HR
      { method: 'POST',   pattern: /\/hr\//, action: 'HR_RECORD_CREATED' },
      { method: 'PATCH',  pattern: /\/hr\//, action: 'HR_RECORD_UPDATED' },
      { method: 'DELETE', pattern: /\/hr\//, action: 'HR_RECORD_DELETED' },
      // Project
      { method: 'POST',   pattern: /\/project\//, action: 'PROJECT_RECORD_CREATED' },
      { method: 'PATCH',  pattern: /\/project\//, action: 'PROJECT_RECORD_UPDATED' },
      { method: 'DELETE', pattern: /\/project\//, action: 'PROJECT_RECORD_DELETED' },
    ];

    for (const { method: m, pattern, action } of ACTION_MAP) {
      if (method === m && pattern.test(path)) {
        return action;
      }
    }

    // Fallback to METHOD_ENTITY pattern
    const entity = segments[3]?.toUpperCase().replace(/-/g, '_') || 'RESOURCE';
    return `${method}_${entity}`;
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
