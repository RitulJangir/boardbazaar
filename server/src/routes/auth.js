const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../db');
const { signToken, requireAuth } = require('../middleware/auth');

const router = express.Router();

function publicUser(u) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    company: u.company || '',
    created_at: u.created_at
  };
}

router.post('/register', async (req, res, next) => {
  try {
    const { name, email, phone, company, password } = req.body;
    if (!name || !email || !phone || !password) {
      return res.status(400).json({ error: 'Name, email, phone, and password are required.' });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }
    const existing = await db.findUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }
    const password_hash = await bcrypt.hash(password, 10);
    const user = await db.createUser({
      id: `user-${uuidv4().slice(0, 8)}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      company: (company || '').trim(),
      password_hash,
      created_at: new Date().toISOString()
    });
    const token = signToken(user);
    res.status(201).json({ token, user: publicUser(user) });
  } catch (err) {
    next(err);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }
    const user = await db.findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }
    const token = signToken(user);
    res.json({ token, user: publicUser(user) });
  } catch (err) {
    next(err);
  }
});

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await db.findUserById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json({ user: publicUser(user) });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
