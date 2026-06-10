# Guards & Middleware

NestJS provides a robust request lifecycle. In Atlas ERP, we rely heavily on Guards to enforce security and Interceptors to standardize responses.

## Global Middleware

We apply several standard middleware functions in `main.ts` before the request reaches the NestJS router:

- **Helmet:** Secures the app by setting various HTTP headers.
- **CORS:** Configured to allow requests only from trusted origins defined in the `TRUSTED_ORIGINS` environment variable.

## Guards

Guards determine whether a request will be handled by the route handler or denied (usually returning a `401 Unauthorized` or `403 Forbidden`).

### 1. `ThrottlerGuard`
Applied globally. Limits the number of requests from a single IP within a specified time window (`THROTTLE_TTL` and `THROTTLE_LIMIT`).

### 2. `AuthGuard`
Ensures the user is authenticated via Better Auth. If successful, it attaches the `user` object to the `Request`.

### 3. `WorkspaceGuard`
Critical for multi-tenancy. Ensures the authenticated user has an active workspace selected in their session.

```typescript
@UseGuards(AuthGuard, WorkspaceGuard)
@Get('projects')
getProjects(@Workspace() workspaceId: string) {
  // Safe to assume workspaceId is valid and belongs to the user
}
```

### 4. `RolesGuard` / `PermissionGuard`
Used for Role-Based Access Control (RBAC). Checks if the current user possesses the required role or permission string to access the resource.

```typescript
@UseGuards(AuthGuard, WorkspaceGuard, PermissionGuard)
@RequirePermission('create:invoice')
@Post('invoices')
createInvoice() { ... }
```

### 5. `TurnstileGuard`
Used on sensitive endpoints like registration or password reset to verify the Cloudflare Turnstile token provided by the client.

## Interceptors

Interceptors have access to both the incoming request and the outgoing response.

### `TransformInterceptor`
Applied globally. It ensures every successful response from the API follows a consistent JSON structure.

If a controller returns:
```json
{ "id": 1, "name": "Project A" }
```

The interceptor transforms it to:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Project A"
  }
}
```

This consistency makes frontend parsing predictable and reliable.

### `AuditInterceptor` (Optional)
Can be applied to specific routes to log the exact time a request started and finished, useful for performance tuning specific heavy endpoints.