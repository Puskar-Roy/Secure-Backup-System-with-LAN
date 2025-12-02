// Auth middleware for API routes
function requireAuth(req, res, next) {
  if (req.session && req.session.authenticated) {
    return next();
  }
  res.status(401).json({ error: 'Authentication required' });
}

// Auth middleware for HTML pages
function requireAuthHTML(req, res, next) {
  if (req.session && req.session.authenticated) {
    return next();
  }
  res.redirect('/login');
}

module.exports = {
  requireAuth,
  requireAuthHTML
};
