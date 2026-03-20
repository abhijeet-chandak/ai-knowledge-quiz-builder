const userModel = require('../models/userModel');
const authService = require('../services/authService');
const { asyncHandler } = require('../middleware/errorHandler');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name?.trim() || !email?.trim() || !password) {
    const e = new Error('name, email, and password are required');
    e.code = 'VALIDATION';
    throw e;
  }
  if (password.length < 8) {
    const e = new Error('password must be at least 8 characters');
    e.code = 'VALIDATION';
    throw e;
  }
  if (!EMAIL_RE.test(email.trim())) {
    const e = new Error('invalid email format');
    e.code = 'VALIDATION';
    throw e;
  }

  const existing = await userModel.findByEmail(email.trim().toLowerCase());
  if (existing) {
    const e = new Error('An account with this email already exists');
    e.code = 'CONFLICT';
    throw e;
  }

  const passwordHash = await authService.hashPassword(password);
  const user = await userModel.createWithPassword({
    name: name.trim(),
    email: email.trim().toLowerCase(),
    passwordHash,
  });

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
  if (!email?.trim() || !password) {
    const e = new Error('email and password are required');
    e.code = 'VALIDATION';
    throw e;
  }

  const user = await userModel.findByEmail(email.trim().toLowerCase());
  if (!user || !user.password_hash) {
    const e = new Error('Invalid email or password');
    e.code = 'AUTH_INVALID';
    throw e;
  }

  const ok = await authService.verifyPassword(password, user.password_hash);
  if (!ok) {
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
