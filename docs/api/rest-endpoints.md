# REST Endpoints

This is a high-level overview of the REST API endpoints available in Atlas ERP.

> **Note:** For interactive and fully detailed documentation, start the backend server and navigate to `http://localhost:3001/api/docs` to view the Swagger/OpenAPI UI.

## Authentication (`/api/v1/auth`)
- `POST /login` - Authenticate user
- `POST /register` - Register a new user
- `POST /select-workspace` - Set the active workspace context
- `POST /logout` - Invalidate session

## Workspace (`/api/v1/workspace`)
- `GET /` - List user's workspaces
- `POST /` - Create a new workspace
- `GET /:id` - Get workspace details
- `GET /members` - List members of the active workspace
- `POST /invites` - Invite a user to the workspace

## Projects (`/api/v1/projects`)
- `GET /` - List projects in active workspace
- `POST /` - Create a new project
- `GET /:id` - Get project details
- `PATCH /:id` - Update project

## Tasks (`/api/v1/tasks`)
- `GET /` - List tasks
- `POST /` - Create a task
- `PATCH /:id` - Update a task
- `POST /:id/time-logs` - Add a time log to a task

## Finance (`/api/v1/finance`)
- `GET /accounts` - List chart of accounts
- `POST /invoices` - Create a new invoice
- `GET /invoices/:id` - Get invoice details
- `POST /payments` - Record a payment
- `POST /journals` - Create a manual journal entry
- `GET /reports/balance-sheet` - Generate balance sheet

## Human Resources (`/api/v1/hr`)
- `GET /employees` - List employees
- `POST /employees` - Onboard a new employee
- `GET /attendance` - Get attendance records
- `POST /leaves` - Submit a leave application
- `POST /payroll/run` - Trigger a payroll generation run

*(Refer to the live Swagger documentation for exact request payloads and query parameters).*