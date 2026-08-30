# FinMate

A role-based financial management system for individuals and teams.

## Features

- 5-role access control: Super Admin, Admin, Team Leader, Team Member, Individual User
- Expense tracking: Add, edit, delete, categorize, filter expenses
- Budget management: Monthly/weekly/yearly budgets with status tracking
- Savings goals: Track target amounts and progress
- Income tracking: Log and categorize income sources
- Planned expenses: Upcoming purchases with pending/paid/cancelled status
- Team collaboration: Teams with leaders, shared budgets and expenses
- Notifications: In-app alerts for users
- Reports and dashboards: Chart.js visualizations per role
- Audit logs: Track system changes (Super Admin)
- System settings: Configure app settings (Super Admin)

## Tech Stack

- Backend: Node.js, Express
- Database: MySQL
- Auth: JWT + bcrypt
- Views: EJS templates
- Charts: Chart.js

## Setup

1. Clone the repo
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env` and configure
4. Run: `npm run dev`
5. Server starts on `http://localhost:3000`

## Default Login

| Role | Email | Password |
|------|-------|----------|
| Super Admin | superadmin@finmate.com | admin123 |
| Admin | admin@finmate.com | admin123 |
| Team Leader | teamleader@finmate.com | admin123 |
| Team Member | teammember@finmate.com | admin123 |
| Individual User | user1@finmate.com | admin123 |

## Project Structure

```
FinMateV2/
├── config/            DB pool, app config, seed
├── controllers/       Route handlers per role
├── middlewares/        auth, async, error, validation
├── models/            Data models
├── routes/            Auth, admin, super-admin, team, individual
├── services/          Business logic
├── utils/             Date, DB helpers, email, logger
├── views/             EJS templates per role
├── public/            CSS, JS, favicon
├── vercel.json        Serverless deployment config
└── server.js          App entry
```

## License

MIT
