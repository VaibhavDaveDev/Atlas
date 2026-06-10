# Finance & Accounting

The Finance module is the backbone of Atlas ERP, implementing strict double-entry accounting principles.

## Key Features

1. **Chart of Accounts:** A hierarchical structure of financial accounts (Assets, Liabilities, Equity, Income, Expenses).
2. **Invoicing:** Create, send, and track customer invoices.
3. **Payments:** Record incoming (Customer) and outgoing (Vendor) payments.
4. **Journal Entries:** Manually adjust accounts or view automatically generated entries from other modules.
5. **Reporting:** Generate real-time Balance Sheets and Profit & Loss (Income) Statements.

## Integration Points
- **Payroll:** Salary payouts generate Journal Entries.

## Accounting Integrity
Atlas ERP enforces that all `JournalEntry` records are balanced (Total Debits = Total Credits). Once a Journal Entry is posted, its lines cannot be modified or deleted, ensuring a secure audit trail.

## API Endpoints
- `/api/v1/finance/accounts`
- `/api/v1/finance/invoices`
- `/api/v1/finance/journals`
- `/api/v1/finance/reports/balance-sheet`