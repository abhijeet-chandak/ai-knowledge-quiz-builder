const { query } = require('../config/db');

async function findByEmail(email) {
  const rows = await query(
    'SELECT id, name, email, password_hash FROM users WHERE email = ? LIMIT 1',
    [email]
  );
  return rows[0] || null;
}

async function findById(id) {
  const rows = await query(
    'SELECT id, name, email, created_at FROM users WHERE id = ?',
    [id]
  );
  return rows[0] || null;
}

async function createWithPassword({ name, email, passwordHash }) {
  const result = await query(
    'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
    [name, email, passwordHash]
  );
  return { id: result.insertId, name, email };
}

module.exports = { createWithPassword, findByEmail, findById };
