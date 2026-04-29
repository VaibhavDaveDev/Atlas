# Atlas ERP - Developer Documentation

## Auth Module

### Overview
The Auth module provides complete authentication and authorization functionality with workspace (multi-tenancy) support. It includes JWT-based authentication with refresh token rotation, email verification, rate limiting, and account lockout protection.

### Architecture

#### Authentication Flow
1. **Registration** → User creates account → Email verification sent
2. **Email Verification** → User verifies email with 6-digit code
3. **Login** → User logs in → Receives JWT tokens + workspace list
4. **Workspace Selection** → User selects workspace → Receives new JWT with workspace context
5. **Protected Routes** → JWT validated → Workspace membership checked → Permission verified

#### JWT Token Structure

**Access Token** (Short-lived: 1 hour)
```typescript
{
  userId: string;
  role: GlobalRole; // SUPERADMIN, ADMIN, USER
  tokenVersion: number; // For immediate revocation
  workspaceId?: string; // Set after workspace selection
  workspaceRole?: string; // OWNER, ADMIN, MANAGER, USER, VIEWER
  department?: string | null;
}
```

**Refresh Token** (Long-lived: 7 days)
```typescript
{
  userId: string;
  jti: string; // Unique token ID for revocation
}
```

### API Endpoints

#### 1. Register
**POST** `/api/v1/auth`

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass@123",
  "username": "johndoe"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Registration successful. Please check your email for verification code."
}
```

**Password Requirements:**
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special character

**Rate Limit:** 5 requests per 15 minutes

---

#### 2. Verify Email
**POST** `/api/v1/auth/verify-email`

**Request:**
```json
{
  "email": "user@example.com",
  "code": "A1B2C3"
}
```

**Response:**
```json
{
  "message": "Email verified successfully"
}
```

**Rate Limit:** 5 requests per 15 minutes

---

#### 3. Resend Verification Email
**POST** `/api/v1/auth/resend-verification-email`

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "message": "Verification email sent successfully"
}
```

**Rate Limit:** 3 requests per 15 minutes

---

#### 4. Login
**POST** `/api/v1/auth/login`

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass@123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "username": "johndoe",
      "role": "USER",
      "verified": true
    },
    "workspaces": [
      {
        "workspaceId": "uuid",
        "workspaceName": "Acme Corporation",
        "subdomain": "acme",
        "status": "ACTIVE",
        "role": "ADMIN",
        "department": "Sales"
      }
    ],
    "expiresIn": 3600
  }
}
```

**Rate Limit:** 5 requests per 15 minutes

**Account Lockout:** 5 failed attempts = 15 minutes lockout

---

#### 5. Get User Workspaces
**GET** `/api/v1/auth/workspaces`

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "workspaceId": "uuid",
      "workspaceName": "Acme Corporation",
      "subdomain": "acme",
      "status": "ACTIVE",
      "role": "ADMIN",
      "department": "Sales",
      "joinedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

#### 6. Select Workspace
**POST** `/api/v1/auth/select-workspace`

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Request:**
```json
{
  "workspaceId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Workspace selected successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "workspace": {
      "id": "uuid",
      "name": "Acme Corporation",
      "subdomain": "acme",
      "status": "ACTIVE",
      "role": "ADMIN",
      "department": "Sales"
    }
  }
}
```

**Note:** This returns a NEW access token with workspace context embedded.

---

#### 7. Refresh Token
**POST** `/api/v1/auth/refresh-token`

**Request:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600
  }
}
```

**Note:** Implements token rotation - old refresh token is invalidated, new one issued.

---

#### 8. Logout
**POST** `/api/v1/auth/logout`

**Request:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "userId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

#### 9. Logout All Devices
**POST** `/api/v1/auth/logout-all`

**Request:**
```json
{
  "userId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out from all devices successfully"
}
```

**Note:** Revokes ALL refresh tokens and increments tokenVersion to invalidate all access tokens.

---

#### 10. Get Current User
**GET** `/api/v1/auth/me`

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "uuid",
    "role": "USER",
    "tokenVersion": 0,
    "workspaceId": "uuid",
    "workspaceRole": "ADMIN",
    "department": "Sales"
  }
}
```

---

### Guards & Decorators

#### 1. AuthGuard
Validates JWT access token and checks tokenVersion.

**Usage:**
```typescript
@UseGuards(AuthGuard)
@Get('protected')
async protectedRoute() {
  // Only authenticated users can access
}
```

---

#### 2. WorkspaceGuard
Checks if user is a member of the workspace and workspace is active.

**Usage:**
```typescript
@UseGuards(AuthGuard, WorkspaceGuard)
@Get('workspace-data')
async getWorkspaceData() {
  // User must be authenticated AND workspace member
}
```

---

#### 3. PermissionGuard
Checks role-based and user-specific permissions.

**Usage:**
```typescript
@UseGuards(AuthGuard, WorkspaceGuard, PermissionGuard)
@RequirePermission('leads', 'create', 'all')
@Post('leads')
async createLead() {
  // User must have permission to create leads
}
```

**Permission Bypass:**
- SUPERADMIN (global role) bypasses all permission checks
- OWNER (workspace role) bypasses workspace permission checks

---

#### 4. @CurrentUser() Decorator
Extracts user from JWT payload.

**Usage:**
```typescript
@Get('profile')
async getProfile(@CurrentUser() user: IAccessTokenPayload) {
  return { userId: user.userId, role: user.role };
}
```

---

#### 5. @CurrentWorkspace() Decorator
Extracts workspace ID from JWT payload.

**Usage:**
```typescript
@Get('workspace-info')
async getWorkspaceInfo(@CurrentWorkspace() workspaceId: string) {
  return { workspaceId };
}
```

---

#### 6. @Public() Decorator
Marks route as public (no authentication required).

**Usage:**
```typescript
@Public()
@Get('public-data')
async getPublicData() {
  // Anyone can access
}
```

---

### Security Features

#### 1. Rate Limiting
- **Registration:** 5 requests per 15 minutes
- **Login:** 5 requests per 15 minutes per IP
- **Email Verification:** 5 requests per 15 minutes
- **Resend Verification:** 3 requests per 15 minutes

#### 2. Account Lockout
- **Max Failed Attempts:** 5
- **Lockout Duration:** 15 minutes
- **Auto-unlock:** After lockout duration expires

#### 3. Token Rotation
- Refresh tokens are rotated on every refresh
- Old refresh token is immediately invalidated
- Prevents token replay attacks

#### 4. Token Revocation
- **Immediate:** Increment tokenVersion to invalidate all access tokens
- **Selective:** Delete specific refresh token from Redis
- **Global:** Revoke all refresh tokens for a user

#### 5. Password Security
- Bcrypt hashing with 12 salt rounds
- Password strength validation
- Timing attack prevention (constant-time comparison)

#### 6. Session Management
- Max 5 devices per user
- Oldest sessions automatically removed
- Session tracking in Redis

---

### Database Models

#### AuthUser
```prisma
model AuthUser {
  id            String      @id @default(uuid())
  email         String      @unique
  password      String
  username      String?     @unique
  globalRole    GlobalRole  @default(USER)
  verified      Boolean     @default(false)
  status        UserStatus  @default(ACTIVE)
  tokenVersion  Int         @default(0)
  provider      String      @default("local")
  providerId    String?
  
  security      AuthSecurity?
  profile       UserProfile?
  workspaces    WorkspaceMember[]
}
```

#### WorkspaceMember
```prisma
model WorkspaceMember {
  id          String        @id @default(uuid())
  workspaceId String
  userId      String
  role        WorkspaceRole @default(USER)
  department  String?
  isActive    Boolean       @default(true)
  
  joinedAt    DateTime      @default(now())
  lastAccessAt DateTime?
}
```

#### LoginHistory
```prisma
model LoginHistory {
  id             String    @id @default(uuid())
  authId         String
  ipAddress      String
  userAgent      String
  success        Boolean
  failureReason  String?
  attemptNumber  Int       @default(1)
  
  createdAt      DateTime  @default(now())
}
```

#### EmailHistory
```prisma
model EmailHistory {
  id           String    @id @default(uuid())
  authId       String
  emailTo      String
  emailType    String
  subject      String
  emailStatus  String    @default("pending")
  
  createdAt    DateTime  @default(now())
}
```

---

### Environment Variables

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/atlas_erp"

# JWT Secrets
JWT_ACCESS_SECRET="your-super-secret-access-key-change-in-production"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-change-in-production"

# Redis
REDIS_HOST="localhost"
REDIS_PORT=6379
REDIS_PASSWORD=""
REDIS_CACHE_KEY_PREFIX="atlas"

# Email (for verification emails)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
```

---

### Testing with Swagger UI

1. Start the API server:
```bash
cd Atlas
pnpm dev
```

2. Open Swagger UI:
```
http://localhost:4000/api/docs
```

3. Test the flow:
   - Register a new user
   - Verify email with code
   - Login to get tokens
   - Use access token in "Authorize" button
   - Test protected endpoints

---
## 🔧 Email Service Architecture

### Nodemailer Configuration

Located in: `Atlas/apps/api/src/common/services/email.service.ts`

```typescript
this.transporter = nodemailer.createTransport({
  host: String(config.email_host),      // sandbox.smtp.mailtrap.io
  port: Number(config.email_port),      // 2525
  secure: config.email_port === 465,    // false for port 2525
  auth: {
    user: String(config.email_user),    // Your Mailtrap username
    pass: String(config.email_pass),    // Your Mailtrap password
  },
});
```

### Email Queue System

Emails are sent asynchronously using **BullMQ** queues:

1. User registers → Email job added to queue
2. Background worker processes the job
3. Email sent via Nodemailer
4. Result logged to database

**Benefits:**
- Non-blocking API responses
- Automatic retries on failure
- Email history tracking
- Better performance

## 📊 Email Monitoring

### Check Email History

```sql
-- Connect to database
psql -U postgres -d atlas_erp

-- View recent emails
SELECT * FROM email_history ORDER BY "createdAt" DESC LIMIT 10;
```

### Check Email Queue

```bash
# Connect to Redis
docker exec -it atlas-redis redis-cli

# List email jobs
KEYS bull:email:*

# Get job details
HGETALL bull:email:1
```
---
## 📝 OAuth API Endpoints

### 1. Initiate OAuth Flow

```
GET /api/v1/auth/google
```

**Optional Query Parameters:**
- `redirectUrl` - Where to redirect after successful login

**Response:**
```json
{
  "url": "https://accounts.google.com/o/oauth2/v2/auth?...",
  "state": "random-state-token",
  "message": "Redirect to the provided URL to authenticate with Google"
}
```

### 2. OAuth Callback (GET)

```
GET /api/v1/auth/google/callback?code=...&state=...
```

**Response:**
```json
{
  "success": true,
  "message": "Signed in successfully via Google",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "email": "user@gmail.com",
      "username": "user",
      "verified": true
    },
    "isNewUser": false
  }
}
```

### 3. OAuth Callback (POST)

```
POST /api/v1/auth/google/callback
```

**Request Body:**
```json
{
  "code": "authorization-code-from-google",
  "state": "state-token"
}
```

**Response:** Same as GET callback

**URLs for Google Cloud Console:**

1. **Create Project**: https://console.cloud.google.com/projectcreate
2. **OAuth Consent Screen**: https://console.cloud.google.com/apis/credentials/consent
3. **Credentials**: https://console.cloud.google.com/apis/credentials
---
### Next Steps

1. ✅ Auth Module (Backend) - COMPLETED
2. 🔄 Auth Module (Frontend) - IN PROGRESS
   - Login page
   - Workspace selection page
   - Protected route wrapper
   - Token refresh logic
3. ⏳ CRM Module (Backend)
4. ⏳ CRM Module (Frontend)
5. ⏳ HR Module
6. ⏳ Payroll Module
7. ⏳ Finance Module
8. ⏳ Supply Chain Module
9. ⏳ Projects Module

---

### Common Issues & Solutions

#### Issue: "Token has been revoked"
**Solution:** User's tokenVersion was incremented (password change, admin action, etc.). User must login again.

#### Issue: "Account is temporarily locked"
**Solution:** Too many failed login attempts. Wait 15 minutes or contact admin.

#### Issue: "You are not a member of this workspace"
**Solution:** User doesn't have access to the workspace. Contact workspace owner.

#### Issue: "Email already exists"
**Solution:** Email is already registered. Use "Forgot Password" or login.

---

### Sample Users (from seed data)

```
Super Admin:
Email: superadmin@atlas.com
Password: Admin@123

Workspace Owner (Acme Corporation):
Email: owner@acme.com
Password: Admin@123

Workspace Admin:
Email: admin@acme.com
Password: Admin@123

Sales Manager:
Email: sales.manager@acme.com
Password: Admin@123

Sales Rep:
Email: sales.rep@acme.com
Password: Admin@123
```

---

### API Response Format

**Success Response:**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

**Error Response:**
```json
{
  "statusCode": 400,
  "message": "Error message",
  "error": "Bad Request"
}
```

---

### Redis Keys Structure

```
atlas:token_version:{userId} → tokenVersion (number)
atlas:refresh_token:{userId}:{jti} → IStoredRefreshToken
atlas:user_sessions:{userId} → string[] (array of JTIs)
atlas:verification_token:{email} → verification code data
atlas:rate_limit:login:email:{email} → attempt count
atlas:rate_limit:login:ip:{ip} → attempt count
atlas:lock:login:{userId} → lock flag
```

---

### Permission System

See `PERMISSIONS.md` for detailed permission system documentation.

**Quick Reference:**
- **Global Level:** SUPERADMIN (bypasses all checks)
- **Workspace Level:** OWNER, ADMIN, MANAGER, USER, VIEWER
- **Resource Level:** Custom permissions (leads:create:all, deals:read:own, etc.)

---

### Development Workflow

1. **Make schema changes** in `packages/database/prisma/schema.prisma`
2. **Generate Prisma client:** `pnpm db:generate`
3. **Push to database:** `pnpm db:push`
4. **Update services** to use new models
5. **Test with Swagger UI**
6. **Update frontend** to consume new APIs

---

### Useful Commands

```bash
# Generate Prisma client
pnpm db:generate

# Push schema to database
pnpm db:push

# Run migrations (production)
pnpm db:migrate

# Seed database
pnpm db:seed

# Open Prisma Studio
pnpm db:studio

# Start development servers
pnpm dev

# Build all packages
pnpm build

# Run linter
pnpm lint

# Format code
pnpm format
```

---

## Contact

For questions or issues, please contact the development team.
