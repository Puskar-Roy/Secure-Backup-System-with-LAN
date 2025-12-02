// receiver/server.js
// Refactored backup receiver HTTP server
// Usage: node server.js [PORT]

const express = require('express');
const session = require('express-session');
const path = require('path');

// Configuration
const sessionConfig = require('./config/session');
const { initStorage } = require('./utils/storage');

// Routes
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const apiRoutes = require('./routes/api');
const backupRoutes = require('./routes/backup');
const explorerRoutes = require('./routes/explorer');
const filesystemRoutes = require('./routes/filesystem');

// Initialize app
const app = express();

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Session middleware
app.use(session(sessionConfig));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Initialize storage
initStorage();

// Root route
app.get('/', (req, res) => {
  if (req.session && req.session.authenticated) {
    res.redirect('/admin');
  } else {
    res.redirect('/login');
  }
});

// Mount routes
app.use('/', authRoutes);      // /login, /api/login, /api/logout, /api/change-password
app.use('/', adminRoutes);     // /admin
app.use('/api', apiRoutes);    // /api/stats, /api/config, etc.
app.use('/', backupRoutes);    // /init-backup, /upload-file, /commit-version, etc.
app.use('/', explorerRoutes);  // /explorer, /browse, /list, /file, /search, etc.
app.use('/api', filesystemRoutes); // /api/browse-folders, /api/get-drives

// Start server
const port = process.argv[2] ? parseInt(process.argv[2], 10) : 8080;
app.listen(port, () => {
  console.log(`Backup Receiver listening on port ${port}`);
  console.log(`Admin panel: http://localhost:${port}/admin`);
  console.log(`Explorer: http://localhost:${port}/explorer`);
});
