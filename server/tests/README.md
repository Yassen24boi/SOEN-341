# Testing Guide - CareerConnect Backend

This guide outlines how to set up, run, and write automated tests for the **CareerConnect** backend API using **Jest** and **Supertest**.

---

## 1. Prerequisites
Ensure you have the following installed on your machine:
* [Node.js](https://nodejs.org/) (v16+ recommended)
* MongoDB (running locally or a connection string ready in your environment)

---

## 2. Setup & Installation
The testing dependencies (`jest` and `supertest`) are configured in the backend's `package.json`. 

1. Open your terminal and navigate to the backend server directory:
   ```bash
   cd server

## 3. To Run Tests
This will run all test files located inside the `server/tests/` directory (such as `profile.test.js`).

1. In your terminal in the server directory:
   npm test



## 4. Writing New Tests / Expanding the Test Suite

If you want to add new tests or modify existing ones, follow these guidelines:

* **File Location:** All test files should be placed inside the **`server/tests/`** directory and named with the `.test.js` suffix (e.g., `auth.test.js`, `jobs.test.js`).
* **Testing Framework:** We use **Jest** for assertions and test structure (`describe`, `it`, `expect`, `beforeAll`, `afterEach`, etc.), and **Supertest** for simulating HTTP requests to the Express application.
* **App Import:** Import your Express app instance from `../server` so Supertest can test endpoints without spinning up a live network port:
  ```javascript
  const request = require('supertest');
  const app = require('../server');

### Authentication

When testing protected routes, generate a valid JSON Web Token (JWT) using `jwt.sign()` in your `beforeAll` block and pass it in the request headers:

```javascript
const token = jwt.sign({ userId: userId }, process.env.JWT_SECRET, { expiresIn: '1h' });

const res = await request(app)
    .get('/api/profile')
    .set('Authorization', `Bearer ${token}`);
```

### Database Cleanup

Ensure that you clean up any created test documents in `afterEach` or `afterAll` hooks to prevent test pollution:

```javascript
afterEach(async () => {
    await Profile.deleteMany({ user_id: userId });
});
```