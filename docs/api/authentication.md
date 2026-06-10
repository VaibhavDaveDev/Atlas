# API Authentication

Atlas ERP uses Better Auth for its authentication layer. To access protected endpoints, you must obtain a valid session token.

## Token Types

There are two primary ways to authenticate against the API:
1. **Session Cookies:** The standard method used by the web frontend. Better Auth sets an `HttpOnly` cookie upon successful login.
2. **Bearer Tokens:** For third-party integrations or mobile apps, you can send the session token in the `Authorization` header.

## 1. Login Endpoint

To obtain a token, send your credentials to the login endpoint.

### POST `/api/v1/auth/sign-in/email`

**Headers:**
```http
Content-Type: application/json
```

**Body:**
```json
{
  "email": "user@example.com",
  "password": "your-secure-password"
}
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-123",
      "email": "user@example.com",
      "name": "Jane Doe"
    },
    "session": {
      "token": "eyJhbG... (base64 token)"
    }
  }
}
```

*(Note: The actual URL path may depend on your exact Better Auth configuration).*

## 2. Using the Token (Bearer Auth)

Once you have the session token, include it in the `Authorization` header for all subsequent requests.

```http
GET /api/v1/projects HTTP/1.1
Host: api.yourdomain.com
Authorization: Bearer eyJhbG...
```

## 3. Workspace Context

Because Atlas ERP is multi-tenant, most endpoints require you to specify which workspace you are operating in.

When you log in through the web app, you hit the `POST /api/v1/auth/select-workspace` endpoint, which updates your session to include an `activeWorkspaceId`.

If you are using Bearer tokens for a script, ensure the token you generated is tied to a session that has a workspace selected, or pass the workspace ID as required by specific endpoints (often via a custom header like `x-workspace-id` or within the request body, depending on the exact implementation of the `WorkspaceGuard`).