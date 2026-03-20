const authService = require('../services/authService');

/**
 * Requires `Authorization: Bearer <jwt>`. Sets req.userId.
 */
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : null;
  const userId = authService.verifyToken(token);

  if (!userId) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Sign in required. Send a valid Bearer token.',
      },
    });
  }

  req.userId = userId;
  next();
}

module.exports = { requireAuth };
