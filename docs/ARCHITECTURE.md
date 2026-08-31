# Architecture

Technical architecture overview of the FinMate finance application.

---

## Application Type

FinMate is a **Multi-Page Application (MPA)**. Each user action triggers a full page reload served by Express via EJS templates. Client-side JavaScript enhances interactivity (charts, sidebar toggle, modals) but the core flow is server-rendered.

---

## Route Organization

Routes are organized by role, each mounted at a distinct prefix:

| Prefix            | File                      | Auth Required | Roles                                    |
|-------------------|---------------------------|---------------|------------------------------------------|
| `/auth`           | `authRoutes.js`           | No (login/register) / Yes (logout, profile) | All authenticated users |
| `/super-admin`    | `superAdminRoutes.js`     | Yes           | `super_admin`                            |
| `/admin`          | `adminRoutes.js`          | Yes           | `admin`, `super_admin`                   |
| `/team-leader`    | `teamLeaderRoutes.js`     | Yes           | `team_leader`, `admin`, `super_admin`    |
| `/team-member`    | `teamMemberRoutes.js`     | Yes           | `team_member`                            |
| `/user`           | `individualUserRoutes.js` | Yes           | `individual_user`                        |
| `/`               | `indexRoutes.js`          | No            | Public (landing page)                    |
| `/health`         | inline in `server.js`     | No            | Public (health check)                    |

All protected routes use `authenticate` middleware to verify the JWT token, followed by `requireRole()` or `requireAnyRole()` to enforce role-based access.

---

## Middleware Stack

Applied in order in `server.js`:

| Order | Middleware               | Purpose                                                    |
|-------|--------------------------|------------------------------------------------------------|
| 1     | `helmet`                 | Sets secure HTTP headers (CSP disabled for EJS flexibility) |
| 2     | `cors`                   | Cross-origin resource sharing                              |
| 3     | `extraHeaders`           | Adds X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy |
| 4     | `morgan`                 | HTTP request logging (`combined` format)                   |
| 5     | `express.json`           | JSON body parsing (1mb limit)                              |
| 6     | `express.urlencoded`     | URL-encoded body parsing (1mb limit)                       |
| 7     | `cookie-parser`          | Cookie parsing for JWT token extraction                    |
| 8     | `sanitizeInput`          | Strips `<script>`, `javascript:`, and `on*=` from POST/PUT/DELETE body fields |
| 9     | `express-session`        | Server-side sessions (24h cookie, httpOnly, sameSite lax)  |
| 10    | `apiLimiter`             | Rate limiting on `/api/*` routes (100 req / 15 min)        |
| 11    | `compression`            | Gzip compression for responses                             |
| 12    | `express.static`         | Serves `public/` with caching headers in production        |

Additional per-route middleware:
- `authLimiter` - Strict rate limit on auth routes (10 req / 15 min)
- `validate` - express-validator result checking
- `validateExpense` - Expense-specific validation
- `asyncHandler` - Wraps async route handlers to catch errors

---

## Database Schema

MySQL database with the following core tables:

### Core Tables

| Table              | Purpose                                                         |
|--------------------|-----------------------------------------------------------------|
| `roles`            | User roles (super_admin, admin, team_leader, team_member, individual_user) |
| `permissions`      | Granular permission definitions                                 |
| `role_permissions` | Many-to-many: roles to permissions                              |
| `users`            | User accounts with username, email, password (bcrypt), role_id, team_id, is_active |
| `teams`            | Team groups with name, description, team_leader_id              |

### Financial Tables

| Table               | Purpose                                                            |
|---------------------|--------------------------------------------------------------------|
| `expenses`          | User expenses with amount, description, category, date, status (pending/approved/rejected), team_id |
| `incomes`           | User income records with amount, source, category, date, status    |
| `budgets`           | Category budgets with amount, period (monthly/weekly/yearly/custom), start/end dates, team_id |
| `savings_goals`     | Savings targets with name, target_amount, current_amount, target_date, status |
| `planned_expenses`  | Future expenses with planned_date, recurrence (none/weekly/monthly/yearly), status |
| `planned_purchases` | Upcoming purchases with due_date, priority (low/medium/high), quantity, period |

### System Tables

| Table              | Purpose                                                         |
|--------------------|-----------------------------------------------------------------|
| `notifications`    | User notifications with title, message, type (info/warning/success/error), is_read |
| `user_settings`    | Per-user preferences: currency, theme, notification toggles     |
| `audit_logs`       | System audit trail: user_id, action, entity_type, old/new values, IP, user_agent |
| `system_logs`      | Application-level logs: level (info/warn/error/debug), message, source, metadata |
| `system_settings`  | Global key-value configuration store                            |

### Key Relationships

```
roles ──< users >── teams
                >── expenses
                >── incomes
                >── budgets
                >── savings_goals
                >── planned_expenses
                >── planned_purchases
                >── notifications
                >── user_settings
                >── audit_logs

roles ──< role_permissions >── permissions
```

---

## Authentication Flow

1. **Login:** User submits credentials to `POST /auth/login`.
2. **Verification:** `authController` compares bcrypt-hashed password against the `users` table.
3. **Token Generation:** On success, a JWT is generated with `userId` as the payload, signed with `JWT_SECRET`, set to expire in 7 days.
4. **Cookie Storage:** The JWT is set as an `httpOnly` cookie named `token` (secure in production, sameSite lax).
5. **Request Authentication:** On each protected request, `authMiddleware.authenticate` extracts the token from `req.cookies.token` (or `Authorization` header), verifies it with `jsonwebtoken`, and loads the full user record (with role name) from the database.
6. **Role Authorization:** `requireRole('role_name')` or `requireAnyRole(['role1', 'role2'])` checks `req.user.role_name` against the allowed list. Returns 403 if denied.
7. **Logout:** `GET /auth/logout` clears the `token` cookie and destroys the session.

### Token Details

- **Algorithm:** HMAC-SHA256 (default jsonwebtoken)
- **Payload:** `{ userId: <id> }`
- **Expiry:** 7 days
- **Storage:** httpOnly cookie (not accessible via JavaScript)

---

## Security Features

| Feature                  | Implementation                                                      |
|--------------------------|---------------------------------------------------------------------|
| HTTP Headers             | Helmet.js with CSP disabled, plus custom headers (X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy, Permissions-Policy) |
| Rate Limiting            | General API: 100 req/15min. Auth routes: 10 req/15min. Uses `express-rate-limit` with standard headers. |
| Input Sanitization       | Custom middleware strips `<script>` tags, `javascript:` URIs, and `on*` event handlers from POST/PUT/DELETE body strings |
| Password Hashing         | bcrypt with salt rounds = 12                                        |
| SQL Injection Prevention | Parameterized queries via `mysql2` prepared statements (all queries use `?` placeholders) |
| XSS Prevention           | EJS auto-escapes output by default. Input sanitization as additional layer. |
| CORS                     | Enabled via `cors` middleware                                       |
| Session Security         | httpOnly cookies, secure flag in production, sameSite lax, 24h expiry |
| Request Size Limits      | 1mb limit on JSON and URL-encoded bodies                           |
| Error Handling           | `asyncHandler` wraps async routes. `errorMiddleware` catches errors. Global `uncaughtException` and `unhandledRejection` handlers prevent silent crashes. |

---

## Build and Deployment

- **Development:** `npm run dev` uses `nodemon` for auto-reload
- **Production:** `npm start` runs `node server.js`
- **Vercel:** `vercel.json` configured for serverless deployment
- **Database Init:** Set `INIT_DB=true` in `.env` to auto-create tables on boot (disabled by default to avoid crashes on slow remote DBs)

---

## Key Dependencies

| Package              | Version  | Purpose                              |
|----------------------|----------|--------------------------------------|
| express              | ^4.18.2  | Web framework                        |
| mysql2               | ^3.6.5   | MySQL driver with prepared statements|
| ejs                  | ^3.1.9   | Template engine                      |
| jsonwebtoken         | ^9.0.2   | JWT authentication                   |
| bcrypt / bcryptjs    | ^6.0.0 / ^2.4.3 | Password hashing             |
| helmet               | ^7.1.0   | Security headers                     |
| express-rate-limit   | ^8.7.0   | Rate limiting                        |
| compression          | ^1.8.1   | Response compression                 |
| express-validator    | ^7.0.1   | Request validation                   |
| chart.js             | ^4.5.1   | Client-side charts                   |
| nodemailer           | ^6.9.7   | Email sending (notification service) |
| morgan               | ^1.10.0  | HTTP request logging                 |
