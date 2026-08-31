<p align="center">
  <img src="public/images/logo.svg" alt="FinMate Logo" width="100">
</p>

<h1 align="center">FinMate</h1>

<p align="center">
  <strong>Financial Management System with Role-Based Access</strong><br>
  Track expenses, manage budgets, monitor savings, and control team finances — all from one dashboard.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/express-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express">
  <img src="https://img.shields.io/badge/mysql-4479A1?style=for-the-badge&logo=mysql&logoColor=white" alt="MySQL">
  <img src="https://img.shields.io/badge/EJS-F05138?style=for-the-badge&logo=ejs&logoColor=white" alt="EJS">
  <img src="https://img.shields.io/badge/bootstrap-563D7C?style=for-the-badge&logo=bootstrap&logoColor=white" alt="Bootstrap">
</p>

---

## Overview

FinMate is a multi-page application (MPA) for managing personal and team finances. It supports five user roles with distinct permissions — from individual expense tracking to full platform administration.

### Key Highlights

- **5 user roles** — Super Admin, Admin, Team Leader, Team Member, Individual User
- **Full CRUD** — Expenses, incomes, budgets, savings goals, planned expenses
- **Team management** — Create teams, assign leaders, approve/reject expenses
- **Analytics** — Chart-based dashboards, category breakdowns, monthly trends
- **Notifications** — Real-time alerts for budget limits, expense approvals, system events
- **Security** — Helmet, rate limiting, input sanitization, JWT auth, HTTP-only cookies
- **Responsive** — Collapsible sidebar, mobile overlay, works on all screen sizes

---

## Tech Stack

| Layer        | Technology                                      |
|--------------|------------------------------------------------|
| Runtime      | Node.js >= 14                                  |
| Framework    | Express.js                                     |
| Database     | MySQL (mysql2 driver)                          |
| Templating   | EJS                                            |
| Frontend     | Bootstrap 5, Font Awesome 6, Chart.js          |
| Auth         | JWT (jsonwebtoken) + bcryptjs                  |
| Security     | Helmet, CORS, express-rate-limit, compression  |
| Validation   | express-validator                              |

---

## Getting Started

### Prerequisites

- Node.js >= 14
- MySQL >= 5.7 (or remote MySQL like AlwaysData, PlanetScale)

### Installation

```bash
git clone <repository-url>
cd FinMateV2
npm install
```

### Environment Setup

```bash
cp .env.example .env
```

Edit `.env` with your database credentials and secrets. See [Environment Variables](#environment-variables) below.

### Database Initialization

```bash
npm run seed
```

This creates all tables and seeds default roles, permissions, and test users.

### Run

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

The server starts at `http://localhost:3000`.

---

## Default Test Credentials

| Role            | Email                  | Password     |
|-----------------|------------------------|--------------|
| Super Admin     | superadmin@finmate.com | `admin123`   |
| Admin           | admin@finmate.com      | `admin123`   |
| Team Leader     | teamleader@finmate.com | `admin123`   |
| Team Member     | teammember@finmate.com | `admin123`   |
| Individual User | user1@finmate.com      | `password123`|

---

## Environment Variables

| Variable         | Description                           | Default              |
|------------------|---------------------------------------|----------------------|
| `PORT`           | Server port                           | `3000`               |
| `NODE_ENV`       | `development` or `production`         | `development`        |
| `APP_NAME`       | Application name                      | `FinMate`            |
| `DB_HOST`        | MySQL host                            | `localhost`          |
| `DB_USER`        | MySQL user                            | `root`               |
| `DB_PASSWORD`    | MySQL password                        | (empty)              |
| `DB_NAME`        | Database name                         | `finmate_local`      |
| `DB_PORT`        | MySQL port                            | `3306`               |
| `DB_SSL`         | Enable SSL for DB connection          | `false`              |
| `DB_CA_PATH`     | Path to CA certificate for SSL        | (optional)           |
| `JWT_SECRET`     | Secret for JWT token signing          | (required)           |
| `SESSION_SECRET` | Secret for session cookies            | (required)           |
| `INIT_DB`        | Auto-initialize tables on boot        | `false`              |
| `SMTP_HOST`      | SMTP server for email notifications   | (optional)           |
| `SMTP_PORT`      | SMTP port                             | `587`                |
| `SMTP_USER`      | SMTP username                         | (optional)           |
| `SMTP_PASS`      | SMTP password                         | (optional)           |

---

## Project Structure

```
FinMateV2/
├── config/
│   ├── appConfig.js          # Roles, permissions, constants
│   ├── db.js                 # MySQL pool, query helpers, schema init
│   ├── jwt.js                # JWT sign/verify
│   └── seed.js               # Database seeder
├── controllers/
│   ├── authController.js     # Login, register, logout, profile
│   ├── admin/                # Admin controllers
│   ├── individualUser/       # Individual user controllers
│   ├── superAdmin/           # Super admin controllers
│   ├── teamLeader/           # Team leader controllers
│   └── teamMember/           # Team member controllers
├── middlewares/
│   ├── authMiddleware.js     # JWT auth, role checks
│   ├── securityMiddleware.js # Rate limiting, XSS sanitization
│   ├── validateMiddleware.js # express-validator integration
│   ├── errorMiddleware.js    # Error handling
│   ├── loggerMiddleware.js   # Request logging
│   └── asyncHandler.js       # Async error wrapper
├── routes/
│   ├── authRoutes.js         # Login, register, logout, profile
│   ├── indexRoutes.js        # Landing page, root redirects
│   ├── individualUserRoutes.js
│   ├── teamMemberRoutes.js
│   ├── teamLeaderRoutes.js
│   ├── adminRoutes.js
│   └── superAdminRoutes.js
├── views/
│   ├── partials/             # sidebar.ejs (unified, role-based)
│   ├── auth/                 # Login, register, profile
│   ├── individualUser/       # Dashboard, expenses, budgets, etc.
│   ├── teamMember/           # Team member views
│   ├── teamLeader/           # Team leader views
│   ├── admin/                # Admin views
│   └── superAdmin/           # Super admin views
├── public/
│   ├── css/                  # Per-role stylesheets
│   ├── js/                   # Per-role client-side JS
│   └── images/favicon/       # App icon and favicons
├── docs/
│   ├── FEATURES-BY-ROLE.md   # All features per role
│   └── ARCHITECTURE.md       # Technical architecture
├── scripts/
│   └── test-routes.js        # Route test script (59 tests)
├── server.js                 # Express app bootstrap
├── .env.example              # Environment template
└── package.json
```

---

## Features by Role

### Individual User (`/user`)
Dashboard, Expenses (CRUD), Incomes (CRUD), Budgets (CRUD), Savings Goals (CRUD), Planned Expenses (CRUD), Upcoming Expenses (CRUD), Analytics, Notifications, Settings, Profile

### Team Member (`/team-member`)
Dashboard, Expenses, Planned Expenses

### Team Leader (`/team-leader`)
Dashboard, My Team, Expenses (approve/reject), Planned Expenses

### Admin (`/admin`)
Dashboard, Users (CRUD), Budgets, Expenses, Teams, Reports (CSV/JSON export), Notifications, Profile

### Super Admin (`/super-admin`)
Dashboard, Users, Roles, Permissions, Audit Logs, Notifications, System Settings, Profile

See [docs/FEATURES-BY-ROLE.md](docs/FEATURES-BY-ROLE.md) for detailed descriptions of every feature.

---

## Security

- **Helmet** — Sets secure HTTP headers
- **Rate limiting** — 100 requests/15min on API routes
- **Input sanitization** — Strips `<script>`, `javascript:`, event handlers on POST/PUT/DELETE
- **JWT + HTTP-only cookies** — Tokens stored in httpOnly cookies, not accessible via JavaScript
- **bcryptjs** — Password hashing with salt rounds
- **express-validator** — Input validation and sanitization on registration
- **SQL injection protection** — Parameterized queries throughout
- **CORS** — Configurable cross-origin policy
- **Compression** — gzip response compression

---

## API Routes Summary

| Role            | GET routes | POST routes | Total |
|-----------------|------------|-------------|-------|
| Auth            | 4          | 5           | 9     |
| Individual User | 20         | 30          | 50    |
| Team Member     | 3          | 5           | 8     |
| Team Leader     | 5          | 51          | 56    |
| Admin           | 20         | 26          | 46    |
| Super Admin     | 20         | 20          | 40    |
| **Total**       | **72**     | **137**     | **209**|

---

## Development

### Test Routes

```bash
# Start server first, then:
node scripts/test-routes.js
```

Runs 59 tests across all 5 roles — login, page access, and auth protection.

### Database Reset

```bash
npm run seed
```

---

## License

MIT
