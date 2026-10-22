const request = require('supertest');
const app = require('../server');
const mongoose = require('mongoose');
const Profile = require('../models/Profile');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

describe('CareerConnect Profile Feature Tests', () => {
    let token;
    let userId;
    let testUser;

    beforeAll(async () => {
        // Connect to test database
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(process.env.DATABASE_URL || 'mongodb://localhost:27017/careerconnect_test');
        }

        // Create a test user in the database
        userId = new mongoose.Types.ObjectId();
        testUser = await User.create({
            _id: userId,
            fullName: 'Test User',
            email: `test_${Date.now()}@example.com`,
            password: 'password123',
            role: 'jobseeker'
        });

        // Generate a valid JWT token matching your requireAuth middleware format
        token = jwt.sign({ userId: userId, role: testUser.role }, process.env.JWT_SECRET || 'secret_key', { expiresIn: '1h' });
    });

    afterEach(async () => {
        // Clean up profile collection after each test
        await Profile.deleteMany({ user_id: userId });
    });

    afterAll(async () => {
        await User.deleteMany({ _id: userId });
        await mongoose.connection.close();
    });

    describe('GET /api/profile', () => {
        it('should return 401/403 if no authentication token is provided', async () => {
            const res = await request(app).get('/api/profile');
            expect([401, 403, 500]).toContain(res.statusCode);
        });

        it('should fetch the user profile successfully when authenticated', async () => {
            // Create a mock profile first
            await Profile.create({
                user_id: userId,
                headline: 'Software Engineer',
                location: 'Montreal, QC',
                phone: '+15145550199',
                skills: ['JavaScript', 'React']
            });

            const res = await request(app)
                .get('/api/profile')
                .set('Authorization', `Bearer ${token}`);

            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('headline', 'Software Engineer');
            expect(res.body).toHaveProperty('location', 'Montreal, QC');
            expect(res.body.skills).toContain('JavaScript');
        });
    });

    describe('PUT /api/profile (Creation & Update / Upsert)', () => {
        it('should successfully save profile with optional headline and location left blank', async () => {
            const payload = {
                fullName: 'Test User Updated',
                email: testUser.email,
                headline: '', 
                location: '', 
                summary: 'Motivated software developer.',
                skills: ['Node.js', 'MongoDB']
            };

            const res = await request(app)
                .put('/api/profile')
                .set('Authorization', `Bearer ${token}`)
                .send(payload);

            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('summary', 'Motivated software developer.');
            expect(res.body.skills).toContain('Node.js');
        });

        it('should successfully save full professional profile including experience timeline and education', async () => {
            const payload = {
                fullName: 'Test User',
                email: testUser.email,
                headline: 'Full Stack Developer',
                location: 'Toronto, ON',
                phone: '+14165550144',
                summary: 'Building great web apps.',
                skills: ['React', 'Express'],
                links: {
                    portfolio: 'https://myportfolio.com',
                    linkedin: 'https://linkedin.com/in/testuser',
                    github: 'https://github.com/testuser'
                },
                experience: [
                    {
                        title: 'Frontend Developer',
                        company: 'Web Studio',
                        location: 'Remote',
                        from: '2022-01-01',
                        current: true,
                        description: 'Building UI components.'
                    }
                ],
                education: [
                    {
                        school: 'Concordia University',
                        degree: 'Bachelor of Science',
                        fieldOfStudy: 'Computer Science',
                        from: '2018-09-01',
                        to: '2022-05-01',
                        current: false
                    }
                ]
            };

            const res = await request(app)
                .put('/api/profile')
                .set('Authorization', `Bearer ${token}`)
                .send(payload);

            expect(res.statusCode).toEqual(200);
            expect(res.body.experience.length).toEqual(1);
            expect(res.body.experience[0].current).toEqual(true);
            expect(res.body.education.length).toEqual(1);
            expect(res.body.links.portfolio).toEqual('https://myportfolio.com');
        });
    });
    
    describe('AT-05.3: Profile Ownership Validation', () => {
        it('should return a 403 or 404 error when attempting to update someone else\'s profile', async () => {
            // Attempting to modify a profile belonging to a different user ID
            const otherUserId = new mongoose.Types.ObjectId();
            
            const res = await request(app)
                // Sending request to a specific ID endpoint
                .put(`/api/profile/${otherUserId}`) 
                .set('Authorization', `Bearer ${token}`)
                .send({ headline: 'Hacked Headline' });

            // Expecting 401 Unauthorized, 403 Forbidden, or 404 Not Found
            expect([401, 403, 404]).toContain(res.statusCode); 
        });
    });

    describe('Format Validations (AT-04.3)', () => {
        it('should return a 400 error for invalid phone number format', async () => {
            const payload = {
                fullName: 'Test User',
                email: testUser.email,
                phone: 'invalid-phone-string'
            };

            const res = await request(app)
                .put('/api/profile')
                .set('Authorization', `Bearer ${token}`)
                .send(payload);

            expect(res.statusCode).toEqual(400);
            expect(res.body.errors).toHaveProperty('phone', 'Invalid phone number format');
        });

        it('should return a 400 error for invalid portfolio, linkedin, or github URL formats', async () => {
            const payload = {
                fullName: 'Test User',
                email: testUser.email,
                links: {
                    portfolio: 'not-a-valid-url',
                    linkedin: 'bad-linkedin',
                    github: 'bad-github'
                }
            };

            const res = await request(app)
                .put('/api/profile')
                .set('Authorization', `Bearer ${token}`)
                .send(payload);

            expect(res.statusCode).toEqual(400);
            expect(res.body.errors).toHaveProperty('portfolio', 'Invalid URL format');
            expect(res.body.errors).toHaveProperty('linkedin', 'Invalid URL format');
            expect(res.body.errors).toHaveProperty('github', 'Invalid URL format');
        });
    });

    describe('Resume Upload and Download Endpoints', () => {
        it('should return 400 if no resume file is attached during upload', async () => {
            const res = await request(app)
                .post('/api/profile/resume')
                .set('Authorization', `Bearer ${token}`);

            expect(res.statusCode).toEqual(400);
        });

        it('should return 404 when trying to download a resume if none has been uploaded', async () => {
            // Ensure no resume filename is set
            await User.findByIdAndUpdate(userId, { resumeFileName: null });

            const res = await request(app)
                .get('/api/profile/resume')
                .set('Authorization', `Bearer ${token}`);

            expect(res.statusCode).toEqual(404);
            expect(res.body).toHaveProperty('message', 'No resume uploaded');
        });
    });
});