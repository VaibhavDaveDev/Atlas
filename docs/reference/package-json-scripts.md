# Package.json Scripts

The root `package.json` contains several scripts to manage the Turborepo workspace.

| Script | Command | Description |
|--------|---------|-------------|
| `build` | `turbo run build` | Builds all packages and apps in the monorepo in topological order. |
| `dev` | `turbo run dev --parallel` | Starts both the Next.js frontend and NestJS backend in watch mode. |
| `lint` | `turbo run lint` | Runs ESLint across all projects. |
| `test` | `turbo run test` | Runs unit tests across all projects. |
| `test:e2e` | `turbo run test:e2e` | Runs End-to-End tests. |
| `clean` | `turbo run clean && rm -rf node_modules` | Removes build artifacts and `node_modules` for a fresh start. |
| `db:generate` | `pnpm --filter database prisma generate` | Regenerates the Prisma Client. |
| `db:push` | `pnpm --filter database prisma db push` | Pushes the schema state to the database directly (development). |
| `db:migrate` | `pnpm --filter database prisma migrate dev` | Creates and applies a SQL migration file. |
| `db:studio` | `pnpm --filter database prisma studio` | Opens Prisma Studio UI to view database records. |
| `db:seed` | `pnpm --filter database prisma db seed` | Executes the Prisma seed script. |