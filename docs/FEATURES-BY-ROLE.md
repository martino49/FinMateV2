# Features by Role

FinMate provides five distinct user roles, each with a tailored set of features accessible through the sidebar navigation. This document describes every feature available to each role.

---

## Individual User (`individual_user`)

**Route prefix:** `/user`

### Finance

| Feature              | Route                        | Description                                                                 |
|----------------------|------------------------------|-----------------------------------------------------------------------------|
| **Dashboard**        | `/user/dashboard`            | Overview of daily and monthly expenses, savings progress, active budgets, today's transactions, and notification count. Includes a configurable daily expense limit. |
| **Expenses**         | `/user/expenses`             | Full CRUD for personal expenses. Create, view, edit, and delete expenses with amount, description, category, and date. Shows summary stats (total, this month, category count). |
| **Incomes**          | `/user/incomes`              | Full CRUD for income records. Track income by source (salary, freelance, investment, etc.), category, and status. Filter by status and period. |
| **Budgets**          | `/user/budgets`              | Full CRUD for category budgets. Set monthly, weekly, yearly, or custom period budgets. Tracks spent amount per budget against the limit. |
| **Savings Goals**    | `/user/savings`              | Create, update, and delete savings goals. Set target amount, target date, and make deposits. Tracks progress toward each goal. |
| **Planned Expenses** | `/user/planned-expenses`     | Schedule future expenses with a planned date and recurrence option (weekly, monthly, yearly). Create and track planned expenses. |
| **Upcoming Expenses**| `/user/upcoming-expenses`    | Manage upcoming purchases with title, amount, quantity, category, and due date. Filter by status and period. |
| **Analytics**        | `/user/analytics`            | Visual analytics and charts for spending patterns, budget utilization, and financial trends. |

### Account

| Feature              | Route                        | Description                                                                 |
|----------------------|------------------------------|-----------------------------------------------------------------------------|
| **Notifications**    | `/user/notifications`        | View and manage notifications. Unread count badge shown in sidebar.         |
| **Settings**         | `/user/settings`             | User preferences: currency, theme, notification preferences, daily expense limit. |
| **Profile**          | `/user/profile`              | View and update personal information. Change password.                     |

---

## Team Member (`team_member`)

**Route prefix:** `/team-member`

### Work

| Feature              | Route                             | Description                                                                 |
|----------------------|-----------------------------------|-----------------------------------------------------------------------------|
| **Dashboard**        | `/team-member/dashboard`          | Overview of the team member's recent activity and status.                   |
| **Expenses**         | `/team-member/expenses`           | View and submit expenses for team approval. Shows expense list and status.  |
| **Planned Expenses** | `/team-member/planned-expenses`   | View and submit planned expenses. Shows planned expense list.               |

---

## Team Leader (`team_leader`)

**Route prefix:** `/team-leader`

### Team

| Feature              | Route                             | Description                                                                 |
|----------------------|-----------------------------------|-----------------------------------------------------------------------------|
| **Dashboard**        | `/team-leader/dashboard`          | Team overview with stats: active members, pending expenses, total spent, and planned expenses. Shows recent expense submissions. |
| **My Team**          | `/team-leader/teams`              | View team details, member count, and team leader information. Edit team settings. |
| **Expenses**         | `/team-leader/expenses`           | Review and approve/reject team member expenses. Filter by pending, approved, and rejected status. Add comments to expenses. Export expense data. |
| **Planned Expenses** | `/team-leader/planned-expenses`   | Review and approve planned expenses submitted by team members. Add, edit, delete, and approve planned expenses. Calendar view available. |

---

## Admin (`admin`)

**Route prefix:** `/admin`

### Management

| Feature              | Route                             | Description                                                                 |
|----------------------|-----------------------------------|-----------------------------------------------------------------------------|
| **Dashboard**        | `/admin/dashboard`                | System-wide stats: total users, budgets, expenses, pending expenses, teams, and unread notifications. |
| **Users**            | `/admin/users`                    | Full user CRUD. List all users with role and team info. Add, edit, and deactivate users. Change user passwords. View user analytics (expenses, budgets, savings). View user activity history. |
| **Budgets**          | `/admin/budgets`                  | Manage all budgets across users. Create, edit, and delete budgets. Assign budgets to users or teams. |
| **Expenses**         | `/admin/expenses`                 | Manage all expenses. List, filter by status, add, edit, and delete expenses. Approve or reject expenses. Assign expenses to users or teams. |
| **Teams**            | `/admin/teams`                    | Full team CRUD. Create, edit, and delete teams. Assign team leaders.       |
| **Reports**          | `/admin/reports`                  | Financial reports and analytics: expense stats, budget stats, user stats, team stats, monthly trends, category breakdown, top users by spending. Export to CSV or JSON. |
| **Notifications**    | `/admin/notifications`            | View all system notifications across users. Manage notification types (system, security, user, expense, budget). |
| **Profile**          | `/admin/profile`                  | Admin profile management. Update personal info, change password. Shows admin-specific activity stats and recent activities. |

---

## Super Admin (`super_admin`)

**Route prefix:** `/super-admin`

### Platform

| Feature              | Route                               | Description                                                                 |
|----------------------|-------------------------------------|-----------------------------------------------------------------------------|
| **Dashboard**        | `/super-admin/dashboard`            | Full platform overview: users, admins, budgets, expenses, pending expenses, teams, savings goals, notifications, system logs (24h), monthly revenue. Shows recent users, recent activities, role distribution, and system health (DB size, active sessions, uptime). |
| **Users**            | `/super-admin/users`                | Full user management across all roles. Add, edit, deactivate, and restore users. Change any user's password. Assign roles and teams. |
| **Roles**            | `/super-admin/roles`                | Full role CRUD. Create, edit, and delete custom roles. Assign granular permissions to each role. Shows user count per role. Prevents deletion of roles with assigned users. |
| **Permissions**      | `/super-admin/permissions`          | Full permission CRUD. Create, edit, and delete system permissions. Organize by category. Shows role count per permission. Prevents deletion of permissions assigned to roles. |
| **Audit Logs**       | `/super-admin/audit-logs`           | View all system audit logs with pagination and search. Filter by action, user, and date range. View detailed log entries with old/new values. Export logs to CSV or JSON. Clear logs by age (30 days, 90 days, 1 year, or keep last 1000). |
| **Notifications**    | `/super-admin/notifications`        | View all notifications system-wide with pagination.                         |
| **System Settings**  | `/super-admin/system-settings`      | Manage global system settings. Update application configuration values.     |
| **System Logs**      | `/super-admin/system-logs`          | View application-level system logs with filtering by level (info, warn, error, debug) and search. Paginated. Clear logs by level and age. |
| **Backup Management**| `/super-admin/backups`              | Manage database backups. Create new backups.                                |
| **Profile**          | `/super-admin/profile`              | Super admin profile management. Update personal info and change password with current password verification. |

---

## Default Roles and Permissions

The system ships with five built-in roles and seven core permissions:

| Permission         | Description            |
|--------------------|------------------------|
| `user_manage`      | Manage users           |
| `team_manage`      | Manage teams           |
| `budget_manage`    | Manage budgets         |
| `expense_manage`   | Manage expenses        |
| `savings_manage`   | Manage savings         |
| `report_view`      | View reports           |
| `system_manage`    | Manage system settings |

**Permission assignments:**

- **Super Admin:** All permissions
- **Admin:** user_manage, team_manage, budget_manage, expense_manage, savings_manage, report_view
- **Team Leader:** team_manage, budget_manage, expense_manage, savings_manage, report_view
- **Team Member:** expense_manage, savings_manage, report_view
- **Individual User:** budget_manage, expense_manage, savings_manage, report_view
