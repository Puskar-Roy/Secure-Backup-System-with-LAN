const express = require('express');
const router = express.Router();
const { requireAuthHTML } = require('../middleware/auth');

// Admin panel
router.get('/admin', requireAuthHTML, (req, res) => {
  res.render('admin', { username: req.session.username });
});

module.exports = router;
