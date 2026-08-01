const userModel = require('../models/userModel');
const authService = require('../services/authService');
const { asyncHandler } = require('../middleware/errorHandler');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// bcrypt only uses the first 72 bytes of a password; reject longer instead of
// silently truncating. Name/email caps match the VARCHAR(255) columns.
const MAX_PASSWORD = 72;
const MAX_NAME = 120;
const MAX_EMAIL = 255;

function validationError(message) {
  const e = new Error(message);
  e.code = 'VALIDATION';
  return e;
}

const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body || {};
  if (typeof name !== 'string' || typeof email !== 'string' || typeof password !== 'string') {
    throw validationError('name, email, and password are required');
  }
  const cleanName = name.trim();
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanName || !cleanEmail || !password) {
    throw validationError('name, email, and password are required');
  }
  if (cleanName.length > MAX_NAME) {
    throw validationError(`name must be at most ${MAX_NAME} characters`);
  }
  if (cleanEmail.length > MAX_EMAIL || !EMAIL_RE.test(cleanEmail)) {
    throw validationError('invalid email format');
  }
  if (password.length < 8) {
    throw validationError('password must be at least 8 characters');
  }
  if (password.length > MAX_PASSWORD) {
    throw validationError(`password must be at most ${MAX_PASSWORD} characters`);
  }

  const passwordHash = await authService.hashPassword(password);
  let user;
  try {
    user = await userModel.createWithPassword({
      name: cleanName,
      email: cleanEmail,
      passwordHash,
    });
  } catch (err) {
    // Unique index on email is the source of truth — no check-then-insert race.
    if (err.code === 'ER_DUP_ENTRY') {
      const e = new Error('An account with this email already exists');
      e.code = 'CONFLICT';
      throw e;
    }
    throw err;
  }

  const token = authService.signToken(user.id);
  res.status(201).json({
    success: true,
    data: {
      token,
      user: { id: user.id, name: user.name, email: user.email },
    },
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body || {};
  if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
    throw validationError('email and password are required');
  }

  const user = await userModel.findByEmail(email.trim().toLowerCase());
  // verifyPassword runs a bcrypt compare even when the user is missing, so
  // response time doesn't reveal whether the email is registered.
  const ok = await authService.verifyPassword(password, user?.password_hash);
  if (!user || !ok) {
    const e = new Error('Invalid email or password');
    e.code = 'AUTH_INVALID';
    throw e;
  }

  const token = authService.signToken(user.id);
  res.json({
    success: true,
    data: {
      token,
      user: { id: user.id, name: user.name, email: user.email },
    },
  });
});

const me = asyncHandler(async (req, res) => {
  const user = await userModel.findById(req.userId);
  if (!user) {
    const e = new Error('User not found');
    e.code = 'NOT_FOUND';
    throw e;
  }
  res.json({
    success: true,
    data: { id: user.id, name: user.name, email: user.email },
  });
});

module.exports = { register, login, me };
