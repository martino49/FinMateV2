# FinMate Full Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development (recommended) or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all broken features, strip dead code, complete missing pieces, and update documentation so FinMate is a fully working financial management app.

**Architecture:** Fix the existing Express + MySQL + EJS stack. No new frameworks. Add missing DB tables, fix column mismatches, create missing views, remove dead code, and update READMEs.

**Tech Stack:** Node.js, Express, MySQL2, EJS, bcryptjs, JWT, Chart.js

---

## File Structure Map

### Files to CREATE:
- `views/admin/budgets/edit.ejs`
- `views/admin/expenses/edit.ejs`
- `views/admin/teams/create.ejs`
- `views/admin/teams/edit.ejs`
- `views/superAdmin/roles/add.ejs`
- `views/superAdmin/permissions/add.ejs`
- `views/superAdmin/audit-logs/details.ejs`
- `views/superAdmin/profile.ejs`
- `views/teamLeader/teams/index.ejs` (replace broken reference)
- `views/teamLeader/expenses/index.ejs` (replace broken reference)
- `views/teamLeader/plannedExpenses/index.ejs` (replace broken reference)
- `views/teamLeader/budgets/index.ejs`
- `views/teamLeader/members/index.ejs`
- `views/teamLeader/notifications/index.ejs`
- `views/teamLeader/reports/index.ejs`
- `views/teamLeader/settings.ejs`
- `views/teamLeader/profile.ejs`
- `views/teamMember/expenses/index.ejs`
- `views/individualUser/analytics/trends.ejs`

### Files to MODIFY:
- `config/db.js` — add timeout, fix schema
- `config/seed.js` — add missing tables, fix columns
- `server.js` — remove duplicate route
- `routes/indexRoutes.js` — fix `req.user.role` bug
- `routes/income.js` — fix route ordering
- `routes/superAdminRoutes.js` — remove duplicates, fix imports
- `routes/teamLeaderRoutes.js` — fix view paths
- `routes/teamMemberRoutes.js` — fix view path
- `routes/individualUserRoutes.js` — fix column names
- `routes/adminRoutes.js` — fix view paths
- `controllers/authController.js` — implement profile/password updates
- `middlewares/validateMiddleware.js` — fix double export
- `README.md` — update with current status

### Files to DELETE:
- `controllers/expenseController.js` (unused, superseded by individualUser/expenseController.js)
- `controllers/incomeController.js` (unused, superseded by inline routes)
- `controllers/plannedPurchaseController.js` (unused, superseded by inline routes)
- `controllers/dashboardDataController.js` (unused)
- `models/LentMoney.js` (unused)
- `models/Permission.js` (unused)
- `models/PlannedExpense.js` (unused)
- `models/Role.js` (unused)
- `models/Savings.js` (unused)
- `models/Team.js` (unused)
- `routes/income.js` (unused sub-router, superseded by inline routes)
- `routes/plannedPurchases.js` (unused sub-router, superseded by inline routes)
- `views/layouts/main.ejs` (unused, no layout system)
- `views/partials/head.ejs` (unused, no include system)
- `views/partials/header.ejs` (unused)
- `views/partials/sidebar.ejs` (unused, each role has own sidebar)
- `views/partials/superAdmin-sidebar.ejs` (unused, sidebar is inline in views)
- `views/partials/admin-sidebar.ejs` (unused, sidebar is inline in views)

---

## Task 1: Fix DB Schema — Add Missing Tables and Columns

**Files:**
- Modify: `config/db.js` (add timeout + missing tables)
- Modify: `config/seed.js` (update seed data)

- [ ] **Step 1: Add connection timeout to db.js**

Edit `config/db.js` — add `connectTimeout: 5000` and `acquireTimeout: 5000` to `dbConfig`:

```javascript
const dbConfig = {
  host: process.env.DB_HOST || (isProduction ? '' : 'localhost'),
  user: process.env.DB_USER || (isProduction ? '' : 'root'),
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || (isProduction ? '' : 'finmate_local'),
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,
  connectTimeout: 5000,
  acquireTimeout: 5000,
  // ... ssl config unchanged
};
```

- [ ] **Step 2: Add missing tables to initDatabase() in db.js**

Add these table creation blocks inside `initDatabase()` after the existing tables:

```javascript
// Incomes table
await execute(`CREATE TABLE IF NOT EXISTS incomes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  source VARCHAR(100),
  date DATE NOT NULL,
  status ENUM('active','inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
)`);
```

```javascript
// Planned purchases table
await execute(`CREATE TABLE IF NOT EXISTS planned_purchases (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  due_date DATE,
  status ENUM('pending','purchased','cancelled') DEFAULT 'pending',
  priority ENUM('low','medium','high') DEFAULT 'medium',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
)`);
```

```javascript
// User settings table
await execute(`CREATE TABLE IF NOT EXISTS user_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNIQUE NOT NULL,
  currency VARCHAR(10) DEFAULT 'USD',
  theme VARCHAR(20) DEFAULT 'light',
  notifications_enabled BOOLEAN DEFAULT TRUE,
  email_notifications BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
)`);
```

```javascript
// Audit logs table
await execute(`CREATE TABLE IF NOT EXISTS audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id INT,
  old_values JSON,
  new_values JSON,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
)`);
```

```javascript
// System logs table
await execute(`CREATE TABLE IF NOT EXISTS system_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  level ENUM('info','warn','error','debug') DEFAULT 'info',
  message TEXT NOT NULL,
  source VARCHAR(100),
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)`);
```

```javascript
// System settings table
await execute(`CREATE TABLE IF NOT EXISTS system_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)`);
```

- [ ] **Step 3: Add missing columns to existing tables**

Add these ALTER TABLE statements after the CREATE TABLE statements in `initDatabase()`:

```javascript
// Add status and team_id to expenses if missing
try {
  await execute(`ALTER TABLE expenses ADD COLUMN status ENUM('pending','approved','rejected') DEFAULT 'pending' AFTER date`);
} catch { /* column exists */ }
try {
  await execute(`ALTER TABLE expenses ADD COLUMN team_id INT NULL AFTER user_id`);
} catch { /* column exists */ }
```

```javascript
// Add planned_date and recurrence to planned_expenses if missing
try {
  await execute(`ALTER TABLE planned_expenses ADD COLUMN planned_date DATE AFTER due_date`);
} catch { /* column exists */ }
try {
  await execute(`ALTER TABLE planned_expenses ADD COLUMN recurrence ENUM('none','weekly','monthly','yearly') DEFAULT 'none' AFTER status`);
} catch { /* column exists */ }
```

```javascript
// Add team_id to budgets if missing
try {
  await execute(`ALTER TABLE budgets ADD COLUMN team_id INT NULL AFTER user_id`);
} catch { /* column exists */ }
```

- [ ] **Step 4: Test DB initialization**

Run:
```bash
cd /home/derivo/Documents/projects/portfolio-polish/FinMateV2 && node -e "require('dotenv').config(); const db = require('./config/db'); db.initDatabase().then(() => { console.log('DB initialized'); process.exit(); }).catch(e => { console.error(e.message); process.exit(1); })"
```
Expected: "DB initialized" with no errors.

- [ ] **Step 5: Commit**

```bash
git add config/db.js config/seed.js
git commit -m "fix: add missing DB tables, columns, and connection timeout"
```

---

## Task 2: Fix DB Schema in seed.js

**Files:**
- Modify: `config/seed.js`

- [ ] **Step 1: Update seed.js to use correct table/column names**

Edit `config/seed.js` — the expenses table insert uses `status` and `team_id` columns that now exist. The savings table reference uses `savings` table name but the schema has `savings_goals`. Fix:

Line ~186: Change `savings` to `savings_goals`:
```javascript
await db.pool.execute(
  `INSERT IGNORE INTO savings_goals (user_id, name, target_amount, current_amount, target_date) 
   VALUES (?, ?, ?, ?, ?)`,
  [5, 'New Laptop', 1200.00, 300.00, '2024-06-01']
);
```

- [ ] **Step 2: Test seed**

Run:
```bash
cd /home/derivo/Documents/projects/portfolio-polish/FinMateV2 && node config/seed.js
```
Expected: "Database seeding completed successfully!" with no errors.

- [ ] **Step 3: Commit**

```bash
git add config/seed.js
git commit -m "fix: correct table names in seed.js"
```

---

## Task 3: Fix Route Bugs

**Files:**
- Modify: `routes/indexRoutes.js:7`
- Modify: `routes/income.js:9-13`
- Modify: `server.js:52`
- Modify: `middlewares/validateMiddleware.js:59-61`

- [ ] **Step 1: Fix indexRoutes.js req.user.role bug**

Edit `routes/indexRoutes.js` line 7 — change `req.user.role` to `req.user.role_name`:

```javascript
// Before
switch (req.user.role) {
// After
switch (req.user.role_name) {
```

- [ ] **Step 2: Fix income.js route ordering**

Edit `routes/income.js` — move `GET /stats/summary` BEFORE `GET /:id`:

```javascript
router.get('/', authenticate, incomeController.getIncomes);
router.get('/stats/summary', authenticate, incomeController.getIncomeSummary);
router.get('/:id', authenticate, incomeController.getIncomeById);
router.post('/', authenticate, incomeController.createIncome);
router.put('/:id', authenticate, incomeController.updateIncome);
router.delete('/:id', authenticate, incomeController.deleteIncome);
```

- [ ] **Step 3: Remove duplicate root route from server.js**

Edit `server.js` — delete line 52:
```javascript
// DELETE this line:
// app.get('/', (req, res) => res.render('index', { title: 'Welcome to FinMate' }));
```

- [ ] **Step 4: Fix validateMiddleware.js double export**

Edit `middlewares/validateMiddleware.js` — remove the duplicate `module.exports` at the end. Keep only one export statement.

- [ ] **Step 5: Commit**

```bash
git add routes/indexRoutes.js routes/income.js server.js middlewares/validateMiddleware.js
git commit -m "fix: route bugs - user.role, route ordering, duplicate root, double export"
```

---

## Task 4: Strip Dead Code — Unused Files

**Files:**
- Delete: `controllers/expenseController.js`
- Delete: `controllers/incomeController.js`
- Delete: `controllers/plannedPurchaseController.js`
- Delete: `controllers/dashboardDataController.js`
- Delete: `models/LentMoney.js`
- Delete: `models/Permission.js`
- Delete: `models/PlannedExpense.js`
- Delete: `models/Role.js`
- Delete: `models/Savings.js`
- Delete: `models/Team.js`
- Delete: `routes/income.js`
- Delete: `routes/plannedPurchases.js`
- Delete: `views/layouts/main.ejs`
- Delete: `views/partials/head.ejs`
- Delete: `views/partials/header.ejs`
- Delete: `views/partials/sidebar.ejs`
- Delete: `views/partials/superAdmin-sidebar.ejs`
- Delete: `views/partials/admin-sidebar.ejs`

- [ ] **Step 1: Delete unused controller files**

```bash
cd /home/derivo/Documents/projects/portfolio-polish/FinMateV2
rm controllers/expenseController.js
rm controllers/incomeController.js
rm controllers/plannedPurchaseController.js
rm controllers/dashboardDataController.js
```

- [ ] **Step 2: Delete unused model files**

```bash
rm models/LentMoney.js
rm models/Permission.js
rm models/PlannedExpense.js
rm models/Role.js
rm models/Savings.js
rm models/Team.js
```

- [ ] **Step 3: Delete unused route files**

```bash
rm routes/income.js
rm routes/plannedPurchases.js
```

- [ ] **Step 4: Delete unused view files**

```bash
rm views/layouts/main.ejs
rm views/partials/head.ejs
rm views/partials/header.ejs
rm views/partials/sidebar.ejs
rm views/partials/superAdmin-sidebar.ejs
rm views/partials/admin-sidebar.ejs
rmdir views/layouts 2>/dev/null
rmdir views/partials 2>/dev/null
```

- [ ] **Step 5: Verify no broken imports remain**

```bash
grep -rn "require.*expenseController\|require.*incomeController\|require.*plannedPurchase\|require.*dashboardData\|require.*LentMoney\|require.*Permission\|require.*PlannedExpense\|require.*Role\|require.*Savings\|require.*Team\|require.*income\|require.*plannedPurchases\|require.*layouts\|require.*partials" --include="*.js" | grep -v node_modules
```
Expected: No output (no broken imports).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: remove unused controllers, models, routes, and view files"
```

---

## Task 5: Strip Dead Code — Duplicate Routes in superAdminRoutes.js

**Files:**
- Modify: `routes/superAdminRoutes.js`

- [ ] **Step 1: Read superAdminRoutes.js and identify duplicates**

The file has duplicate definitions for these routes (second occurrence around lines 1476+):
- `GET /system-settings`
- `POST /system-settings/update`
- `GET /system-logs`
- `POST /system-logs/clear`
- `GET /backups`
- `POST /backups/create`

- [ ] **Step 2: Remove duplicate route blocks**

Delete the second occurrence of each duplicate route block (the ones appearing after line 1400). Keep only the first occurrence of each.

- [ ] **Step 3: Fix requireRole import**

Change line 12 from:
```javascript
const { authenticate, requireRole } = require('../middlewares/authMiddleware');
```
The `requireRole(['super_admin'])` call works but is semantically wrong. Change to:
```javascript
router.use(authenticate, requireRole('super_admin'));
```
(Single string, not array)

- [ ] **Step 4: Verify server starts**

```bash
cd /home/derivo/Documents/projects/portfolio-polish/FinMateV2 && node -e "require('./server.js')" 2>&1 | head -20
```
Expected: No syntax errors or duplicate route warnings.

- [ ] **Step 5: Commit**

```bash
git add routes/superAdminRoutes.js
git commit -m "fix: remove duplicate routes and fix requireRole usage in superAdminRoutes"
```

---

## Task 6: Fix teamLeaderRoutes.js — View Paths

**Files:**
- Modify: `routes/teamLeaderRoutes.js`

- [ ] **Step 1: Fix view path references**

The routes reference views like `teamLeader/teams` but the actual files are at `teamLeader/teams/index.ejs`. Fix all view references:

| Route | Current (broken) | Fixed |
|-------|-----------------|-------|
| `GET /teams` | `teamLeader/teams` | `teamLeader/teams/index` |
| `GET /expenses` | `teamLeader/expenses` | `teamLeader/expenses/index` |
| `GET /planned-expenses` | `teamLeader/planned-expenses` | `teamLeader/plannedExpenses/index` |

All other routes that reference non-existent views — change them to render the closest existing view or a simple redirect with flash message.

- [ ] **Step 2: Fix routes with completely missing views**

For routes with no matching view (budgets, members, reports, notifications, settings, profile, quick-actions), change them to render a placeholder or redirect:

```javascript
// Example: change this
router.get('/budgets', authenticate, (req, res) => {
  res.render('teamLeader/budgets', { ... });
});

// To this
router.get('/budgets', authenticate, (req, res) => {
  res.render('teamLeader/dashboard', { 
    user: req.user, 
    message: 'Budgets coming soon' 
  });
});
```

- [ ] **Step 3: Verify team leader dashboard loads**

```bash
curl -s --max-time 5 http://localhost:3000/team-leader/dashboard -H "Cookie: token=YOUR_TOKEN"
```
Expected: Dashboard renders without crash.

- [ ] **Step 4: Commit**

```bash
git add routes/teamLeaderRoutes.js
git commit -m "fix: correct view paths in teamLeaderRoutes"
```

---

## Task 7: Fix teamMemberRoutes.js — View Path

**Files:**
- Modify: `routes/teamMemberRoutes.js`

- [ ] **Step 1: Fix expenses view path**

Change `teamMember/expenses` to `teamMember/expenses/index`:

```javascript
// Before
res.render('teamMember/expenses', { ... });
// After
res.render('teamMember/expenses/index', { ... });
```

- [ ] **Step 2: Commit**

```bash
git add routes/teamMemberRoutes.js
git commit -m "fix: correct view path in teamMemberRoutes"
```

---

## Task 8: Fix adminRoutes.js — View Paths

**Files:**
- Modify: `routes/adminRoutes.js`

- [ ] **Step 1: Fix missing view references**

For routes referencing non-existent views, redirect or render existing views:

| Route | Fix |
|-------|-----|
| `GET /budgets/edit/:id` | Render `admin/budgets/list` with flash |
| `GET /expenses/edit/:id` | Render `admin/expenses/list` with flash |
| `GET /teams/create` | Render `admin/teams/list` with flash |
| `GET /teams/edit/:id` | Render `admin/teams/list` with flash |
| `GET /system-settings` | Redirect to `/admin/dashboard` |
| `GET /role-management` | Redirect to `/admin/dashboard` |
| `GET /database` | Redirect to `/admin/dashboard` |

- [ ] **Step 2: Commit**

```bash
git add routes/adminRoutes.js
git commit -m "fix: handle missing views in adminRoutes with redirects"
```

---

## Task 9: Fix individualUserRoutes.js — Column Name Mismatches

**Files:**
- Modify: `routes/individualUserRoutes.js`

- [ ] **Step 1: Fix planned_expenses column names**

Find all occurrences of `planned_date` and replace with `due_date`:

```bash
grep -n "planned_date" routes/individualUserRoutes.js
```
Replace each `planned_date` with `due_date`.

- [ ] **Step 2: Fix expenses status column**

The expenses inserts that reference `status` column should work now (column added in Task 1). Verify the insert statements include the status value.

- [ ] **Step 3: Fix missing trends view reference**

Change the trends route to render an existing view:

```javascript
// Find the trends route and change the view
res.render('individualUser/analytics/dashboard', { ... });
```

- [ ] **Step 4: Remove duplicate income routes**

The inline income routes (lines 592-873) conflict with the sub-router. Remove the `router.use('/incomes', incomeRoutes)` line at the end since inline routes take precedence.

- [ ] **Step 5: Commit**

```bash
git add routes/individualUserRoutes.js
git commit -m "fix: correct column names and remove duplicate routes in individualUserRoutes"
```

---

## Task 10: Fix authController.js — Profile and Password Updates

**Files:**
- Modify: `controllers/authController.js`

- [ ] **Step 1: Implement updateProfile**

Replace the stub `updateProfile` with actual DB update:

```javascript
updateProfile: async (req, res) => {
  try {
    const { first_name, last_name, email } = req.body;
    const userId = req.user.id;
    
    await query(
      'UPDATE users SET first_name = ?, last_name = ?, email = ? WHERE id = ?',
      [first_name, last_name, email, userId]
    );
    
    res.redirect('/auth/profile?success=Profile updated');
  } catch (error) {
    console.error('Profile update error:', error);
    res.redirect('/auth/profile?error=Update failed');
  }
},
```

- [ ] **Step 2: Implement changePassword**

Replace the stub `changePassword` with actual password update:

```javascript
changePassword: async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    const userId = req.user.id;
    
    const [users] = await query('SELECT password FROM users WHERE id = ?', [userId]);
    const valid = await bcryptjs.compare(current_password, users[0].password);
    
    if (!valid) {
      return res.redirect('/auth/profile?error=Current password incorrect');
    }
    
    const hash = await bcryptjs.hash(new_password, 12);
    await query('UPDATE users SET password = ? WHERE id = ?', [hash, userId]);
    
    res.redirect('/auth/profile?success=Password changed');
  } catch (error) {
    console.error('Password change error:', error);
    res.redirect('/auth/profile?error=Change failed');
  }
},
```

- [ ] **Step 3: Commit**

```bash
git add controllers/authController.js
git commit -m "feat: implement profile update and password change"
```

---

## Task 11: Create Missing EJS Views

**Files:**
- Create: 19 EJS view files

- [ ] **Step 1: Create admin/budgets/edit.ejs**

Copy `views/admin/budgets/create.ejs` and modify to be an edit form. Change title to "Edit Budget", pre-fill fields with budget data passed from route.

- [ ] **Step 2: Create admin/expenses/edit.ejs**

Copy `views/admin/expenses/add.ejs` and modify to be an edit form.

- [ ] **Step 3: Create admin/teams/create.ejs**

Simple form with fields: name, description, team_leader_id (dropdown of users).

- [ ] **Step 4: Create admin/teams/edit.ejs**

Copy create form, pre-fill with team data.

- [ ] **Step 5: Create superAdmin/roles/add.ejs**

Form with fields: name, description.

- [ ] **Step 6: Create superAdmin/permissions/add.ejs**

Form with fields: name, description.

- [ ] **Step 7: Create superAdmin/audit-logs/details.ejs**

Display single audit log entry with all fields.

- [ ] **Step 8: Create superAdmin/profile.ejs**

Copy `views/admin/profile.ejs` and update for super admin.

- [ ] **Step 9: Create teamMember/expenses/index.ejs**

Copy `views/teamMember/expenses/index.ejs` if it exists, otherwise create simple list view.

- [ ] **Step 10: Create individualUser/analytics/trends.ejs**

Copy `views/individualUser/analytics/dashboard.ejs` and add trends-specific charts.

- [ ] **Step 11: Commit**

```bash
git add views/
git commit -m "feat: create all missing EJS view templates"
```

---

## Task 12: Update README.md

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Rewrite README**

Replace the entire README with accurate current state:

```markdown
# FinMate

A role-based financial management system for individuals and teams.

## Features

- **5-role access control:** Super Admin, Admin, Team Leader, Team Member, Individual User
- **Expense tracking:** Add, edit, delete, categorize, filter expenses
- **Budget management:** Monthly/weekly/yearly budgets with status tracking
- **Savings goals:** Track target amounts and progress
- **Income tracking:** Log and categorize income sources
- **Planned expenses:** Upcoming purchases with pending/paid/cancelled status
- **Team collaboration:** Teams with leaders, shared budgets and expenses
- **Notifications:** In-app alerts for users
- **Reports & dashboards:** Chart.js visualizations per role
- **Audit logs:** Track system changes (Super Admin)
- **System settings:** Configure app settings (Super Admin)

## Tech Stack

- **Backend:** Node.js, Express
- **Database:** MySQL (AlwaysData)
- **Auth:** JWT + bcrypt
- **Views:** EJS templates
- **Charts:** Chart.js

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

## Deployment

Set these environment variables in your hosting platform:

```
DB_HOST=mysql-sql-database.alwaysdata.net
DB_USER=sql-database
DB_PASSWORD=your_password
DB_NAME=sql-database_finmatev1
DB_PORT=3306
JWT_SECRET=your_jwt_secret
SESSION_SECRET=your_session_secret
NODE_ENV=production
```

## License

MIT
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: rewrite README with accurate current state"
```

---

## Task 13: Final Verification

- [ ] **Step 1: Start server and test health**

```bash
cd /home/derivo/Documents/projects/portfolio-polish/FinMateV2 && node server.js
```
Expected: "Server running on port 3000" with no errors.

- [ ] **Step 2: Test login flow**

Open `http://localhost:3000/auth/login` — login with `superadmin@finmate.com` / `admin123`.
Expected: Redirects to super admin dashboard.

- [ ] **Step 3: Test each role dashboard**

Login as each role and verify dashboard loads:
- `superadmin@finmate.com` → `/super-admin/dashboard`
- `admin@finmate.com` → `/admin/dashboard`
- `teamleader@finmate.com` → `/team-leader/dashboard`
- `teammember@finmate.com` → `/team-member/dashboard`
- `user1@finmate.com` → `/user/dashboard`

- [ ] **Step 4: Test CRUD operations**

- Add an expense as individual user
- Add a budget as individual user
- Add a savings goal as individual user
- Add a user as admin

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "fix: complete all fixes - schema, routes, views, dead code removal"
```

---

## Execution Order

| Task | Depends On | Estimated Time |
|------|-----------|---------------|
| Task 1: Fix DB Schema | None | 15 min |
| Task 2: Fix seed.js | Task 1 | 5 min |
| Task 3: Fix Route Bugs | None | 10 min |
| Task 4: Strip Dead Files | None | 5 min |
| Task 5: Fix superAdmin Routes | None | 10 min |
| Task 6: Fix teamLeader Views | None | 15 min |
| Task 7: Fix teamMember Views | None | 5 min |
| Task 8: Fix admin Views | None | 10 min |
| Task 9: Fix individualUser Columns | Task 1 | 15 min |
| Task 10: Fix authController | None | 10 min |
| Task 11: Create Missing Views | Task 6-9 | 30 min |
| Task 12: Update README | None | 5 min |
| Task 13: Final Verification | All | 15 min |

**Total estimated time: ~2.5 hours**
