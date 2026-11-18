// GET /api/users/me
// Returns the profile of the currently authenticated user.
// req.user has already been loaded and sanitized (password excluded) by authMiddleware.
const getMe = async (req, res, next) => {
  try {
    res.status(200).json({
      message: 'Profile retrieved successfully',
      user: req.user,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMe,
};
