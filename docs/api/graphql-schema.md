# GraphQL Schema

While Atlas ERP is primarily a REST-based application, the architecture supports GraphQL via NestJS's `@nestjs/graphql` module.

> **Note:** Currently, the primary focus and officially supported integration method is the REST API.

If GraphQL is enabled in your specific fork or configuration of Atlas:

1. **Endpoint:** The GraphQL endpoint is typically exposed at `http://localhost:3001/graphql`.
2. **Playground:** In development mode, navigating to `/graphql` will open the Apollo GraphQL Playground, allowing you to explore the schema and run test queries.
3. **Authentication:** Ensure you pass the Better Auth session token in the `Authorization: Bearer <token>` header within the Playground settings.

## Generating the Schema

If you are using the Code-First approach in NestJS, the `schema.gql` file is automatically generated in the root of the `apps/api` directory whenever the server runs. This file contains the complete, strongly-typed definition of all available Queries, Mutations, and Types.