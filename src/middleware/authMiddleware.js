const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to protect routes that require authentication.
// It verifies the incoming JWT and attaches the authenticated user object to req.user.
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // Check if the Authorization header exists and follows the "Bearer <token>" convention
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // 401 Unauthorized: client lacks valid authentication credentials
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    // Extract token string after "Bearer "
    const token = authHeader.split(' ')[1];

    // Verify token validity and expiration
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch user from DB using the ID encoded in the JWT payload.
    // .select('-password') ensures the password hash is excluded from memory and responses
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'User belonging to this token no longer exists.' });
    }

    // Attach user to the request object so downstream controllers can access it directly
    req.user = user;
    next();
  } catch (error) {
    // Catch token errors (e.g. invalid signature, malformed token, or expired token)
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
};

module.exports = authMiddleware;
