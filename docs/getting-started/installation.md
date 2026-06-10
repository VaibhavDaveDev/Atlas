# Installation

Follow these steps to install and set up Atlas ERP on your local machine.

## 1. Clone the Repository

Clone the repository to your local machine and navigate into the project directory:

```bash
git clone https://github.com/VaibhavDaveDev/Atlas.git
cd Atlas
```

## 2. Install Dependencies

Atlas ERP uses [Turborepo](https://turbo.build/) and `pnpm` workspaces. Install all dependencies from the root of the project:

```bash
pnpm install
```

## 3. Set Up Environment Variables

You need to configure the environment variables for both the backend and frontend applications.

```bash
# Copy the example environment files
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

Open both `.env` files and fill in the required values. See the [Environment Variables](environment-variables.md) guide for details on each variable.

## 4. Start Infrastructure (Optional but Recommended)

If you have Docker installed, you can start PostgreSQL and Redis using the provided `docker-compose.yml` (if available) or ensure your local PostgreSQL and Redis instances are running.

```bash
# Example if a docker-compose.yml exists
docker-compose up -d
```

## 5. Database Setup & Migrations

Atlas uses Prisma as its ORM. Run the following command from the root to push the database schema to your database. This will create all the necessary tables.

```bash
pnpm db:push
```

Alternatively, if you are setting up for the first time, you can also run:

```bash
pnpm db:migrate
```

## 6. Seed the Database

Populate your database with essential default data (like default roles, admin user, etc.):

```bash
pnpm db:seed
```

## 7. Start the Development Servers

You can start both the frontend and backend servers concurrently using Turborepo from the root directory:

```bash
pnpm dev
```

Alternatively, you can start them individually:

**Terminal 1 (Backend):**
```bash
cd apps/api
pnpm run start:dev
```

**Terminal 2 (Frontend):**
```bash
cd apps/web
pnpm run dev
```

## Next Steps

Your application should now be running!
- **Frontend:** [http://localhost:3000](http://localhost:3000)
- **Backend API:** [http://localhost:3001](http://localhost:3001)

You can proceed to [Running Locally](running-locally.md) for more details on managing the development environment.