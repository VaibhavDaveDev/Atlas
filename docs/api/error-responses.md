# Error Responses

Atlas ERP uses a standardized error response format across all REST API endpoints. This consistency makes it easier for frontend clients and third-party integrators to handle errors gracefully.

## The Standard Error Object

Whenever an API request fails (HTTP Status >= 400), the response body will always follow this structure:

```json
{
  "success": false,
  "error": {
    "statusCode": 400,
    "message": "Validation failed",
    "details": null,
    "timestamp": "2026-06-11T12:00:00.000Z"
  }
}
```

### Fields

- `success`: Always `false` for error responses.
- `error.statusCode`: The HTTP status code (e.g., 400, 401, 403, 404, 500).
- `error.message`: A human-readable string or array of strings describing the error.
- `error.details`: (Optional) Additional context, such as a specific error code or stack trace (in development mode).
- `error.timestamp`: ISO 8601 timestamp of when the error occurred.

## Common HTTP Status Codes

| Code | Meaning | Typical Cause |
|------|---------|---------------|
| **400** | Bad Request | Validation failure (e.g., missing required fields, invalid email format). `message` will often be an array of specific validation errors. |
| **401** | Unauthorized | Missing, expired, or invalid authentication token. |
| **403** | Forbidden | The user is authenticated but lacks the specific Role or Permission required for the endpoint. |
| **404** | Not Found | The requested resource (e.g., Project ID, User ID) does not exist in the database. |
| **409** | Conflict | Unique constraint violation (e.g., trying to create a user with an email that already exists). |
| **429** | Too Many Requests | The client has exceeded the API rate limit. |
| **500** | Internal Server Error | An unexpected error occurred on the server (e.g., database connection failure). |

## Handling Validation Errors (400 Bad Request)

When you submit a `POST` or `PATCH` request with invalid data, NestJS's `ValidationPipe` will intercept the request and return a 400 error. The `message` field will contain an array of the specific validation rules that failed.

**Example Request:**
```json
{
  "email": "not-an-email",
  "password": "short"
}
```

**Example Response:**
```json
{
  "success": false,
  "error": {
    "statusCode": 400,
    "message": [
      "email must be an email",
      "password must be longer than or equal to 8 characters"
    ],
    "details": "Bad Request",
    "timestamp": "2026-06-11T12:05:00.000Z"
  }
}
```
Frontend applications should parse this `message` array to display field-specific error messages to the user.