require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const fs = require('fs');
const db = require('./config/db');
const { apiLimiter, authLimiter, sanitizeInput, extraHeaders } = require('./middlewares/securityMiddleware');

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));
app.use(cors());
app.use(extraHeaders);
app.use(morgan('combined'));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

// Sanitize input only on mutation routes (POST/PUT/DELETE)
app.use((req, res, next) => {
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    sanitizeInput(req, res, next);
  } else {
    next();
  }
});
app.use(session({
  secret: process.env.SESSION_SECRET || process.env.JWT_SECRET || 'change-me-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax'
  }
}));

// Rate limiting (broad API protection only)
app.use('/api/', apiLimiter);

// Compression
app.use(compression());

// Static files with caching headers
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0,
  etag: true,
  lastModified: true,
}));

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Global variables
app.use((req, res, next) => {
  res.locals.appName = process.env.APP_NAME || 'FinMate';
  res.locals.currentPath = req.path;
  next();
});

// Load routes
app.use('/auth', require('./routes/authRoutes'));
app.use('/super-admin', require('./routes/superAdminRoutes'));
app.use('/admin', require('./routes/adminRoutes'));
app.use('/team-leader', require('./routes/teamLeaderRoutes'));
app.use('/team-member', require('./routes/teamMemberRoutes'));
app.use('/user', require('./routes/individualUserRoutes'));
app.use('/', require('./routes/indexRoutes'));

// Health check
app.get('/health', (req, res) => res.json({
  status: 'OK',
  timestamp: new Date().toISOString(),
  message: 'Server is running correctly'
}));

// 404 fallback
app.use((req, res) => {
  console.warn('404:', req.method, req.url);
  res.status(404).render('404', { title: 'Page Not Found', requestedUrl: req.url });
});

// Catch unhandled errors so server doesn't crash silently
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('UNHANDLED REJECTION:', reason);
});

// Port binding
const PORT = process.env.PORT || 3000;

// Log environment
console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`DB Host: ${process.env.DB_HOST || 'localhost'}`);

// Start server
const server = app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);

  // Attempt DB connection in the background
  try {
    const connected = await db.testConnection();
    if (connected) {
      console.log('Database connection test successful');
    } else {
      console.warn('Database connection test failed - some features may not work');
    }

    // Only init if explicitly requested (skip by default to avoid crashing server on slow remote DB)
    if (process.env.INIT_DB === 'true') {
      await db.initDatabase();
      console.log('Database initialized');
    } else {
      console.log('Database init skipped (set INIT_DB=true to enable)');
    }
  } catch (err) {
    console.error('Post-startup DB check failed:', err.message);
  }
});

module.exports = app;
