const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendVerificationEmail } = require('../utils/sendEmail');

// POST /api/auth/register
// Registers a new user, hashes their password, generates a verification token, and sends an email.
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Check if a user with this email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      // 409 Conflict: standard HTTP code when resource already exists
      return res.status(409).json({ message: 'Email is already registered' });
    }

    // Hash the password with bcrypt using 10 salt rounds
    // 10 rounds gives a strong balance between security and server computation time
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate a random, cryptographically secure 32-byte hex token for email verification
    const verifyToken = crypto.randomBytes(32).toString('hex');

    // Create the new user in MongoDB
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      verificationToken: verifyToken,
    });

    // Send the verification email (or log link to console if email creds are not set)
    await sendVerificationEmail({ email: user.email, token: verifyToken });

    // Respond with 201 Created and return user details (NEVER include password or verifyToken)
    res.status(201).json({
      message: 'Registration successful! Please check your email to verify your account.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/auth/verify/:token
// Verifies user's email address by finding the account with the matching verification token.
const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.params;

    // Search for user who has this active verification token
    const user = await User.findOne({ verificationToken: token });
    if (!user) {
      // Return 400 Bad Request if token is invalid or has already been used
      return res.status(400).json({ message: 'Invalid or expired verification token.' });
    }

    // Mark email as verified and clear the token to prevent token reuse
    user.isVerified = true;
    user.verificationToken = null;
    await user.save();

    res.status(200).json({
      message: 'Email verified successfully. You can now log in to your account.',
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/login
// Authenticates user credentials, verifies email status, and issues a signed JWT
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Check if a user with this email exists
    const user = await User.findOne({ email });
    if (!user) {
      // Security: We return the exact same generic error message whether email or password fails.
      // This prevents "user enumeration" attacks where attackers guess which accounts exist.
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check if the provided password matches the hashed password in MongoDB
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check if the user has verified their email address
    if (!user.isVerified) {
      // 403 Forbidden: user is recognized, but access is refused until verified
      return res.status(403).json({ message: 'Please verify your email address before logging in' });
    }

    // Generate a JWT with only the user ID in the payload.
    // Keeping payload small prevents token bloat and keeps private details out of the token.
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '1d', // 1 day expiry limits the window of opportunity if a token is ever stolen
    });

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/logout
// JWT is completely stateless; the server does not store session records in a database.
// Real logout happens on the client by deleting the token from localStorage/cookies.
// This endpoint provides a clean, standard contract for frontend clients.
const logout = async (req, res, next) => {
  try {
    res.status(200).json({
      message: 'Logout successful. Please remove your token from client storage.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  verifyEmail,
  login,
  logout,
};
