const request = require('supertest');
const app = require('../server');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// The shared cloud database can be slow, so allow 30 seconds
jest.setTimeout(30000);

// Unique emails per run so the shared database is never affected by other runs or teammates
const RUN_ID = Date.now();
const email = (name) => `auth_${name}_${RUN_ID}@example.com`;

describe('CareerConnect Authentication Tests (Sprint 1: US-01, US-02)', () => {
    beforeAll(async () => {
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(process.env.DATABASE_URL || 'mongodb://localhost:27017/careerconnect_test');
        }
        // Existing account used by the login tests
        await User.create({
            fullName: 'Login Tester',
            email: email('login'),
            password: 'password123',
            role: 'jobseeker'
        });
    });

    afterAll(async () => {
        await User.deleteMany({ email: new RegExp(`^auth_.*_${RUN_ID}@example\\.com$`) });
        await mongoose.connection.close();
    });

    describe('POST /api/auth/register - Register (US-01)', () => {
        it('should create an account and return a token for valid details (AT-01.1)', async () => {
            const res = await request(app).post('/api/auth/register').send({
                fullName: 'New User',
                email: email('new'),
                password: 'password123',
                role: 'jobseeker'
            });

            expect(res.statusCode).toEqual(201);
            expect(res.body).toHaveProperty('token');
            expect(res.body.user).toHaveProperty('email', email('new'));
            expect(res.body.user).toHaveProperty('role', 'jobseeker');
            expect(res.body.user).not.toHaveProperty('password');
        });

        it('should store the password hashed, never as plain text', async () => {
            const saved = await User.findOne({ email: email('new') });

            expect(saved.password).not.toBe('password123');
        });

        it('should reject an email that is already registered (AT-01.2)', async () => {
            const res = await request(app).post('/api/auth/register').send({
                fullName: 'Duplicate',
                email: email('login'),
                password: 'password123'
            });

            expect(res.statusCode).toEqual(400);
            expect(res.body.message).toBe('Email already in use');
            expect(await User.countDocuments({ email: email('login') })).toBe(1);
        });

        it('should reject a registration with a missing required field (AT-01.3)', async () => {
            const res = await request(app).post('/api/auth/register').send({
                fullName: 'No Password',
                email: email('nopass')
            });

            expect(res.statusCode).toEqual(400);
            expect(await User.countDocuments({ email: email('nopass') })).toBe(0);
        });
    });

    describe('POST /api/auth/login - Login (US-02)', () => {
        it('should log in with the correct email and password (AT-02.1)', async () => {
            const res = await request(app).post('/api/auth/login').send({
                email: email('login'),
                password: 'password123'
            });

            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('token');
            expect(res.body.user).toHaveProperty('email', email('login'));
            expect(res.body.user).not.toHaveProperty('password');
        });

        it('should reject a wrong password and give no token (AT-02.2)', async () => {
            const res = await request(app).post('/api/auth/login').send({
                email: email('login'),
                password: 'wrong-password'
            });

            expect(res.statusCode).toEqual(400);
            expect(res.body.message).toBe('Invalid email or password');
            expect(res.body).not.toHaveProperty('token');
        });

        it('should reject an email that does not exist with the same message', async () => {
            const res = await request(app).post('/api/auth/login').send({
                email: email('ghost'),
                password: 'password123'
            });

            expect(res.statusCode).toEqual(400);
            expect(res.body.message).toBe('Invalid email or password');
        });
    });

    describe('Logout - protected routes without a valid session (US-02)', () => {
        // Logout is handled in the frontend by deleting the token, so on the server
        // we check what a logged-out user (no token) can and cannot reach.
        it('should block protected routes when there is no token (AT-02.3)', async () => {
            const res = await request(app).get('/api/profile');

            expect(res.statusCode).toEqual(401);
            expect(res.body.message).toBe('No token provided');
        });

        it('should block protected routes when the token is invalid', async () => {
            const res = await request(app)
                .get('/api/profile')
                .set('Authorization', 'Bearer not-a-real-token');

            expect(res.statusCode).toEqual(401);
        });

        it('should block protected routes when the token is expired', async () => {
            const user = await User.findOne({ email: email('login') });
            const expired = jwt.sign(
                { userId: user._id, role: user.role },
                process.env.JWT_SECRET || 'secret_key',
                { expiresIn: -10 }
            );
            const res = await request(app)
                .get('/api/profile')
                .set('Authorization', `Bearer ${expired}`);

            expect(res.statusCode).toEqual(401);
        });
    });
});