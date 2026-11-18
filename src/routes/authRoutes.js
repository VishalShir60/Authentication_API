const express = require('express');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const { register, verifyEmail, login, logout } = require('../controllers/authController');

const router = express.Router();

// Rate limiting for authentication endpoints: 10 requests per 15 minutes per IP.
// Protects against brute-force password guessing and spam registration attacks.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  message: {
    message: 'Too many requests from this IP. Please try again after 15 minutes.',
  },
  // Skip rate limiting in automated test runs (Jest/Supertest) to avoid false test failures
  skip: () => process.env.NODE_ENV === 'test',
});

// Helper middleware to inspect express-validator results
// If any check failed, returns 400 Bad Request with a clear list of error messages
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: errors.array().map((err) => ({ field: err.path, message: err.msg })),
    });
  }
  next();
};

// Validation rules for registration
const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').trim().isEmail().withMessage('Please provide a valid email address').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  validateRequest,
];

// Validation rules for login
const loginValidation = [
  body('email').trim().isEmail().withMessage('Please provide a valid email address').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
  validateRequest,
];

// Register endpoint (rate-limited + validated)
router.post('/register', authLimiter, registerValidation, register);

// Email verification endpoint
router.get('/verify/:token', verifyEmail);

// Login endpoint (rate-limited + validated)
router.post('/login', authLimiter, loginValidation, login);

// Logout endpoint
router.post('/logout', logout);

module.exports = router;
