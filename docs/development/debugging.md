# Debugging

Tips for debugging Atlas ERP locally.

## VS Code Debugging

The repository includes a `.vscode/launch.json` file configured for both the backend and frontend.

1. Open the Run and Debug panel in VS Code.
2. Select **"Debug NestJS API"** or **"Debug Next.js Web"**.
3. Press Play. You can now set breakpoints directly in your `.ts` or `.tsx` files.

## Debugging Prisma

To see exactly what SQL queries Prisma is executing:

In `apps/api/src/common/services/prisma.service.ts`, add the `log` property to the constructor:

```typescript
constructor() {
  super({
    log: ['query', 'info', 'warn', 'error'],
  });
}
```
*Note: Do not commit this to production as it will flood your logs.*

## Inspecting Redis / BullMQ

If background jobs are failing, you can inspect the Redis queues using a GUI tool like **RedisInsight** or **Another Redis Desktop Manager**.

Connect to `localhost:6379`. BullMQ stores data with keys prefixed by `bull:`. Look for keys ending in `:failed` to see job error stack traces.