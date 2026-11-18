const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const swaggerUi = require('swagger-ui-express');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const errorHandler = require('./middleware/errorHandler');
const swaggerDocument = require('./docs/swagger.json');

const app = express();

// Secure HTTP response headers against common web vulnerabilities.
// We disable contentSecurityPolicy so Swagger UI's inline initialization scripts and styles can render properly.
app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);

// Enable Cross-Origin Resource Sharing so frontend clients on other origins can communicate with this API
app.use(cors());

// Parse incoming requests with JSON payloads
app.use(express.json());

// Basic health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Authentication API is running' });
});

// Interactive API Documentation via Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Authentication routes
app.use('/api/auth', authRoutes);

// User routes (protected)
app.use('/api/users', userRoutes);

// Catch-all route handler for undefined endpoints (404 Not Found)
app.use((req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
});

// Central error handling middleware (must be registered after all routes and handlers)
app.use(errorHandler);

// We export the Express app separately from server.js.
// This allows integration testing tools like Supertest to test endpoints without spinning up a live HTTP port.
module.exports = app;
