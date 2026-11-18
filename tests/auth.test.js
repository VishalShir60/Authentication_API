require('dotenv').config();
const os = require('os');
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/User');

// Set NODE_ENV to test to skip rate limiters and log output
process.env.NODE_ENV = 'test';

describe('Authentication API Integration Tests', () => {
  const testUser = {
    name: 'Fresher Developer',
    email: 'fresher.dev@example.com',
    password: 'Password123!',
  };

  let verificationToken = '';
  let authToken = '';

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI, {
      runtimeAdapters: { os },
    });
    // Ensure clean state before running test suite
    await User.deleteMany({ email: testUser.email });
  });

  afterAll(async () => {
    // Clean up test data and close the database connection
    await User.deleteMany({ email: testUser.email });
    await mongoose.connection.close();
  });

  // 1. Successful user registration
  test('1. POST /api/auth/register - Should register a new user successfully', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('message');
    expect(res.body.user).toHaveProperty('id');
    expect(res.body.user.email).toBe(testUser.email.toLowerCase());
    expect(res.body.user.isVerified).toBe(false);
    // Security check: password must never be returned in the response
    expect(res.body.user.password).toBeUndefined();

    // Query user in MongoDB to retrieve the generated verification token for subsequent tests
    const savedUser = await User.findOne({ email: testUser.email });
    expect(savedUser).not.toBeNull();
    expect(savedUser.verificationToken).toBeDefined();
    verificationToken = savedUser.verificationToken;
  });

  // 2. Reject duplicate email registration
  test('2. POST /api/auth/register - Should reject duplicate email with 409 Conflict', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(res.status).toBe(409);
    expect(res.body.message).toBe('Email is already registered');
  });

  // 3. Login attempt before email verification
  test('3. POST /api/auth/login - Should fail with 403 Forbidden before email verification', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      });

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/verify your email/i);
  });

  // 4. Email verification
  test('4. GET /api/auth/verify/:token - Should verify email and clear verification token', async () => {
    const res = await request(app).get(`/api/auth/verify/${verificationToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/email verified successfully/i);

    // Verify database state has updated
    const verifiedUser = await User.findOne({ email: testUser.email });
    expect(verifiedUser.isVerified).toBe(true);
    expect(verifiedUser.verificationToken).toBeNull();
  });

  // 5. Successful login after verification
  test('5. POST /api/auth/login - Should login successfully and return a signed JWT', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.email).toBe(testUser.email.toLowerCase());
    expect(res.body.user.isVerified).toBe(true);

    authToken = res.body.token;
  });

  // 6. Protected route without token
  test('6. GET /api/users/me - Should reject request without token with 401 Unauthorized', async () => {
    const res = await request(app).get('/api/users/me');

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/access denied/i);
  });

  // 7. Protected route with valid token
  test('7. GET /api/users/me - Should return user profile when valid token is provided', async () => {
    const res = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('user');
    expect(res.body.user.email).toBe(testUser.email.toLowerCase());
    expect(res.body.user.password).toBeUndefined();
  });
});
