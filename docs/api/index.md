---
title: API Reference
description: Complete REST and GraphQL API documentation for Atlas ERP, including authentication, endpoints, rate limiting, and error handling
tags:
  - api
  - rest
  - graphql
  - authentication
  - endpoints
  - reference
---

# API Reference

Welcome to the Atlas ERP API Reference. The backend exposes a comprehensive, RESTful API (built with NestJS) that powers the frontend application and can be used for third-party integrations.

## Base URL

In local development, the API is available at:
```
http://localhost:3001/api/v1
```

In production, the base URL depends on your deployment (e.g., `https://api.yourdomain.com/api/v1`).

## In this section

- [Authentication](authentication.md) — How to authenticate and obtain tokens.
- [Authorization](authorization.md) — Roles, permissions, and workspace scoping.
- [REST Endpoints](rest-endpoints.md) — List of available controllers and routes.
- [GraphQL Schema](graphql-schema.md) — Information on GraphQL support (if enabled).
- [Rate Limiting](rate-limiting.md) — API request limits and throttling.
- [Error Responses](error-responses.md) — Understanding API error formats.

## General Conventions

1. **JSON Only:** All requests must send `Content-Type: application/json` and will receive JSON responses.
2. **Standard Response Format:** All successful API responses are wrapped in a standard object:
   ```json
   {
     "success": true,
     "data": { ... } // Or an array []
   }
   ```
3. **Standard Error Format:** All errors are wrapped in a standard object:
   ```json
   {
     "success": false,
     "error": {
       "statusCode": 404,
       "message": "Resource not found"
     }
   }
   ```
4. **Pagination:** Endpoints returning lists generally accept `page` and `limit` query parameters.