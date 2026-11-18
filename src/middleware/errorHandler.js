// Central error handling middleware.
// Having a single place for error responses ensures consistent API error formatting across all routes.
const errorHandler = (err, req, res, next) => {
  // Log server error for debugging
  console.error('API Error:', err.message);

  let statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  let message = err.message || 'Internal Server Error';

  // Handle Mongoose unique constraint violation (MongoDB error code 11000)
  if (err.code === 11000) {
    statusCode = 409;
    message = 'Duplicate field value entered. A record with this information already exists.';
  }

  // Handle Mongoose schema validation errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((val) => val.message)
      .join(', ');
  }

  // Handle invalid MongoDB ObjectId format
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid format for resource identifier.`;
  }

  res.status(statusCode).json({
    message,
    // Only reveal stack traces in development mode to prevent leaking server internals
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
