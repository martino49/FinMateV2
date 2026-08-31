# Self-Service Team Creation & Invite Links

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development (recommended) or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow any individual user to create a team (becoming its leader) and invite members via a shareable link — no admin intervention needed.

**Architecture:** Add `invite_token` column to teams table. Individual users get "My Team" section in sidebar. Team creation generates a unique invite URL (`/team/join/<token>`). Any logged-in user can click the link to join. Team leader can remove members. Admin/SuperAdmin retain full team management.

**Tech Stack:** Express.js, MySQL (mysql2), EJS templates, crypto (Node built-in) for token generation.

---

## Current State

- Teams are created only by Admin (`/admin/teams/create`)
- `teams` table: `id, name, description, team_leader_id, created_by`
- `users` table has `team_id` column — one team per user
- Team leader role (`team_leader`) is assigned by Admin
- Individual users have zero team-related features

## What Changes

| Area | Change |
|------|--------|
| DB schema | Add `invite_token VARCHAR(64)` to `teams` table |
| Individual user | New sidebar items: "My Team" (view), "Create Team" (if no team) |
| Invite link | `/team/join/<token>` — join page, POST to add user to team |
| Team leader | Can remove members from their team via POST |
| Admin | Still manages all teams; sees invite links too |

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `config/db.js:130-142` | Modify | Add `invite_token` column to teams table |
| `routes/individualUserRoutes.js` | Modify | Add team create/join/view routes |
| `views/individualUser/team.ejs` | Create | Team view page (members, invite link, leave) |
| `views/individualUser/create-team.ejs` | Create | Team creation form |
| `views/individualUser/join-team.ejs` | Create | Join team confirmation page |
| `views/partials/sidebar.ejs:7-60` | Modify | Add "My Team" / "Create Team" to individualUser menu |
| `routes/teamLeaderRoutes.js:55-123` | Modify | Add member removal route |
| `routes/indexRoutes.js` | Modify | Add `/team/join/<token>` public route |
| `views/index/join-team.ejs` | Create | Landing page for invite links (before login) |

---

## Task 1: Database Schema — Add invite_token to teams

**Files:**
- Modify: `config/db.js:130-142`

- [ ] **Step 1: Add invite_token column to teams table definition**

Edit `config/db.js` — in the `teams` CREATE TABLE block, add `invite_token VARCHAR(64)` column:

```javascript
    await execute(`CREATE TABLE IF NOT EXISTS teams (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      description TEXT,
      team_leader_id INT,
      created_by INT,
      invite_token VARCHAR(64),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (team_leader_id) REFERENCES users(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    )`);
```

- [ ] **Step 2: Add alter table fallback for existing databases**

After the CREATE TABLE block, add an ALTER TABLE that adds the column if it doesn't exist (for production databases that already have the table):

```javascript
    // Add invite_token to teams if missing (for existing databases)
    await addColumnIfMissing('teams', 'invite_token', 'VARCHAR(64)');
```

- [ ] **Step 3: Commit**

```bash
git add config/db.js
git commit -m "feat(db): add invite_token column to teams table"
```

---

## Task 2: Individual User — Create Team Route & View

**Files:**
- Modify: `routes/individualUserRoutes.js` (add after settings routes, before notifications)
- Create: `views/individualUser/create-team.ejs`

- [ ] **Step 1: Add crypto import at top of individualUserRoutes.js**

At the top of `routes/individualUserRoutes.js`, add:

```javascript
const crypto = require('crypto');
```

- [ ] **Step 2: Add GET /team/create route**

Add after the settings/update route in individualUserRoutes.js:

```javascript
// ======== TEAM ROUTES ========

// GET Create Team form
router.get('/team/create', asyncHandler(async (req, res) => {
  try {
    const db = require('../config/db');
    const userId = req.user.id;

    // Check if user already has a team
    const [existing] = await db.pool.execute(
      'SELECT team_id FROM users WHERE id = ?',
      [userId]
    );
    if (existing[0] && existing[0].team_id) {
      return res.redirect('/user/team');
    }

    const notificationCount = await getNotificationCount(userId);

    res.render('individualUser/create-team', {
      title: 'Create Team - FinMate',
      user: req.user,
      currentPage: 'create-team',
      notificationCount,
      error: null
    });
  } catch (error) {
    console.error('Create team form error:', error);
    res.redirect('/user/dashboard?error=Failed to load create team form');
  }
}));
```

- [ ] **Step 3: Add POST /team/create route**

Add after the GET route:

```javascript
// POST Create Team
router.post('/team/create', asyncHandler(async (req, res) => {
  try {
    const db = require('../config/db');
    const userId = req.user.id;
    const { name, description } = req.body;

    if (!name || !name.trim()) {
      const notificationCount = await getNotificationCount(userId);
      return res.render('individualUser/create-team', {
        title: 'Create Team - FinMate',
        user: req.user,
        currentPage: 'create-team',
        notificationCount,
        error: 'Team name is required'
      });
    }

    // Check if user already has a team
    const [existing] = await db.pool.execute(
      'SELECT team_id FROM users WHERE id = ?',
      [userId]
    );
    if (existing[0] && existing[0].team_id) {
      return res.redirect('/user/team');
    }

    // Generate unique invite token
    const inviteToken = crypto.randomBytes(32).toString('hex');

    // Create team
    const [result] = await db.pool.execute(
      'INSERT INTO teams (name, description, team_leader_id, created_by, invite_token) VALUES (?, ?, ?, ?, ?)',
      [name.trim(), description || '', userId, userId, inviteToken]
    );

    const teamId = result.insertId;

    // Update user: set team_id and role to team_leader
    // First get the team_leader role_id
    const [roles] = await db.pool.execute(
      "SELECT id FROM roles WHERE name = 'team_leader'"
    );
    const teamLeaderRoleId = roles[0] ? roles[0].id : req.user.role_id;

    await db.pool.execute(
      'UPDATE users SET team_id = ?, role_id = ? WHERE id = ?',
      [teamId, teamLeaderRoleId, userId]
    );

    res.redirect('/user/team');
  } catch (error) {
    console.error('Create team error:', error);
    res.redirect('/user/team/create?error=Failed to create team');
  }
}));
```

- [ ] **Step 4: Add GET /team route (view my team)**

Add after the POST route:

```javascript
// GET My Team
router.get('/team', asyncHandler(async (req, res) => {
  try {
    const db = require('../config/db');
    const userId = req.user.id;

    // Get user's team
    const [users] = await db.pool.execute(
      'SELECT team_id FROM users WHERE id = ?',
      [userId]
    );

    if (!users[0] || !users[0].team_id) {
      return res.redirect('/user/team/create');
    }

    const teamId = users[0].team_id;

    // Get team details
    const [teams] = await db.pool.execute(
      `SELECT t.*, u.first_name as leader_first_name, u.last_name as leader_last_name, u.email as leader_email
       FROM teams t
       LEFT JOIN users u ON t.team_leader_id = u.id
       WHERE t.id = ?`,
      [teamId]
    );

    if (!teams[0]) {
      return res.redirect('/user/team/create');
    }

    // Get team members
    const [members] = await db.pool.execute(
      `SELECT u.id, u.username, u.first_name, u.last_name, u.email, u.created_at,
              r.name as role_name
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       WHERE u.team_id = ?
       ORDER BY u.created_at ASC`,
      [teamId]
    );

    // Check if current user is leader
    const isLeader = teams[0].team_leader_id === userId;

    // Build invite link
    const inviteLink = `${req.protocol}://${req.get('host')}/team/join/${teams[0].invite_token}`;

    const notificationCount = await getNotificationCount(userId);

    res.render('individualUser/team', {
      title: 'My Team - FinMate',
      user: req.user,
      currentPage: 'team',
      team: teams[0],
      members,
      isLeader,
      inviteLink,
      notificationCount,
      success: req.query.success || null,
      error: req.query.error || null
    });
  } catch (error) {
    console.error('View team error:', error);
    res.redirect('/user/dashboard?error=Failed to load team');
  }
}));
```

- [ ] **Step 5: Add POST /team/leave route**

Add after the GET /team route:

```javascript
// POST Leave Team
router.post('/team/leave', asyncHandler(async (req, res) => {
  try {
    const db = require('../config/db');
    const userId = req.user.id;

    const [users] = await db.pool.execute(
      'SELECT team_id, role_id FROM users WHERE id = ?',
      [userId]
    );

    if (!users[0] || !users[0].team_id) {
      return res.redirect('/user/dashboard');
    }

    // Leaders cannot leave — must delete team or transfer leadership
    const [team] = await db.pool.execute(
      'SELECT team_leader_id FROM teams WHERE id = ?',
      [users[0].team_id]
    );

    if (team[0] && team[0].team_leader_id === userId) {
      return res.redirect('/user/team?error=Team leaders cannot leave. Delete the team or transfer leadership first.');
    }

    // Remove user from team
    await db.pool.execute(
      'UPDATE users SET team_id = NULL WHERE id = ?',
      [userId]
    );

    res.redirect('/user/dashboard?success=You have left the team');
  } catch (error) {
    console.error('Leave team error:', error);
    res.redirect('/user/team?error=Failed to leave team');
  }
}));
```

- [ ] **Step 6: Add POST /team/delete route (leader only)**

Add after the leave route:

```javascript
// POST Delete Team (leader only)
router.post('/team/delete', asyncHandler(async (req, res) => {
  try {
    const db = require('../config/db');
    const userId = req.user.id;

    const [users] = await db.pool.execute(
      'SELECT team_id FROM users WHERE id = ?',
      [userId]
    );

    if (!users[0] || !users[0].team_id) {
      return res.redirect('/user/dashboard');
    }

    const teamId = users[0].team_id;

    // Verify user is the leader
    const [team] = await db.pool.execute(
      'SELECT team_leader_id FROM teams WHERE id = ?',
      [teamId]
    );

    if (!team[0] || team[0].team_leader_id !== userId) {
      return res.redirect('/user/team?error=Only the team leader can delete the team');
    }

    // Remove all members from team
    await db.pool.execute('UPDATE users SET team_id = NULL WHERE team_id = ?', [teamId]);

    // Delete team
    await db.pool.execute('DELETE FROM teams WHERE id = ?', [teamId]);

    res.redirect('/user/dashboard?success=Team deleted successfully');
  } catch (error) {
    console.error('Delete team error:', error);
    res.redirect('/user/team?error=Failed to delete team');
  }
}));
```

- [ ] **Step 7: Create create-team.ejs view**

Create `views/individualUser/create-team.ejs` with the standard layout, a form with team name and description fields, and a submit button. Use the existing CSS patterns from other individualUser views.

- [ ] **Step 8: Create team.ejs view**

Create `views/individualUser/team.ejs` showing:
- Team name and description
- Invite link with copy button
- Members list with roles
- Remove member button (for leader)
- Leave team button (for non-leaders)
- Delete team button (for leader)

- [ ] **Step 9: Commit**

```bash
git add routes/individualUserRoutes.js views/individualUser/create-team.ejs views/individualUser/team.ejs
git commit -m "feat: individual user team creation and management"
```

---

## Task 3: Sidebar — Add Team Menu Items for Individual User

**Files:**
- Modify: `views/partials/sidebar.ejs:7-60`

- [ ] **Step 1: Add team menu items to individual_user sidebar**

In the `menus` object in sidebar.ejs, find the `individual_user` array and add team items after the existing items:

```javascript
        individual_user: [
            { section: 'Finance' },
            { label: 'Dashboard', icon: 'fa-tachometer-alt', href: '/user/dashboard', page: 'dashboard' },
            // ... existing items ...
            { label: 'Settings', icon: 'fa-cog', href: '/user/settings', page: 'settings' },
            { section: 'Team' },
            { label: 'My Team', icon: 'fa-users', href: '/user/team', page: 'team' },
            { label: 'Create Team', icon: 'fa-plus-circle', href: '/user/team/create', page: 'create-team' },
            { section: 'Account' },
            { label: 'Profile', icon: 'fa-user-circle', href: '/user/profile', page: 'profile' },
            { label: 'Notifications', icon: 'fa-bell', href: '/user/notifications', page: 'notifications', badge: notifCount > 0 ? notifCount : null },
        ],
```

- [ ] **Step 2: Commit**

```bash
git add views/partials/sidebar.ejs
git commit -m "feat: add team menu items to individual user sidebar"
```

---

## Task 4: Join Team Route — Public Invite Link

**Files:**
- Modify: `routes/indexRoutes.js`
- Create: `views/index/join-team.ejs`

- [ ] **Step 1: Add GET /team/join/:token route to indexRoutes**

In `routes/indexRoutes.js`, add:

```javascript
const crypto = require('crypto');

// GET Join Team via invite link
router.get('/team/join/:token', async (req, res) => {
  try {
    const db = require('../config/db');
    const { token } = req.params;

    // Find team by invite token
    const [teams] = await db.pool.execute(
      `SELECT t.id, t.name, t.description,
              u.first_name as leader_first_name, u.last_name as leader_last_name
       FROM teams t
       LEFT JOIN users u ON t.team_leader_id = u.id
       WHERE t.invite_token = ?`,
      [token]
    );

    if (!teams[0]) {
      return res.render('index/join-team', {
        title: 'Invalid Invite - FinMate',
        team: null,
        error: 'This invite link is invalid or has expired.',
        user: req.user || null
      });
    }

    // Check if user is already in this team
    let alreadyMember = false;
    if (req.user) {
      const [users] = await db.pool.execute(
        'SELECT team_id FROM users WHERE id = ?',
        [req.user.id]
      );
      alreadyMember = users[0] && users[0].team_id === teams[0].id;
    }

    res.render('index/join-team', {
      title: `Join ${teams[0].name} - FinMate`,
      team: teams[0],
      error: null,
      alreadyMember,
      user: req.user || null
    });
  } catch (error) {
    console.error('Join team page error:', error);
    res.render('index/join-team', {
      title: 'Error - FinMate',
      team: null,
      error: 'Something went wrong. Please try again.',
      user: req.user || null
    });
  }
});

// POST Join Team
router.post('/team/join/:token', async (req, res) => {
  try {
    const db = require('../config/db');
    const { token } = req.params;

    // Must be logged in
    if (!req.user) {
      return res.redirect(`/auth/login?redirect=/team/join/${token}`);
    }

    // Find team
    const [teams] = await db.pool.execute(
      'SELECT id, name FROM teams WHERE invite_token = ?',
      [token]
    );

    if (!teams[0]) {
      return res.render('index/join-team', {
        title: 'Invalid Invite - FinMate',
        team: null,
        error: 'This invite link is invalid or has expired.',
        user: req.user
      });
    }

    const teamId = teams[0].id;

    // Check if already in this team
    const [users] = await db.pool.execute(
      'SELECT team_id FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users[0] && users[0].team_id === teamId) {
      return res.redirect('/user/team');
    }

    // Check if already in another team
    if (users[0] && users[0].team_id) {
      return res.redirect(`/team/join/${token}?error=You are already in another team. Leave it first to join this one.`);
    }

    // Add user to team
    await db.pool.execute(
      'UPDATE users SET team_id = ? WHERE id = ?',
      [teamId, req.user.id]
    );

    res.redirect('/user/team?success=You joined ' + encodeURIComponent(teams[0].name) + '!');
  } catch (error) {
    console.error('Join team error:', error);
    res.redirect(`/team/join/${req.params.token}?error=Failed to join team`);
  }
});
```

- [ ] **Step 2: Create join-team.ejs view**

Create `views/index/join-team.ejs` — a standalone page (no sidebar) showing:
- Team name and description
- Leader name
- "Join this team" button (if logged in and not already member)
- "Log in to join" link (if not logged in)
- "You're already a member" message (if already in team)
- Error message display

- [ ] **Step 3: Commit**

```bash
git add routes/indexRoutes.js views/index/join-team.ejs
git commit -m "feat: public team invite link with join flow"
```

---

## Task 5: Team Leader — Remove Members Route

**Files:**
- Modify: `routes/teamLeaderRoutes.js:55-123`

- [ ] **Step 1: Add POST /teams/:teamId/remove-member route**

In `routes/teamLeaderRoutes.js`, after the teams GET route, add:

```javascript
// POST Remove member from team
router.post('/teams/:teamId/remove-member', async (req, res) => {
  try {
    const db = require('../config/db');
    const { teamId } = req.params;
    const { member_id } = req.body;
    const leaderId = req.user.userId || req.user.id;

    // Verify the leader owns this team
    const [team] = await db.pool.execute(
      'SELECT team_leader_id FROM teams WHERE id = ?',
      [teamId]
    );

    if (!team[0] || team[0].team_leader_id !== leaderId) {
      return res.redirect('/team-leader/teams?error=You can only manage your own team');
    }

    // Cannot remove yourself
    if (parseInt(member_id) === leaderId) {
      return res.redirect('/team-leader/teams?error=You cannot remove yourself from the team');
    }

    // Remove member
    await db.pool.execute(
      'UPDATE users SET team_id = NULL WHERE id = ? AND team_id = ?',
      [member_id, teamId]
    );

    res.redirect('/team-leader/teams?success=Member removed successfully');
  } catch (error) {
    console.error('Remove member error:', error);
    res.redirect('/team-leader/teams?error=Failed to remove member');
  }
});
```

- [ ] **Step 2: Commit**

```bash
git add routes/teamLeaderRoutes.js
git commit -m "feat: team leader can remove members"
```

---

## Task 6: Admin — Show Invite Link in Team Management

**Files:**
- Modify: `routes/adminRoutes.js:969-996` (teams create/edit)
- Modify: `views/admin/teams/list.ejs`

- [ ] **Step 1: Update admin team creation to generate invite_token**

In `routes/adminRoutes.js`, find the POST `/teams/create` route and update the INSERT to include invite_token:

```javascript
const crypto = require('crypto');
// In the POST /teams/create handler:
const inviteToken = crypto.randomBytes(32).toString('hex');
await db.pool.execute(
  'INSERT INTO teams (name, description, team_leader_id, created_by, invite_token) VALUES (?, ?, ?, ?, ?)',
  [name, description, team_leader_id || null, req.user.id, inviteToken]
);
```

- [ ] **Step 2: Update admin team edit to preserve invite_token**

The edit route should not overwrite invite_token. Verify the UPDATE query doesn't clear it.

- [ ] **Step 3: Update teams list view to show invite link**

In `views/admin/teams/list.ejs`, add an "Invite Link" column showing the link with a copy button for each team.

- [ ] **Step 4: Commit**

```bash
git add routes/adminRoutes.js views/admin/teams/list.ejs
git commit -m "feat: admin team creation generates invite link"
```

---

## Task 7: Update Sidebar — Conditional Create Team Visibility

**Files:**
- Modify: `views/partials/sidebar.ejs`

- [ ] **Step 1: Hide "Create Team" if user already has a team**

In the sidebar template, wrap the "Create Team" menu item in a conditional:

```ejs
<% if (userRole === 'individual_user' && (!user || !user.team_id)) { %>
    { label: 'Create Team', icon: 'fa-plus-circle', href: '/user/team/create', page: 'create-team' },
<% } %>
```

Note: The sidebar uses a JS menus object, so the conditional needs to be applied differently — filter the menus array after construction based on the user's team_id. Alternatively, pass `user.team_id` to the sidebar and filter in the EJS template.

- [ ] **Step 2: Commit**

```bash
git add views/partials/sidebar.ejs
git commit -m "feat: conditionally show Create Team in sidebar"
```

---

## Task 8: Test & Verify

- [ ] **Step 1: Start server and test individual user flow**

```bash
cd FinMateV2 && node server.js
```

Test in browser:
1. Login as `user1@finmate.com` / `password123`
2. See "My Team" and "Create Team" in sidebar
3. Click "Create Team", enter name, submit
4. Redirected to team page with invite link
5. Copy invite link, open in incognito (different user)
6. Login as different user, click "Join this team"
7. Verify both users now in same team

- [ ] **Step 2: Test team leader features**

1. As team leader, see members list
2. Remove a member — verify they're removed
3. Delete team — verify all members removed

- [ ] **Step 3: Run route tests**

```bash
node scripts/test-routes.js
```

- [ ] **Step 4: Commit any fixes**

---

## Task 9: Update Documentation

- [ ] **Step 1: Update FEATURES-BY-ROLE.md**

Add team creation/invite section to Individual User features.

- [ ] **Step 2: Update README.md**

Add team invite feature to the overview.

- [ ] **Step 3: Commit**

```bash
git add docs/FEATURES-BY-ROLE.md README.md
git commit -m "docs: document team creation and invite feature"
```
