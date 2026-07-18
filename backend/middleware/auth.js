const jwt = require('jsonwebtoken');
const { User } = require('../models');

/**
 * Middleware to authenticate requests via JWT token
 */
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'Invalid token. User not found.' });
    }
    if (user.isArchived) {
      return res.status(403).json({ message: 'This account has been deactivated.' });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired token.' });
  }
};

/**
 * Middleware factory to restrict access to specific roles
 * @param {...string} roles - Allowed roles
 */
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied. This route requires one of these roles: ${roles.join(', ')}`
      });
    }
    next();
  };
};

module.exports = { authenticateToken, authorizeRoles };
