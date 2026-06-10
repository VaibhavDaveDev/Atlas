# Projects

The Projects module helps service-based teams track deliverables and billable hours.

## Key Features

1. **Project Portfolios:** Organize work into discrete projects with budgets and statuses.
2. **Task Management:** Kanban-style task tracking (To Do, In Progress, Review, Done).
3. **Milestones:** Group tasks into phases or sprints.
4. **Time Tracking:** Employees log hours against specific tasks.

## Integration Points
- **HR:** Only internal Employees can log time.
- **Finance:** (Upcoming) Billable hours from `TimeLogs` can be automatically pulled into `Invoices` to bill clients.

## API Endpoints
- `/api/v1/projects`
- `/api/v1/tasks`
- `/api/v1/tasks/:id/time-logs`