const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const SALT_ROUNDS = 10;
const JWT_EXPIRES = process.env.JWT_EXPIRES_IN || '7d';

function getJwtSecret() {
  const s = process.env.JWT_SECRET;
  if (!s || s.length < 16) {
    const err = new Error('JWT_SECRET must be set (min 16 chars) in .env');
    err.code = 'AUTH_CONFIG';
    throw err;
  }
  return s;
}

async function hashPassword(plain) {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

async function verifyPassword(plain, hash) {
  if (!hash) return false;
  return bcrypt.compare(plain, hash);
}

function signToken(userId) {
  return jwt.sign({ sub: String(userId) }, getJwtSecret(), {
    expiresIn: JWT_EXPIRES,
  });
}

function verifyToken(token) {
  if (!token) return null;
  try {
    const payload = jwt.verify(token, getJwtSecret());
    const id = Number(payload.sub);
    return Number.isFinite(id) && id > 0 ? id : null;
  } catch {
    return null;
  }
}

module.exports = {
  hashPassword,
  signToken,
  verifyPassword,
  verifyToken,
};
