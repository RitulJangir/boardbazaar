const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'boardbazaar_dev_secret_change_me';

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name, phone: user.phone },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'Please log in to continue.' });
  }
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    return next();
  } catch {
    return res.status(401).json({ error: 'Session expired. Please log in again.' });
  }
}

module.exports = { signToken, requireAuth };
