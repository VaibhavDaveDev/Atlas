# Database Migrations

Atlas ERP uses Prisma Migrate to track and apply changes to the database schema.

## Making Schema Changes

1. Open `packages/database/prisma/schema.prisma`.
2. Make your desired changes (add models, add fields, create relations).
3. Run the migration command from the root of the project:

```bash
cd packages/database
pnpm prisma migrate dev --name <descriptive-name-of-change>
```

**Example:**
```bash
pnpm prisma migrate dev --name add_task_priority_field
```

### What `migrate dev` does:
- Compares the schema to your local database.
- Generates a SQL migration file in `prisma/migrations/`.
- Applies the SQL to your local database.
- Automatically runs `prisma generate` to update the TypeScript client.

## Applying Migrations in Production

When deploying to production, you should **never** run `migrate dev`. Instead, run:

```bash
pnpm prisma migrate deploy
```

This command strictly executes the SQL files in the `prisma/migrations` directory that haven't been applied yet. It does not look at the `schema.prisma` file to generate new SQL.

*(Our deployment pipelines, e.g., on Render or Vercel, run this command automatically before starting the application).*

## Resetting the Database (Local Only)

If your local database gets into a bad state, or you switch branches and migrations conflict, you can reset it.

!!! danger "Warning"
    This will drop the database, recreate it, run all migrations from scratch, and execute the seed script. **Never run this in production.**

```bash
pnpm prisma migrate reset
```

## Prototyping Without Migrations

If you are just playing around locally and don't want to generate SQL migration files yet, you can use `db push`:

```bash
pnpm prisma db push
```

This forces the database to match your `schema.prisma` without tracking the history. **Use this sparingly**, as it makes collaboration with other developers harder if schema changes aren't tracked via migrations.