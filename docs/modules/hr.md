# HR (Human Resources)

The HR module is the central repository for employee data and daily workforce management.

## Key Features

1. **Employee Profiles:** Store personal details, emergency contacts, and statutory information (e.g., tax IDs).
2. **Organizational Structure:** Define Departments and Designations (Roles).
3. **Attendance Tracking:** Employees can clock in/out via the Self-Service portal.
4. **Leave Management:** 
   - Define custom `LeaveTypes` (Sick, Casual, Maternity).
   - Configure `LeavePolicies` (e.g., accrue 1.5 days per month).
   - Employees apply for leave, managers approve.

## Integration Points
- **Payroll:** Attendance records and Leave without Pay (LWP) automatically affect the monthly payroll calculation.
- **Projects:** Only active employees can be assigned as `ProjectMembers`.

## API Endpoints
- `/api/v1/hr/employees`
- `/api/v1/hr/attendance`
- `/api/v1/hr/leaves`