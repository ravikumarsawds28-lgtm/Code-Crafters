const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/db');
const { JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// 1. POST /auth/register — body: {name, email, password} -> 201 {UserID, token}; error: 409 if email exists
router.post('/register', async (req, res) => {
  const { name, email, password, height_cm, date_of_birth } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }

  try {
    const password_hash = await bcrypt.hash(password, 10);
    const result = await query(
      `INSERT INTO "User" ("name", "email", "password_hash", "height_cm", "date_of_birth")
       VALUES ($1, $2, $3, $4, $5)
       RETURNING "UserID"`,
      [name, email.toLowerCase().trim(), password_hash, height_cm || null, date_of_birth || null]
    );

    const UserID = result.rows[0].UserID;
    const token = jwt.sign({ UserID, email: email.toLowerCase().trim() }, JWT_SECRET, { expiresIn: '7d' });

    return res.status(201).json({ UserID, token });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Email already exists' });
    }
    console.error('Register error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// 2. POST /auth/login — body: {email, password} -> 200 {token}; error: 401 invalid credentials
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  try {
    const result = await query(
      `SELECT "UserID", "email", "password_hash" FROM "User" WHERE "email" = $1`,
      [email.toLowerCase().trim()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ UserID: user.UserID, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    return res.status(200).json({ token });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
