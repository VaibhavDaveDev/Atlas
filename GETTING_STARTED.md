# Getting Started with Atlas ERP

## Prerequisites Installation

Logo and related assets can be found in Atlas\apps\web\src\app\favicon 
### 1. Install Node.js (if not already installed)
Download and install Node.js 222 LTS from: https://nodejs.org/

Verify installation:
```bash
node --version  # Should show v22.x.x LTS
npm --version   # Should show v10.x.x or higher
```
### Installing NVM (Node Version Manager)

- **Windows**: Download from [nvm-windows releases](https://github.com/coreybutler/nvm-windows/releases).  
- **macOS/Linux**: Follow the install instructions at [nvm-sh/nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

### Use the Atlas‑required Node version

```bash
nvm install 22
nvm use 22
```

This lets you easily switch to the specific Node version required for the Atlas project.

### 2. Install pnpm
pnpm is our package manager (faster and more efficient than npm).

```bash
npm install -g pnpm
```

Verify installation:
```bash
pnpm --version  # Should show v9.x.x or higher
```

### 3. Install PostgreSQL 17
Download from: https://www.postgresql.org/download/windows/

During installation:
- Set a password for the postgres user (remember this!)
- Default port: 5432
- Install pgAdmin (GUI tool)

Verify installation:
```bash
psql --version  # Should show PostgreSQL 17.x 
```
### If `psql` is not found

If your system cannot detect `psql`, you need to add PostgreSQL’s `bin` directory to your environment `PATH`:

- **Windows**:  
  - Find the PostgreSQL `bin` folder (usually `C:\Program Files\PostgreSQL\<version>\bin`).  
  - Add that path to your system `PATH` environment variable, then restart your terminal.  

- **macOS/Linux**:  
  - Add the PostgreSQL `bin` directory to your shell profile (e.g., `~/.bashrc`, `~/.zshrc`):

    ```bash
    export PATH="/usr/pgsql-17/bin:$PATH"
    ```
  - Then reload your shell or open a new terminal and run `psql --version` again.

### 4. Install Redis
Download from: https://github.com/tporadowski/redis/releases (Windows) or use Docker.

**Using Docker (Recommended):**
```bash
# Pull and run Redis Alpine (lightweight)
docker run -d -p 6379:6379 --name atlas-redis redis:alpine

# Verify Redis is running
docker exec -it atlas-redis redis-cli ping  # Should return PONG
```

**Useful Docker Commands:**
```bash
# List running containers
docker ps

# Stop Redis
docker stop atlas-redis

# Start Redis
docker start atlas-redis

# Remove Redis container
docker rm -f atlas-redis

# Check logs
docker logs atlas-redis
```

### Logging & Monitoring (Loki & Grafana)

Atlas uses **Grafana Loki** for log aggregation and **Grafana** for visualization. This allows you to view application logs in a centralized dashboard.

#### 1. Start the Logging Stack
Run the following command from the root directory to start Loki and Grafana:

```bash
docker-compose -f docker-compose.logging.yml up -d
```

- **Loki:** Runs on port `3100` (Log aggregator)
- **Grafana:** Runs on port `3001` (Visualization Dashboard)

#### 2. Configure Environment
Update your `apps/api/.env` file to enable Loki integration:

```env
LOKI_ENABLED=true
LOKI_URL=http://localhost:3100
```

#### 3. Access Grafana
- URL: `http://localhost:3001`
- Default Credentials: `admin` / `admin`
- **Data Source:** Loki should be automatically configured (or add it manually pointing to `http://loki:3100`).

**Useful Docker Commands for Logging:**
```bash
# List running containers
docker ps

# Stop the logging stack
docker-compose -f docker-compose.logging.yml stop

# Start the logging stack
docker-compose -f docker-compose.logging.yml start

# Remove logging containers and volumes
docker-compose -f docker-compose.logging.yml down -v

# Check logs for Loki/Grafana
docker-compose -f docker-compose.logging.yml logs -f
```

### Gravatar Integration

Atlas ERP uses Gravatar for user profile pictures.

**Setup Instructions:**
1. Visit the [Gravatar Developer Docs](https://docs.gravatar.com/rest-api/).
2. Create an account and get your API Key and Client credentials.
3. Update your `.env` files with the following:

```env
# Gravatar Integration
GRAVATAR_API_KEY=your-api-key
GRAVATAR_CLIENT_ID=your-client-id
GRAVATAR_CLIENT_SECRET=your-client-secret
NEXT_PUBLIC_GRAVATAR_CLIENT_ID=your-client-id
```

For detailed API usage, refer to the [Gravatar REST API Documentation](https://docs.gravatar.com/rest-api/).

---

## Project Setup

### Step 1: Navigate to Project Directory

**IMPORTANT:** All commands must be run from the ROOT project directory!

```bash
# Navigate to the ROOT project folder
cd "\Atlas"

# Verify you're in the correct location
# You should see: package.json, pnpm-workspace.yaml, apps/, packages/
dir

# ❌ WRONG: Don't run commands from subdirectories like:
# \Atlas\packages\database
# \Atlas\apps\api

# ✅ CORRECT: Always run from:
# \Atlas
```

### Step 2: Install Dependencies

**MUST BE RUN FROM ROOT FOLDER:** `\Atlas`

```bash
# Make sure you're in the root folder
cd "\Atlas"

# Install all dependencies for the entire monorepo
pnpm install
```

This will install:
- Turbo (monorepo build system)
- Prisma (database ORM)
- All dependencies for apps/api
- All dependencies for apps/web
- All dependencies for all packages

**Expected output:**
```
Scope: all 8 workspace projects
Packages: +XXX
++++++++++++++++++++++++++++++++++++++++++++++++
Progress: resolved XXX, reused XXX, downloaded XX, added XXX, done
Done in Xs
```

**⚠️ If you see "node_modules missing" error, you MUST run `pnpm install` first!**

### Step 2: Set Up Environment Variables

#### 2.1 Root Environment
```bash
cp .env.example .env
```

Edit `.env` and update:
```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/atlas_erp?schema=public"
```

#### 2.2 API Environment
```bash
cp apps/api/.env.example apps/api/.env
```

Edit `apps/api/.env` and update the following:

**Required Configuration:**
```env
# Database
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/atlas_erp?schema=public"

# JWT Secrets (Generate strong random secrets - see below)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-min-32-chars
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production-min-32-chars
```

**Important:** Use strong, random secrets for JWT in production!

### Generating Strong JWT Secrets

Use one of these methods:

### Method 1: Node.js
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Method 2: OpenSSL
```bash
openssl rand -hex 32
```
**Email Configuration (Mailtrap - Development/Sandbox Mode):**

1. Sign up for free at: https://mailtrap.io
2. Go to "Email Testing" → "Inboxes" → Select your inbox
3. Click "Show Credentials" under SMTP Settings
4. Copy the credentials to your `.env`:

```env
# Email Configuration (Mailtrap - Development/Sandbox Mode)
EMAIL_HOST=sandbox.smtp.mailtrap.io
EMAIL_PORT=2525
EMAIL_USER=your-mailtrap-username-from-mailtrap
EMAIL_PASS=your-mailtrap-password-from-mailtrap
EMAIL_FROM=noreply@atlas-erp.com
```

**Note:** In development, Mailtrap captures all emails in a sandbox inbox. No emails are actually sent to real addresses. This is perfect for testing!

**Google OAuth Configuration (Optional):**

1. Go to: https://console.cloud.google.com/apis/credentials
2. Create a new project or select existing
3. Click "Create Credentials" → "OAuth 2.0 Client ID"
4. Configure OAuth consent screen if prompted
5. Application type: "Web application"
6. Add these URLs:

   **Authorized JavaScript origins:**
   ```
   http://localhost:3001
   http://localhost:3000
   ```

   **Authorized redirect URIs:**
   ```
   http://localhost:3001/api/v1/auth/google/callback
   ```

7. Copy the credentials to your `.env`:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3001/api/v1/auth/google/callback
```

### **Observability (Logging with Grafana Loki - Optional):**

Atlas ERP is configured to send logs to Grafana Loki. You can use a local Loki instance (via Docker) or Grafana Cloud for production environments.

**Using Grafana Cloud (Recommended for Production):**

1. **Sign up:** Create a free account at [Grafana Cloud](https://grafana.com/products/cloud/).
2. **Provision Loki:** In your Grafana Cloud Portal, find the **Loki** card and ensure it is provisioned.
3. **Get Credentials:** Click on **Details** on the Loki card. You will need:
   - **URL:** The endpoint for sending logs (e.g., `https://logs-prod-xxx.grafana.net`).
   - **User ID:** Your Loki User ID.
   - **Access Policy/Token:** Create an Access Policy with `logs:write` scope and generate a token.
4. **Configure API:** Add these to `apps/api/.env`:

```env
# Logging (Grafana Loki Cloud - Production)
LOKI_ENABLED=true
LOKI_URL="https://logs-prod-xxx.grafana.net"
LOKI_USER="your-loki-user-id"
LOKI_PASSWORD="your-grafana-cloud-access-token"
```

**Viewing Logs in Grafana Cloud:**
1. Navigate to your Grafana Cloud instance.
2. Go to **Explore** (compass icon).
3. Select the **grafanacloud-yourname-logs** (Loki) data source.
4. Use a query like `{app="atlas-api"}` to see your logs.

For more details, refer to the [Grafana Loki Configuration Guide](https://grafana.com/docs/grafana/latest/datasources/loki/configure-loki-data-source/).

---

**Note:** If `LOKI_ENABLED` is true, application logs will be streamed to Grafana Cloud. You can view them in Grafana by going to "Explore" and selecting the Loki datasource.

#### 2.3 Web Environment
```bash
cp apps/web/.env.example apps/web/.env
```

No changes needed for local development.

### Step 3: Create Database

Open pgAdmin or use command line:

```bash
# Using psql
psql -U postgres
```

Then in psql:
```sql
CREATE DATABASE atlas_erp;
\q
```

Or using createdb:
```bash
createdb -U postgres atlas_erp
```

### Step 4: Generate Prisma Client

**MUST BE RUN FROM ROOT FOLDER:** `\Atlas`

This generates TypeScript types from your Prisma schema:

```bash
# Make sure you're in the root folder
cd "\Atlas"

# Generate Prisma client
pnpm db:generate
```

**Expected output:** 
```
@atlas/database:db:generate: ✔ Generated Prisma Client to ./packages/database/node_modules/.prisma/client
```

### Step 5: Push Schema to Database

**MUST BE RUN FROM ROOT FOLDER:** `\Atlas`

For development, use `db:push` (faster, no migration files):

```bash
# Make sure you're in the root folder
cd "\Atlas"

# Push schema to database
pnpm db:push
```

**Expected output:**
```
@atlas/database:db:push: 🚀  Your database is now in sync with your Prisma schema.
```

**OR** for production, create migrations:

```bash
pnpm db:migrate
```

This creates migration files in `packages/database/prisma/migrations/`.

### Step 6: (Optional) Seed Database

**MUST BE RUN FROM ROOT FOLDER:** `\Atlas`

Create sample data for testing:

```bash
# Make sure you're in the root folder
cd "\Atlas"

# Seed database
pnpm db:seed
```

**Expected output:**
```
@atlas/database:db:seed: 🌱 Starting database seed...
@atlas/database:db:seed: 👤 Creating Super Admin...
@atlas/database:db:seed: ✅ Database seeded successfully!
```
## 📝 Sample Credentials (After Seeding)

```
Owner/Admin:
  Email: admin@atlas-erp.com
  Password: Password123!

HR Manager:
  Email: hr@atlas.com
  Password: Password123!

Employee:
  Email: employee@atlas.com
  Password: Password123!
```

### Step 7: Start Development Servers

**MUST BE RUN FROM ROOT FOLDER:** `\Atlas`

Start both API and Web apps:

```bash
# Make sure you're in the root folder
cd "\Atlas"

# Start development
pnpm dev
```

This will start:
- **API:** http://localhost:3001
- **Web:** http://localhost:3000
- **API Docs:** http://localhost:3001/api/docs

**Expected output:**
```
@atlas/api:dev: [Nest] LOG [NestApplication] Nest application successfully started
@atlas/web:dev: ▲ Next.js 15.x.x
@atlas/web:dev: - Local: http://localhost:3000
```

---

## Verify Everything Works

### 1. Check API Health
Open browser: http://localhost:3001/health

Should see:
```json
{
  "status": "ok",
  "info": { "database": { "status": "up" } }
}
```

### 2. Check API Documentation
Open browser: http://localhost:3001/api/docs

Should see Swagger UI with all API endpoints.

### 3. Check Web App
Open browser: http://localhost:3000

Should see the Atlas ERP landing page.

### 4. Check Prisma Studio (Database GUI)
```bash
pnpm db:studio
```

Opens http://localhost:5555 - you can browse and edit database records.

---

## Common Issues & Solutions

### Issue 1: "pnpm: command not found"
**Solution:** Install pnpm globally:
```bash
npm install -g pnpm
```

### Issue 2: "Database connection failed"
**Solution:** 
- Check PostgreSQL is running
- Verify DATABASE_URL in `.env` files
- Test connection: `psql -U postgres -d atlas_erp`

### Issue 3: "Port 3000 already in use"
**Solution:** 
- Kill the process using the port
- Or change port: `PORT=3001 pnpm dev`

### Issue 4: "Prisma Client not found"
**Solution:** 
```bash
pnpm db:generate
```

### Issue 5: "Module not found: @atlas/database"
**Solution:** 
```bash
pnpm install
pnpm db:generate
```

### Issue 6: Redis connection error
**Solution:** 
- Redis is optional for initial setup
- Comment out Redis-related code in `apps/api/src/app.module.ts`
- Or install Redis

---

## Development Workflow

### Running Individual Apps

```bash
# API only
pnpm --filter @atlas/api dev

# Web only
pnpm --filter @atlas/web dev
```

### Making Schema Changes

1. Edit `packages/database/prisma/schema.prisma`
2. Generate client: `pnpm db:generate`
3. Push to DB: `pnpm db:push` (dev) or `pnpm db:migrate` (prod)

### Running Tests

```bash
# All tests
pnpm test

# API tests only
pnpm --filter @atlas/api test

# Watch mode
pnpm --filter @atlas/api test:watch
```

### Building for Production

```bash
pnpm build
```

### Linting & Formatting

```bash
# Lint all code
pnpm lint

# Format all code
pnpm format
```

---

## Next Development Tasks

Now that the foundation is set up, here are the next steps:

### 1. Create Database Seed Script
Create sample data for testing:
- Sample workspace
- Test users with different roles
- Sample CRM data (leads, deals, contacts)

### 2. Implement Authentication Module
- Login/Register endpoints
- JWT token generation
- Refresh token rotation
- Password reset flow

### 3. Implement CRM Module
- Lead CRUD operations
- Deal pipeline management
- Contact management
- Organization management

### 4. Create Frontend Pages
- Login/Register pages
- Dashboard (role-based routing)
- CRM pages (leads, deals, contacts)
- Settings pages

### 5. Add GraphQL Layer
- Apollo Server setup
- GraphQL schema for CRM
- Resolvers and data loaders

### 6. Implement Permission Guards
- NestJS permission guards
- Frontend permission checks
- Role-based UI rendering

---

## Useful Commands Reference

```bash
# Development
pnpm dev                    # Start all apps
pnpm build                  # Build all apps
pnpm test                   # Run all tests
pnpm lint                   # Lint all code

# Database
pnpm db:generate            # Generate Prisma client
pnpm db:push                # Push schema (dev)
pnpm db:migrate             # Create migration (prod)
pnpm db:studio              # Open Prisma Studio
pnpm db:seed                # Seed database

# Individual apps
pnpm --filter @atlas/api dev
pnpm --filter @atlas/web dev

# Clean
pnpm clean                  # Remove build artifacts
```

---

## Project Structure Quick Reference

```
Atlas/
├── apps/
│   ├── api/                # NestJS Backend (Port 3001)
│   │   ├── src/
│   │   │   ├── auth/      # Authentication
│   │   │   ├── common/    # Guards, filters, pipes
│   │   │   ├── user/      # User management
│   │   │   └── main.ts    # Entry point
│   │   └── .env           # API environment variables
│   └── web/                # Next.js Frontend (Port 3000)
│       ├── src/app/       # App Router pages
│       └── .env           # Web environment variables
├── packages/
│   ├── database/          # Prisma schema & client
│   │   └── prisma/
│   │       └── schema.prisma
│   ├── ui/                # Shared React components
│   ├── types/             # TypeScript types
│   ├── utils/             # Utility functions
│   └── config/            # Shared configs
└── .env                   # Root environment variables
```

---

# Atlas ERP - Setup Checklist

Use this checklist to track your progress setting up the project.

## ✅ Prerequisites

- [ ] Node.js 20+ installed (`node --version`)
- [ ] pnpm installed (`npm install -g pnpm`)
- [ ] PostgreSQL 17 installed and running
- [ ] Redis installed (optional but recommended)
- [ ] Git installed (for version control)

## ✅ Project Setup

- [ ] Cloned/navigated to Atlas folder
- [ ] Ran `pnpm install` successfully
- [ ] Created `.env` file from `.env.example`
- [ ] Created `apps/api/.env` from `apps/api/.env.example`
- [ ] Created `apps/web/.env` from `apps/web/.env.example`
- [ ] Updated DATABASE_URL in `.env` files with your PostgreSQL credentials
- [ ] Updated JWT secrets in `apps/api/.env`

## ✅ Database Setup

- [ ] Created `atlas_erp` database in PostgreSQL
- [ ] Ran `pnpm db:generate` (generates Prisma client)
- [ ] Ran `pnpm db:push` (pushes schema to database)
- [ ] Ran `pnpm db:seed` (creates sample data)
- [ ] Verified database in Prisma Studio (`pnpm db:studio`)

## ✅ Development

- [ ] Ran `pnpm dev` (starts both API and Web)
- [ ] API running at http://localhost:3001
- [ ] Web running at http://localhost:3000
- [ ] API docs accessible at http://localhost:3001/api/docs
- [ ] Health check working at http://localhost:3001/health

## ✅ Verification

- [ ] Can access landing page at http://localhost:3000
- [ ] Can access API documentation at http://localhost:3001/api/docs
- [ ] Database has sample data (check Prisma Studio)
- [ ] No errors in terminal logs
- [ ] TypeScript compilation working (no red squiggles)

## 🚀 Next Steps

Once all checkboxes are complete, you're ready to start development!

### Immediate Next Tasks:

1. **Test Authentication**
   - [ ] Test login endpoint with sample credentials
   - [ ] Verify JWT token generation
   - [ ] Test refresh token flow

2. **Implement First CRM Feature**
   - [ ] Create Lead list endpoint
   - [ ] Create Lead detail endpoint
   - [ ] Create Lead create endpoint
   - [ ] Add permission checks

3. **Build Frontend Pages**
   - [ ] Create login page
   - [ ] Create dashboard layout
   - [ ] Create leads list page
   - [ ] Add role-based routing

4. **Add GraphQL Layer**
   - [ ] Set up Apollo Server
   - [ ] Create GraphQL schema for CRM
   - [ ] Implement resolvers

## Getting Help

- **Documentation:** Check `README.md`, `SETUP.md`, `PERMISSIONS.md`
- **API Docs:** http://localhost:3001/api/docs (when running)
- **Database GUI:** `pnpm db:studio`
- **Logs:** Check terminal output for errors

---

## Ready to Code! 🚀

Once you complete all steps above, you're ready to start building features!

Start with:
1. Creating a seed script
2. Testing the API endpoints
3. Building the login page
4. Implementing the first CRM feature

Happy coding!
