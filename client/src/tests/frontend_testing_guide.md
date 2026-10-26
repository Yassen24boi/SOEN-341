# CareerConnect Frontend UI Testing Guide

This directory contains the React frontend for the CareerConnect platform, including the automated UI acceptance tests for Sprint 1 and Sprint 2 User Stories.

Our frontend tests use **Jest** and **React Testing Library** to simulate user interactions and validate that our UI components meet the acceptance criteria without needing a live backend server (API calls are mocked).

## Prerequisites

Before running the tests, make sure you have Node.js installed and are working inside the `client` directory:

```bash
cd client
```

## 1. Install Testing Dependencies

If you haven't already set up the testing environment on your local machine, install the required development dependencies:

```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom jest jest-environment-jsdom
```

## 2. Add Test Scripts to `package.json`

Ensure your `client/package.json` file has the following scripts configured in the `"scripts"` block:

```json
"scripts": {
  "start": "vite",
  "build": "vite build",
  "test": "jest",
  "test:watch": "jest --watchAll"
}
```

## 3. Running the Tests

You can run the tests using the following commands from inside the `client` folder:

**Run all tests once:**
```bash
npm test
```

**Run tests in Watch Mode (Recommended for active development):**
```bash
npm run test:watch
```
*Watch mode will keep the test runner open in your terminal and automatically re-run the tests whenever you save a change to a `.jsx` or `.test.jsx` file.*

## Test Structure

All automated UI acceptance tests are located in the `src/__tests__/` directory. 

*   **`UI.test.jsx`**: Contains the full test suite covering user stories for:
    *   **US-01:** Register (Success & Error handling)
    *   **US-02:** Login / Logout (Authentication routing)
    *   **US-04 & US-05:** Create/Edit Profile (Form population & validation)
    *   **US-06:** View Full Profile (Empty states & populated states)
    *   **US-03 & US-07:** Multiple CV Management (File defaulting & deletion logic)