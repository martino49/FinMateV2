const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { validate } = require('../middlewares/validateMiddleware');
const { authenticate } = require('../middlewares/authMiddleware');
const { authLimiter } = require('../middlewares/securityMiddleware');

const router = express.Router();

// Login routes
router.get('/login', authController.getLogin);
router.post('/login', authController.postLogin);

// Register routes
router.get('/register', authController.getRegister);
router.post(
  '/register',
  [
    body('username').isLength({ min: 3 }).trim().escape(),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('first_name').notEmpty().trim().escape(),
    body('last_name').notEmpty().trim().escape()
  ],
  validate([
    body('username').isLength({ min: 3 }).trim().escape(),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('first_name').notEmpty().trim().escape(),
    body('last_name').notEmpty().trim().escape()
  ]),
  authController.postRegister
);

// Logout route
router.get('/logout', authenticate, authController.logout);
router.post('/logout', authenticate, authController.logout);



// Profile routes
router.get('/profile', authenticate, authController.getProfile);
router.post('/profile', authenticate, authController.updateProfile);
router.post('/change-password', authenticate, authController.changePassword);

// Walkthrough status routes
router.get('/walkthrough-status', authenticate, async (req, res) => {
  try {
    const db = require('../config/db');
    const rows = await db.execute(
      `SELECT setting_value FROM user_settings WHERE user_id = ? AND setting_key = 'walkthrough_completed'`,
      [req.user.id]
    );
    const result = Array.isArray(rows) ? rows : (rows[0] || []);
    const completed = result.length > 0 && result[0].setting_value === '1';
    res.json({ completed });
  } catch (err) {
    res.json({ completed: false });
  }
});

router.post('/walkthrough-complete', authenticate, async (req, res) => {
  try {
    const db = require('../config/db');
    await db.execute(
      `INSERT INTO user_settings (user_id, setting_key, setting_value) VALUES (?, 'walkthrough_completed', '1') ON DUPLICATE KEY UPDATE setting_value = '1', updated_at = NOW()`,
      [req.user.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.json({ success: false });
  }
});

module.exports = router;
