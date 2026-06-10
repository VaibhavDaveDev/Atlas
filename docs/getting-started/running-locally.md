# Running Locally

Once you have installed the dependencies and configured your environment variables, you can run Atlas ERP locally.

## Starting the Application

The easiest way to start both the frontend and backend servers is to use the `dev` script in the root `package.json`. This uses Turborepo to run the tasks in parallel.

```bash
pnpm dev
```

This command will:
1. Start the NestJS backend API on `http://localhost:3001`
2. Start the Next.js frontend web app on `http://localhost:3000`

### Starting Services Individually

If you prefer to run services in separate terminals, you can do so:

**Backend (API):**
```bash
cd apps/api
pnpm run start:dev
```

**Frontend (Web):**
```bash
cd apps/web
pnpm run dev
```

## Available Scripts

Atlas ERP provides several scripts in the root `package.json` to help you manage your local development environment.

| Command | Description |
|---------|-------------|
| `pnpm dev` | Starts all applications in development mode |
| `pnpm build` | Builds all applications for production |
| `pnpm start` | Starts the production build |
| `pnpm lint` | Runs ESLint across the monorepo |
| `pnpm test` | Runs tests across the monorepo |
| `pnpm db:studio` | Opens Prisma Studio to view and edit database data |
| `pnpm db:push` | Pushes the Prisma schema state to the database |
| `pnpm db:seed` | Seeds the database with default data |

## Managing the Database

Atlas ERP uses Prisma. The Prisma schema is located at `packages/database/prisma/schema.prisma`.

### Viewing Data

To view the data in your local database using Prisma Studio:

```bash
pnpm db:studio
```
Prisma Studio will open in your browser, typically at `http://localhost:5555`.

### Making Schema Changes

If you modify the `schema.prisma` file, you need to apply those changes to your local database:

```bash
cd packages/database
pnpm prisma db push
```
Then, regenerate the Prisma Client:
```bash
pnpm prisma generate
```

## Stopping the Application

To stop the servers started by `pnpm dev`, simply press `Ctrl + C` in the terminal where it is running.

If you used Docker Compose to start PostgreSQL and Redis, you can stop them with:

```bash
docker-compose down
```