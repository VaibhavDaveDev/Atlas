# Employee Self-Service (ESS)

The Employee Self-Service (ESS) module empowers employees to manage their own data, requests, and daily tasks without needing direct HR or administrative intervention.

## Purpose

The ESS module is a specialized subset of the ERP designed strictly for end-users (employees). It provides a simplified interface for common tasks, reducing the administrative burden on the HR and Finance departments.

## Key Features

1. **Profile Management:** Employees can view and update their basic contact information (`updateMyProfile`).
2. **Attendance Tracking:** Check-in and check-out functionality (`checkIn`, `checkOut`), as well as viewing attendance history (`getMyAttendanceHistory`).
3. **Leave Management:** 
   - View leave balances and available leave types (`getMyLeaveBalances`, `getEssLeaveTypes`).
   - Apply for time off and cancel pending requests (`applyLeave`, `cancelLeave`).
4. **Payroll & Taxes:**
   - Download monthly payslips (`getMyPayslips`).
   - Submit and manage tax declarations (`submitTaxDeclaration`).
5. **Helpdesk / Ticketing:** Create and manage internal IT/HR support tickets (`createTicket`, `addTicketComment`).
6. **Performance Appraisals:** Submit self-appraisals during active appraisal cycles (`submitSelfAppraisal`).

## File Structure

**Backend (`apps/api/src/self-service/`):**
- `self-service.module.ts`
- `self-service.controller.ts` (Handles `/api/v1/ess/*` endpoints)
- `self-service.service.ts`

**Frontend (`apps/web/src/app/dashboard/ess/`):**
- Features a dedicated layout tailored for standard employees rather than administrators.

## Integration Points

The ESS module acts as an orchestrator. Rather than owning its own database tables, it interacts with:
- **HR Module:** For attendance, leaves, and appraisals.
- **Finance Module:** For fetching payslips.

By isolating these endpoints in a `SelfServiceController`, we ensure that employees only ever access data scoped to their own `userId`, providing a critical layer of security on top of the standard workspace guards.