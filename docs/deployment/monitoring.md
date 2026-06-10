# Production Monitoring

Monitoring your Atlas ERP instance is critical for detecting issues before users notice them.

## Built-in Tools

### Grafana + Loki
If you have configured the `LOKI_ENABLED` environment variable, the NestJS backend uses Winston to stream logs directly to your Grafana Loki instance.

1. Set up a free Grafana Cloud account.
2. Get your Loki URL, User ID, and API Key.
3. Add them to your backend environment variables.
4. In Grafana, set up a dashboard to alert you on `level="error"` or specific exception types.

## Third-Party APM (Application Performance Monitoring)

For deep insights into the Node.js event loop, database query times, and memory usage, consider integrating an APM tool.

### Recommended Providers
- **Datadog:** Comprehensive monitoring, tracing, and logging.
- **New Relic:** Enterprise-grade APM.
- **Sentry:** Good for error tracking and performance monitoring.

### Error Tracking (Sentry)

To track unhandled exceptions in the frontend and backend, Sentry is highly recommended.

1. Install Sentry SDKs:
   `pnpm add @sentry/nextjs --filter web`
   `pnpm add @sentry/node @sentry/profiling-node --filter api`
2. Initialize Sentry in `apps/api/src/main.ts` and `apps/web/sentry.client.config.ts`.
3. Sentry will capture exact stack traces and variable states when a user encounters a 500 error.