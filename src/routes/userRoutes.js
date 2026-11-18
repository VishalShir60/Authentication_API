const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { getMe } = require('../controllers/userController');

const router = express.Router();

// GET /api/users/me (Protected route)
router.get('/me', authMiddleware, getMe);

module.exports = router;
