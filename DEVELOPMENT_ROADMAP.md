# 🚀 Atlas ERP - Development Roadmap

## Phase 1: Core Authentication & Authorization (Week 1-2)

### 1.1 Backend - Auth Module Enhancement
**Location:** `apps/api/src/auth/`

**Tasks:**
- [ ] Update auth to use our schema (AuthUser, WorkspaceMember)
- [ ] Implement workspace selection after login
- [ ] Add role-based JWT claims
- [ ] Create workspace guard (check user belongs to workspace)
- [ ] Create permission guard (check user has permission)
- [ ] Add refresh token rotation
- [ ] Implement MFA (optional)

**Files to Create/Modify:**
```
apps/api/src/auth/
├── guards/
│   ├── workspace.guard.ts       # Check workspace membership
│   └── permission.guard.ts      # Check permissions
├── decorators/
│   ├── current-user.decorator.ts
│   ├── workspace.decorator.ts
│   └── require-permission.decorator.ts
└── dto/
    ├── login.dto.ts
    ├── register.dto.ts
    └── select-workspace.dto.ts
```

**API Endpoints:**
```
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout
GET    /api/v1/auth/me
GET    /api/v1/auth/workspaces        # List user's workspaces
POST   /api/v1/auth/select-workspace  # Select active workspace
```

### 1.2 Frontend - Auth Pages
**Location:** `apps/web/src/app/(auth)/`

**Tasks:**
- [ ] Create login page
- [ ] Create register page
- [ ] Create workspace selection page
- [ ] Implement JWT storage (cookies/localStorage)
- [ ] Create auth context/provider (Jotai)
- [ ] Add protected route wrapper
- [ ] Create role-based routing

**Pages to Create:**
```
apps/web/src/app/
├── (auth)/
│   ├── login/
│   │   └── page.tsx
│   ├── register/
│   │   └── page.tsx
│   └── select-workspace/
│       └── page.tsx
└── (dashboard)/
    └── layout.tsx               # Protected layout
```

---

## Phase 2: CRM Module (Week 3-4)

### 2.1 Backend - CRM Module
**Location:** `apps/api/src/crm/`

**Tasks:**
- [ ] Create CRM module structure
- [ ] Implement Lead CRUD operations
- [ ] Implement Deal CRUD operations
- [ ] Implement Contact CRUD operations
- [ ] Implement Organization CRUD operations
- [ ] Add permission checks to all endpoints
- [ ] Add filtering, sorting, pagination
- [ ] Add search functionality

**Commands to Run:**
```bash
cd apps/api
nest g module crm
nest g module crm/leads
nest g module crm/deals
nest g module crm/contacts
nest g module crm/organizations

nest g service crm/leads
nest g service crm/deals
nest g service crm/contacts
nest g service crm/organizations

nest g controller crm/leads
nest g controller crm/deals
nest g controller crm/contacts
nest g controller crm/organizations
```

**API Endpoints:**
```
# Leads
GET    /api/v1/crm/leads
POST   /api/v1/crm/leads
GET    /api/v1/crm/leads/:id
PUT    /api/v1/crm/leads/:id
DELETE /api/v1/crm/leads/:id
POST   /api/v1/crm/leads/:id/convert    # Convert to deal

# Deals
GET    /api/v1/crm/deals
POST   /api/v1/crm/deals
GET    /api/v1/crm/deals/:id
PUT    /api/v1/crm/deals/:id
DELETE /api/v1/crm/deals/:id

# Contacts
GET    /api/v1/crm/contacts
POST   /api/v1/crm/contacts
GET    /api/v1/crm/contacts/:id
PUT    /api/v1/crm/contacts/:id
DELETE /api/v1/crm/contacts/:id

# Organizations
GET    /api/v1/crm/organizations
POST   /api/v1/crm/organizations
GET    /api/v1/crm/organizations/:id
PUT    /api/v1/crm/organizations/:id
DELETE /api/v1/crm/organizations/:id
```

### 2.2 Frontend - CRM Pages
**Location:** `apps/web/src/app/(dashboard)/crm/`

**Tasks:**
- [ ] Create CRM dashboard
- [ ] Create leads list page
- [ ] Create lead detail page
- [ ] Create lead create/edit form
- [ ] Create deals kanban board
- [ ] Create deal detail page
- [ ] Create contacts list page
- [ ] Create organizations list page
- [ ] Add filters and search
- [ ] Add export functionality

**Pages to Create:**
```
apps/web/src/app/(dashboard)/crm/
├── page.tsx                     # CRM Dashboard
├── leads/
│   ├── page.tsx                # Leads list
│   ├── [id]/
│   │   └── page.tsx            # Lead detail
│   └── new/
│       └── page.tsx            # Create lead
├── deals/
│   ├── page.tsx                # Deals kanban
│   └── [id]/
│       └── page.tsx            # Deal detail
├── contacts/
│   ├── page.tsx                # Contacts list
│   └── [id]/
│       └── page.tsx            # Contact detail
└── organizations/
    ├── page.tsx                # Organizations list
    └── [id]/
        └── page.tsx            # Organization detail
```

---

## Phase 3: HR Module (Week 5-6)

### 3.1 Backend - HR Module
**Location:** `apps/api/src/hr/`

**Tasks:**
- [ ] Create HR module structure
- [ ] Implement Employee CRUD
- [ ] Implement Department CRUD
- [ ] Implement Attendance tracking
- [ ] Implement Leave management
- [ ] Add permission checks
- [ ] Add employee hierarchy queries

**API Endpoints:**
```
# Employees
GET    /api/v1/hr/employees
POST   /api/v1/hr/employees
GET    /api/v1/hr/employees/:id
PUT    /api/v1/hr/employees/:id
DELETE /api/v1/hr/employees/:id
GET    /api/v1/hr/employees/:id/subordinates

# Departments
GET    /api/v1/hr/departments
POST   /api/v1/hr/departments
GET    /api/v1/hr/departments/:id
PUT    /api/v1/hr/departments/:id
DELETE /api/v1/hr/departments/:id

# Attendance
GET    /api/v1/hr/attendance
POST   /api/v1/hr/attendance
GET    /api/v1/hr/attendance/:id
PUT    /api/v1/hr/attendance/:id

# Leave
GET    /api/v1/hr/leave-applications
POST   /api/v1/hr/leave-applications
GET    /api/v1/hr/leave-applications/:id
PUT    /api/v1/hr/leave-applications/:id/approve
PUT    /api/v1/hr/leave-applications/:id/reject
```

### 3.2 Frontend - HR Pages
**Location:** `apps/web/src/app/(dashboard)/hr/`

**Tasks:**
- [ ] Create HR dashboard
- [ ] Create employees list
- [ ] Create employee profile page
- [ ] Create attendance calendar
- [ ] Create leave application form
- [ ] Create leave approval page
- [ ] Add org chart visualization

---

## Phase 4: Payroll Module (Week 7-8)

### 4.1 Backend - Payroll Module
**Location:** `apps/api/src/payroll/`

**Tasks:**
- [ ] Create Payroll module
- [ ] Implement payroll run creation
- [ ] Calculate salaries with deductions/earnings
- [ ] Generate payslips
- [ ] Add approval workflow
- [ ] Export payroll reports

**API Endpoints:**
```
# Payroll Runs
GET    /api/v1/payroll/runs
POST   /api/v1/payroll/runs
GET    /api/v1/payroll/runs/:id
PUT    /api/v1/payroll/runs/:id/process
PUT    /api/v1/payroll/runs/:id/approve

# Payroll Entries
GET    /api/v1/payroll/entries
GET    /api/v1/payroll/entries/:id
GET    /api/v1/payroll/entries/:id/payslip
```

### 4.2 Frontend - Payroll Pages
**Location:** `apps/web/src/app/(dashboard)/payroll/`

**Tasks:**
- [ ] Create payroll dashboard
- [ ] Create payroll run list
- [ ] Create payroll processing page
- [ ] Create payslip viewer
- [ ] Add payroll reports

---

## Phase 5: Finance Module (Week 9-10)

### 5.1 Backend - Finance Module
**Location:** `apps/api/src/finance/`

**Tasks:**
- [ ] Create Finance module
- [ ] Implement Chart of Accounts
- [ ] Implement Journal Entries
- [ ] Implement Invoices
- [ ] Implement Payments
- [ ] Add financial reports

**API Endpoints:**
```
# Accounts
GET    /api/v1/finance/accounts
POST   /api/v1/finance/accounts
GET    /api/v1/finance/accounts/:id
PUT    /api/v1/finance/accounts/:id

# Invoices
GET    /api/v1/finance/invoices
POST   /api/v1/finance/invoices
GET    /api/v1/finance/invoices/:id
PUT    /api/v1/finance/invoices/:id
DELETE /api/v1/finance/invoices/:id

# Payments
GET    /api/v1/finance/payments
POST   /api/v1/finance/payments
GET    /api/v1/finance/payments/:id

# Reports
GET    /api/v1/finance/reports/balance-sheet
GET    /api/v1/finance/reports/profit-loss
GET    /api/v1/finance/reports/cash-flow
```

### 5.2 Frontend - Finance Pages
**Location:** `apps/web/src/app/(dashboard)/finance/`

**Tasks:**
- [ ] Create finance dashboard
- [ ] Create invoices list
- [ ] Create invoice form
- [ ] Create payments list
- [ ] Create financial reports
- [ ] Add charts and visualizations

---

## Phase 6: Supply Chain Module (Week 11-12)

### 6.1 Backend - SCM Module
**Location:** `apps/api/src/scm/`

**Tasks:**
- [ ] Create SCM module
- [ ] Implement Vendors
- [ ] Implement Purchase Orders
- [ ] Implement Inventory
- [ ] Implement Warehouses
- [ ] Add stock tracking

### 6.2 Frontend - SCM Pages
**Location:** `apps/web/src/app/(dashboard)/scm/`

**Tasks:**
- [ ] Create SCM dashboard
- [ ] Create vendors list
- [ ] Create purchase orders
- [ ] Create inventory management
- [ ] Add stock reports

---

## Phase 7: Project Management Module (Week 13-14)

### 7.1 Backend - PM Module
**Location:** `apps/api/src/projects/`

**Tasks:**
- [ ] Create Projects module
- [ ] Implement Projects CRUD
- [ ] Implement Tasks with dependencies
- [ ] Implement Milestones
- [ ] Add time tracking
- [ ] Add Gantt chart data

### 7.2 Frontend - PM Pages
**Location:** `apps/web/src/app/(dashboard)/projects/`

**Tasks:**
- [ ] Create projects dashboard
- [ ] Create project detail page
- [ ] Create task board (Kanban)
- [ ] Create Gantt chart
- [ ] Add time tracking UI

---

## Phase 8: GraphQL Layer (Week 15-16)

### 8.1 Backend - GraphQL Setup
**Location:** `apps/api/src/graphql/`

**Tasks:**
- [ ] Install Apollo Server
- [ ] Create GraphQL schema
- [ ] Implement resolvers for CRM
- [ ] Add DataLoader for optimization
- [ ] Add GraphQL subscriptions (real-time)

### 8.2 Frontend - GraphQL Client
**Location:** `apps/web/`

**Tasks:**
- [ ] Install Apollo Client
- [ ] Set up GraphQL queries
- [ ] Add optimistic updates
- [ ] Add real-time subscriptions

---

## Phase 9: Advanced Features (Week 17-20)

### 9.1 Notifications System
- [ ] Real-time notifications (WebSocket)
- [ ] Email notifications
- [ ] In-app notification center
- [ ] Notification preferences

### 9.2 Activity Logging
- [ ] Audit trail for all changes
- [ ] Activity timeline
- [ ] Export audit logs

### 9.3 Reports & Analytics
- [ ] Dashboard widgets
- [ ] Custom report builder
- [ ] Data export (CSV, Excel, PDF)
- [ ] Charts and visualizations

### 9.4 Settings & Configuration
- [ ] Workspace settings
- [ ] User preferences
- [ ] Role management UI
- [ ] Permission management UI

---

## Phase 10: Testing & Deployment (Week 21-24)

### 10.1 Testing
- [ ] Unit tests for services
- [ ] Integration tests for APIs
- [ ] E2E tests for critical flows
- [ ] Performance testing

### 10.2 Deployment
- [ ] Docker containerization
- [ ] CI/CD pipeline
- [ ] Production environment setup
- [ ] Monitoring and logging

---

## 📊 Priority Order

### Must Have (MVP)
1. ✅ Authentication & Authorization
2. ✅ CRM Module (Leads, Deals, Contacts)
3. ✅ Basic HR (Employees, Departments)
4. ✅ Basic Dashboard

### Should Have
5. Payroll Module
6. Finance Module (Invoices, Payments)
7. Notifications
8. Activity Logging

### Nice to Have
9. Supply Chain Module
10. Project Management
11. GraphQL Layer
12. Advanced Analytics

---

## 🎯 Immediate Next Steps (This Week)

### Step 1: Clean Up API Code
Remove the job-related code from starter template:
```bash
cd apps/api
Remove-Item -Recurse -Force src/job
```

### Step 2: Create CRM Module
```bash
cd apps/api
nest g module crm
nest g module crm/leads
nest g service crm/leads
nest g controller crm/leads
```

### Step 3: Implement First Endpoint
Create `GET /api/v1/crm/leads` endpoint that:
- Checks workspace membership
- Checks read permission
- Returns paginated leads
- Filters by scope (own/department/all)

### Step 4: Create Login Page
Build the frontend login page:
- Email/password form
- Call auth API
- Store JWT token
- Redirect to dashboard

---

## 📝 Development Guidelines

### Code Standards
- Use TypeScript strict mode
- Follow NestJS best practices
- Use Prisma for all database queries
- Add JSDoc comments for public APIs
- Write tests for business logic

### Git Workflow
- Create feature branches
- Write descriptive commit messages
- Create PRs for review
- Squash commits before merging

### API Standards
- RESTful endpoints
- Consistent error responses
- Pagination for lists
- Filtering and sorting
- API versioning (/api/v1/)

### Frontend Standards
- Component-based architecture
- Reusable UI components
- Responsive design
- Accessibility (WCAG 2.1)
- Loading states and error handling

---

## 🤝 Need Help?

For each phase, I can help you:
1. Generate boilerplate code
2. Implement specific features
3. Debug issues
4. Review code
5. Optimize performance

**Ready to start? Let me know which phase you want to begin with!** 🚀
