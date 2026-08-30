// routes/teamLeaderRoutes.js
const express = require('express');
const { authenticate, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(authenticate);
router.use(authorize(['team_leader', 'admin', 'super_admin']));

// Dashboard - Render EJS template
router.get('/dashboard', (req, res) => {
  console.log('Team Leader dashboard accessed by:', req.user.email);
  
  res.render('teamLeader/dashboard', {
    title: 'Team Leader Dashboard - FinMate',
    user: req.user,
    stats: {
      activeMembers: 8,
      pendingExpenses: 3,
      totalExpenses: 24,
      totalSpent: 2890.50,
      plannedExpenses: 5
    },
    recentExpenses: [
      {
        amount: 150.00,
        description: 'Office supplies',
        category: 'Office',
        date: '2024-01-15',
        status: 'approved'
      },
      {
        amount: 89.99,
        description: 'Team lunch',
        category: 'Food',
        date: '2024-01-14',
        status: 'pending'
      },
      {
        amount: 45.50,
        description: 'Software subscription',
        category: 'Software',
        date: '2024-01-13',
        status: 'approved'
      }
    ],
    team: {
      name: 'Development Team',
      leader_name: `${req.user.first_name} ${req.user.last_name}`
    }
  });
});

// Main Pages - Render EJS templates
router.get('/teams', (req, res) => {
  res.render('teamLeader/teams/index', {
    title: 'Team Management - FinMate',
    user: req.user
  });
});

router.get('/expenses', (req, res) => {
  res.render('teamLeader/expenses/index', {
    title: 'Expense Management - FinMate',
    user: req.user
  });
});

router.get('/planned-expenses', (req, res) => {
  res.render('teamLeader/plannedExpenses/index', {
    title: 'Planned Expenses - FinMate',
    user: req.user
  });
});

router.get('/budgets', (req, res) => {
  res.redirect('/team-leader/dashboard');
});

router.get('/members', (req, res) => {
  res.redirect('/team-leader/dashboard');
});

router.get('/reports', (req, res) => {
  res.redirect('/team-leader/dashboard');
});

router.get('/notifications', (req, res) => {
  res.redirect('/team-leader/dashboard');
});

// Team management routes
router.get('/teams/edit', (req, res) => {
  res.redirect('/team-leader/teams');
});

router.post('/teams/edit', (req, res) => {
  // Handle team edit logic here
  res.redirect('/team-leader/teams?success=Team updated successfully');
});

router.get('/teams/settings', (req, res) => {
  res.redirect('/team-leader/teams');
});

// Member management routes
router.get('/members/add', (req, res) => {
  res.redirect('/team-leader/members');
});

router.post('/members/add', (req, res) => {
  // Handle member add logic here
  res.redirect('/team-leader/members?success=Member added successfully');
});

router.get('/members/edit/:id', (req, res) => {
  res.redirect('/team-leader/members');
});

router.post('/members/edit/:id', (req, res) => {
  // Handle member edit logic here
  res.redirect('/team-leader/members?success=Member updated successfully');
});

router.post('/members/remove/:id', (req, res) => {
  // Handle member remove logic here
  res.redirect('/team-leader/members?success=Member removed successfully');
});

router.get('/members/profile/:id', (req, res) => {
  res.redirect('/team-leader/members');
});

// Expense management routes
router.get('/expenses/pending', (req, res) => {
  res.redirect('/team-leader/expenses');
});

router.get('/expenses/approved', (req, res) => {
  res.redirect('/team-leader/expenses');
});

router.get('/expenses/rejected', (req, res) => {
  res.redirect('/team-leader/expenses');
});

router.get('/expenses/view/:id', (req, res) => {
  res.redirect('/team-leader/expenses');
});

router.post('/expenses/approve/:id', (req, res) => {
  // Handle expense approval logic here
  res.redirect('/team-leader/expenses?success=Expense approved');
});

router.post('/expenses/reject/:id', (req, res) => {
  // Handle expense rejection logic here
  res.redirect('/team-leader/expenses?success=Expense rejected');
});

router.post('/expenses/comment/:id', (req, res) => {
  // Handle expense comment logic here
  res.redirect(`/team-leader/expenses/view/${req.params.id}?success=Comment added`);
});

router.get('/expenses/export', (req, res) => {
  // Handle export logic here
  res.redirect('/team-leader/expenses?success=Expenses exported');
});

// Planned expenses routes
router.get('/planned-expenses/add', (req, res) => {
  res.redirect('/team-leader/planned-expenses');
});

router.post('/planned-expenses/add', (req, res) => {
  // Handle planned expense add logic here
  res.redirect('/team-leader/planned-expenses?success=Planned expense added');
});

router.get('/planned-expenses/edit/:id', (req, res) => {
  res.redirect('/team-leader/planned-expenses');
});

router.post('/planned-expenses/edit/:id', (req, res) => {
  // Handle planned expense edit logic here
  res.redirect('/team-leader/planned-expenses?success=Planned expense updated');
});

router.post('/planned-expenses/delete/:id', (req, res) => {
  // Handle planned expense delete logic here
  res.redirect('/team-leader/planned-expenses?success=Planned expense deleted');
});

router.post('/planned-expenses/approve/:id', (req, res) => {
  // Handle planned expense approval logic here
  res.redirect('/team-leader/planned-expenses?success=Planned expense approved');
});

router.get('/planned-expenses/calendar', (req, res) => {
  res.redirect('/team-leader/planned-expenses');
});

// Budget management routes
router.get('/budgets/current', (req, res) => {
  res.redirect('/team-leader/budgets');
});

router.get('/budgets/create', (req, res) => {
  res.redirect('/team-leader/budgets');
});

router.post('/budgets/create', (req, res) => {
  // Handle budget creation logic here
  res.redirect('/team-leader/budgets?success=Budget created');
});

router.get('/budgets/edit/:id', (req, res) => {
  res.redirect('/team-leader/budgets');
});

router.post('/budgets/edit/:id', (req, res) => {
  // Handle budget edit logic here
  res.redirect('/team-leader/budgets?success=Budget updated');
});

router.post('/budgets/delete/:id', (req, res) => {
  // Handle budget delete logic here
  res.redirect('/team-leader/budgets?success=Budget deleted');
});

router.get('/budgets/analytics/:id', (req, res) => {
  res.redirect('/team-leader/budgets');
});

router.get('/budgets/usage', (req, res) => {
  res.redirect('/team-leader/budgets');
});

// Reports routes
router.get('/reports/expenses', (req, res) => {
  res.redirect('/team-leader/reports');
});

router.get('/reports/budgets', (req, res) => {
  res.redirect('/team-leader/reports');
});

router.get('/reports/team-performance', (req, res) => {
  res.redirect('/team-leader/reports');
});

router.get('/reports/export/:type', (req, res) => {
  // Handle report export logic here
  res.redirect('/team-leader/reports?success=Report exported');
});

router.get('/reports/analytics', (req, res) => {
  res.redirect('/team-leader/reports');
});

// Notifications routes
router.post('/notifications/mark-read/:id', (req, res) => {
  // Handle mark as read logic here
  res.redirect('/team-leader/notifications?success=Notification marked as read');
});

router.post('/notifications/mark-all-read', (req, res) => {
  // Handle mark all as read logic here
  res.redirect('/team-leader/notifications?success=All notifications marked as read');
});

router.get('/notifications/settings', (req, res) => {
  res.redirect('/team-leader/dashboard');
});

router.post('/notifications/settings', (req, res) => {
  // Handle notification settings update logic here
  res.redirect('/team-leader/notifications/settings?success=Settings updated');
});

// Additional routes
router.get('/settings', (req, res) => {
  res.redirect('/team-leader/dashboard');
});

router.get('/profile', (req, res) => {
  res.redirect('/team-leader/dashboard');
});

router.get('/quick-actions', (req, res) => {
  res.redirect('/team-leader/dashboard');
});

// API endpoints (keep as JSON for frontend)
router.get('/api/team-stats', (req, res) => {
  res.json({ 
    active_members: 8, 
    total_expenses: 24, 
    total_spent: 2890.50, 
    pending_expenses: 3 
  });
});

router.get('/api/expense-summary', (req, res) => {
  res.json({ 
    total: 2890.50, 
    approved: 2450.25, 
    pending: 340.25, 
    rejected: 100.00 
  });
});

router.get('/api/budget-overview', (req, res) => {
  res.json({ 
    total_budgets: 5, 
    total_amount: 15000, 
    total_spent: 8900 
  });
});

router.get('/api/member-performance', (req, res) => {
  res.json([
    { name: 'John Doe', expenses: 12, amount: 1250 },
    { name: 'Jane Smith', expenses: 8, amount: 890 },
    { name: 'Mike Johnson', expenses: 4, amount: 450 }
  ]);
});

module.exports = router;