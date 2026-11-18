# Authentication API 

A clean, production-ready, RESTful Authentication & User Management API built with **Node.js**, **Express.js**, **MongoDB (Mongoose)**, **JWT**, **Bcrypt**, and **Nodemailer**.

---

## 📌 What This Project Is and Why I Built It

As a final-year computer science student preparing for backend engineering interviews, I built this project to master real-world authentication patterns. While many tutorials take shortcuts (like storing plain passwords, skipping email verification, or writing messy monolithic code), this project implements:
- Cryptographic password hashing with salted bcrypt rounds.
- Real token-based email activation workflow.
- Stateless authentication using JSON Web Tokens (JWT).
- Route protection with custom Express middleware.
- Defense-in-depth security basics (rate limiting, helmet headers, input sanitization).
- Centralized error handling and automated integration tests.

---

## 🛠 Tech Stack

- **Runtime Environment:** Node.js (v20+)
- **Web Framework:** Express.js (v5)
- **Database & ODM:** MongoDB & Mongoose
- **Password Security:** Bcrypt.js
- **Token Mechanism:** JSON Web Tokens (`jsonwebtoken`)
- **Email Service:** Nodemailer (Gmail SMTP + local console fallback)
- **Validation:** `express-validator`
- **Security:** `helmet`, `cors`, `express-rate-limit`
- **API Documentation:** Swagger UI (`swagger-ui-express`)
- **Automated Testing:** Jest & Supertest
- **Containerization:** Docker & Docker Compose

---

## 📂 Project Structure

```text
auth-api/
├── src/
│   ├── config/
│   │   └── db.js                    # MongoDB connection logic using Mongoose
│   ├── models/
│   │   └── User.js                  # User schema with validation, defaults, and timestamps
│   ├── controllers/
│   │   ├── authController.js        # Controller for register, verifyEmail, login, logout
│   │   └── userController.js        # Controller for protected user profile (getMe)
│   ├── middleware/
│   │   ├── authMiddleware.js        # JWT verification middleware protecting private routes
│   │   └── errorHandler.js          # Central error handling middleware for uniform responses
│   ├── routes/
│   │   ├── authRoutes.js            # Express router for authentication endpoints + validators
│   │   └── userRoutes.js            # Express router for user profile endpoints
│   ├── utils/
│   │   └── sendEmail.js             # Nodemailer helper with automatic local dev fallback
│   ├── docs/
│   │   └── swagger.json             # OpenAPI 3.0 specification for Swagger UI
│   └── app.js                       # Express app configuration (middleware, routes, error handling)
├── tests/
│   └── auth.test.js                 # Automated Jest + Supertest integration test suite
├── server.js                        # Application entrypoint that connects DB and starts server
├── postman_collection.json          # Pre-configured Postman collection with test scripts
├── Dockerfile                       # Container image build instructions
├── docker-compose.yml               # Multi-container orchestration (API + MongoDB)
├── .env.example                     # Environment variables template
├── .gitignore                       # Git ignore list (node_modules, .env, coverage)
└── README.md                        # Project documentation and interview guide
```

---

## 🚀 How to Run the Project

### Prerequisites
- Node.js (v18+)
- MongoDB running locally or a MongoDB Atlas connection string
- (Optional) Docker and Docker Compose

---

### Method 1: Running Locally

1. **Clone the repository and install dependencies:**
   ```bash
   git clone <repo-url>
   cd "Authentication API"
   npm install
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```
   Open `.env` and verify your settings:
   ```env
   PORT=5001
   MONGO_URI=mongodb://127.0.0.1:27017/auth_db
   JWT_SECRET=supersecretjwtkey_for_dev_interviews_2026
   CLIENT_URL=http://localhost:5001
   EMAIL_USER=
   EMAIL_PASS=
   ```
   *(Note: If `EMAIL_USER` or `EMAIL_PASS` are left empty, the server automatically prints the verification link to the console for seamless local testing).*

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Run the automated test suite:**
   ```bash
   npm test
   ```

5. **View interactive Swagger docs:**
   Open [http://localhost:5001/api-docs](http://localhost:5001/api-docs) in your browser.

---

### Method 2: Running with Docker Compose

To spin up both the API server and a dedicated MongoDB instance with a single command:

```bash
docker-compose up --build
```

The API will be available at `http://localhost:5000` and Swagger documentation at `http://localhost:5000/api-docs`.

To stop the containers:
```bash
docker-compose down
```

---

## 📡 API Endpoints Table

| Method | Endpoint | Access | Description | Status Codes |
|---|---|---|---|---|
| `GET` | `/api/health` | Public | Server health check | `200` |
| `GET` | `/api-docs` | Public | Interactive Swagger API documentation | `200` |
| `POST` | `/api/auth/register` | Public (Rate Limited) | Register a new user & trigger verification email | `201`, `400`, `409`, `429` |
| `GET` | `/api/auth/verify/:token` | Public | Verify email address using token from link | `200`, `400` |
| `POST` | `/api/auth/login` | Public (Rate Limited) | Authenticate credentials & receive JWT | `200`, `400`, `401`, `403`, `429` |
| `POST` | `/api/auth/logout` | Public | Informational logout (client clears token) | `200` |
| `GET` | `/api/users/me` | Protected (Bearer Token) | Get current authenticated user profile | `200`, `401` |

---

## 🔄 Core Flows Explained

### 1. Registration Flow
1. **Client Submission:** Client submits `name`, `email`, and `password`.
2. **Validation:** `express-validator` verifies email format and ensures password is $\ge 6$ characters.
3. **Duplicate Check:** Queries database to ensure email is not already taken (returns `409 Conflict` if registered).
4. **Password Hashing:** Hashes password with `bcrypt.hash(password, 10)`. Plain-text password is never saved.
5. **Token Generation:** Generates a random, cryptographically secure 32-byte hex token using Node's `crypto.randomBytes(32).toString('hex')`.
6. **Persistence:** Saves the user with `isVerified: false` and `verificationToken: <token>`.
7. **Email Dispatch:** Sends an email with link `http://localhost:5000/api/auth/verify/<token>` (or logs to console if SMTP credentials are omitted).
8. **Response:** Returns `201 Created` with sanitized user object (password omitted).

### 2. Login Flow
1. **Client Submission:** Client submits `email` and `password`.
2. **Validation:** Validates required format.
3. **User Lookup & Password Check:**
   - Finds user by email.
   - Compares candidate password against the stored bcrypt hash with `bcrypt.compare()`.
   - **Crucial Security Decision:** If either the user is not found OR the password does not match, returns the identical error: `"Invalid email or password"` (`401 Unauthorized`).
4. **Verification Enforcement:** Checks `user.isVerified`. If `false`, returns `403 Forbidden` (`"Please verify your email address before logging in"`).
5. **Token Generation:** Signs a JWT containing `{ id: user._id }` with a 1-day expiration.
6. **Response:** Returns `200 OK` with the signed token and basic user details.

---

## 🛡️ Security Decisions I Made

1. **Bcrypt Password Hashing (10 Salt Rounds):**
   - Plain passwords are never stored. Bcrypt includes an automatic salt to defeat rainbow-table attacks and is an intentionally slow, CPU-intensive key derivation function to resist GPU brute-force attacks.
2. **Small JWT Payload:**
   - The token contains only `{ id: user._id }`. JWT payloads are Base64Url encoded—not encrypted—meaning anyone who intercepts the token can read its contents. Storing sensitive information (passwords, emails, roles) in the payload creates data leakage.
3. **Short Token Expiration (`1d`):**
   - If a JWT is stolen, the attacker can use it until it expires. Limiting lifetime to 1 day limits the window of opportunity.
4. **Generic Login Error Message:**
   - Returning `"Invalid email or password"` for both missing users and wrong passwords prevents **User Enumeration Attacks**, where an attacker discovers valid registered emails.
5. **Rate Limiting:**
   - Applied `express-rate-limit` (10 requests per 15 minutes) on `/register` and `/login` to thwart automated credential-stuffing and brute-force bot attacks.
6. **Separation of `app.js` and `server.js`:**
   - By not binding `app.listen()` inside `app.js`, our Jest and Supertest test suites can import the Express application directly and execute fast in-memory HTTP requests without port collision issues.
7. **One-Time Email Verification Token:**
   - Once a verification token is used, `user.verificationToken` is immediately cleared to `null` to eliminate token replay vulnerabilities.

---
