const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const { getConfig, saveConfig } = require('../utils/storage');
const { requireAuth } = require('../middleware/auth');

// Login page
router.get('/login', (req, res) => {
  if (req.session && req.session.authenticated) {
    return res.redirect('/admin');
  }
  res.render('login');
});

// Login API
router.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const config = getConfig();
  
  if (username === config.username && bcrypt.compareSync(password, config.passwordHash)) {
    req.session.authenticated = true;
    req.session.username = username;
    res.json({ success: true });
  } else {
    res.json({ success: false, error: 'Invalid username or password' });
  }
});

// Logout API
router.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

// Change password API
router.post('/api/change-password', requireAuth, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const config = getConfig();
  
  if (!bcrypt.compareSync(currentPassword, config.passwordHash)) {
    return res.json({ success: false, error: 'Current password is incorrect' });
  }
  
  config.passwordHash = bcrypt.hashSync(newPassword, 10);
  saveConfig();
  res.json({ success: true });
});

module.exports = router;
