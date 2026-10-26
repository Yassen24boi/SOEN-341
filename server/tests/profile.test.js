const request = require('supertest');
const app = require('../server');
const mongoose = require('mongoose');
const Profile = require('../models/Profile');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

describe('CareerConnect Profile Feature Tests', () => {
    let token;
    let userId;
    let testUser;

    beforeAll(async () => {
        // Connect to test database
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(process.env.DATABASE_URL || 'mongodb://localhost:27017/careerconnect_test');
        }

        // Ensure uploads directory exists for tests
        const uploadDir = path.join(__dirname, '../uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
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

        // Generate a valid JWT token matching requireAuth middleware format
        token = jwt.sign({ userId: userId, role: testUser.role }, process.env.JWT_SECRET || 'secret_key', { expiresIn: '1h' });
    });

    afterEach(async () => {
        // Clean up profile collection after each test
        await Profile.deleteMany({ user_id: userId });
        // Clear resumes array for clean state between Task 7 tests
        await User.findByIdAndUpdate(userId, { resumes: [] });
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

        it('AT-06.3: should return response without profile user_id for a user who has not created a profile yet', async () => {
            await Profile.deleteMany({ user_id: userId });

            const res = await request(app)
                .get('/api/profile')
                .set('Authorization', `Bearer ${token}`);

            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('fullName', 'Test User');
            expect(res.body).toHaveProperty('email');
            expect(res.body.user_id).toBeUndefined();
        });
    });

    describe('GET /api/profile/:userId (Task 6.1)', () => {
        it('should return 404 if the user does not exist', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const res = await request(app).get(`/api/profile/${fakeId}`);
            
            expect(res.statusCode).toEqual(404);
            expect(res.body).toHaveProperty('message', 'User not found');
        });

        it('should successfully fetch a specific user profile and populate their account data', async () => {
            await Profile.create({
                user_id: userId,
                headline: 'Frontend Engineer',
                location: 'Vancouver, BC'
            });

            const res = await request(app)
                .get(`/api/profile/${userId}`);
            
            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('headline', 'Frontend Engineer');
            expect(res.body).toHaveProperty('fullName', 'Test User');
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
            const otherUserId = new mongoose.Types.ObjectId();
            
            const res = await request(app)
                .put(`/api/profile/${otherUserId}`) 
                .set('Authorization', `Bearer ${token}`)
                .send({ headline: 'Hacked Headline' });

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

    describe('Task 7: Multiple CV Management & Default File Selection', () => {
        let cv1Id, cv2Id, cv3Id;
        const pdfBuffer = Buffer.from('%PDF-1.4 mock file content');

        beforeEach(async () => {
            // Seed the user with three CVs before each test to test array manipulation
            const res1 = await request(app).post('/api/profile/resume').set('Authorization', `Bearer ${token}`).attach('resumeFile', pdfBuffer, 'cv1.pdf');
            cv1Id = res1.body.resumes[0]._id; // Automatically default

            const res2 = await request(app).post('/api/profile/resume').set('Authorization', `Bearer ${token}`).attach('resumeFile', pdfBuffer, 'cv2.pdf');
            cv2Id = res2.body.resumes[1]._id; // Not default

            const res3 = await request(app).post('/api/profile/resume').set('Authorization', `Bearer ${token}`).attach('resumeFile', pdfBuffer, 'cv3.pdf');
            cv3Id = res3.body.resumes[2]._id; // Not default
        });

        describe('POST /api/profile/resume (Task 7.1)', () => {
            it('should return 400 if no resume file is attached during upload', async () => {
                const res = await request(app).post('/api/profile/resume').set('Authorization', `Bearer ${token}`);
                expect(res.statusCode).toEqual(400);
            });

            it('should reject file types other than .pdf, .doc, and .docx', async () => {
                const invalidFileBuffer = Buffer.from('mock image data');
                const res = await request(app)
                    .post('/api/profile/resume')
                    .set('Authorization', `Bearer ${token}`)
                    .attach('resumeFile', invalidFileBuffer, 'image.png');
                
                expect(res.statusCode).toEqual(500); // Multer throws an error caught by the route block
            });

            it('should append a new CV to the array and apply a custom label if provided', async () => {
                const res = await request(app)
                    .post('/api/profile/resume')
                    .set('Authorization', `Bearer ${token}`)
                    .field('label', 'Specialized Tech Resume')
                    .attach('resumeFile', pdfBuffer, 'new_cv.pdf');

                expect(res.statusCode).toEqual(200);
                expect(res.body.resumes.length).toEqual(4);
                
                const newestCV = res.body.resumes[3];
                expect(newestCV.label).toBe('Specialized Tech Resume');
                expect(newestCV.isDefault).toBe(false); // First one was already default
            });
        });

        describe('PATCH /api/profile/resume/:id/default (Task 7.2 & AT-07.1)', () => {
            it('should return 401 if a user tries to change defaults without a valid token', async () => {
                const res = await request(app).patch(`/api/profile/resume/${cv2Id}/default`);
                expect(res.statusCode).toEqual(401);
            });

            it('should return 404 if trying to set a non-existent CV as default', async () => {
                const fakeId = new mongoose.Types.ObjectId();
                const res = await request(app)
                    .patch(`/api/profile/resume/${fakeId}/default`)
                    .set('Authorization', `Bearer ${token}`);
                
                expect(res.statusCode).toEqual(404);
                expect(res.body.message).toBe('Resume not found');
            });

            it('AT-07.1: should enforce the one-default rule by setting the target to true and all others to false', async () => {
                // Execute PATCH to make CV 2 the default
                const res = await request(app)
                    .patch(`/api/profile/resume/${cv2Id}/default`)
                    .set('Authorization', `Bearer ${token}`);

                expect(res.statusCode).toEqual(200);
                
                const updatedCv1 = res.body.resumes.find(r => r._id === cv1Id);
                const updatedCv2 = res.body.resumes.find(r => r._id === cv2Id);
                const updatedCv3 = res.body.resumes.find(r => r._id === cv3Id);
                
                // Verify strict single-default enforcement
                expect(updatedCv2.isDefault).toBe(true);
                expect(updatedCv1.isDefault).toBe(false);
                expect(updatedCv3.isDefault).toBe(false);
            });
        });

        describe('DELETE /api/profile/resume/:id (Task 7.4 & AT-07.2)', () => {
            it('should return 404 when trying to delete a CV that does not exist', async () => {
                const fakeId = new mongoose.Types.ObjectId();
                const res = await request(app)
                    .delete(`/api/profile/resume/${fakeId}`)
                    .set('Authorization', `Bearer ${token}`);
                
                expect(res.statusCode).toEqual(404);
            });

            it('should successfully delete a non-default CV without affecting the active default CV', async () => {
                const res = await request(app)
                    .delete(`/api/profile/resume/${cv2Id}`) // cv2 is not default
                    .set('Authorization', `Bearer ${token}`);

                expect(res.statusCode).toEqual(200);
                expect(res.body.resumes.length).toBe(2); // Reduced from 3 to 2
                
                // Ensure CV1 remained the default
                const remainingCv1 = res.body.resumes.find(r => r._id === cv1Id);
                expect(remainingCv1.isDefault).toBe(true);
            });

            it('AT-07.2: should automatically assign the most recently uploaded remaining CV as the new default if the active default is deleted', async () => {
                // Delete CV 1 (the active default)
                const res = await request(app)
                    .delete(`/api/profile/resume/${cv1Id}`)
                    .set('Authorization', `Bearer ${token}`);

                expect(res.statusCode).toEqual(200);
                expect(res.body.resumes.length).toBe(2);
                
                // Fallback Logic Check: CV 3 (the most recently uploaded remaining CV) should now be default
                const newDefaultCv = res.body.resumes.find(r => r._id === cv3Id);
                const olderRemainingCv = res.body.resumes.find(r => r._id === cv2Id);
                
                expect(newDefaultCv.isDefault).toBe(true);
                expect(olderRemainingCv.isDefault).toBe(false);
            });

            it('should gracefully handle deleting the final remaining CV leaving an empty array', async () => {
                // Delete all three sequentially
                await request(app).delete(`/api/profile/resume/${cv3Id}`).set('Authorization', `Bearer ${token}`);
                await request(app).delete(`/api/profile/resume/${cv2Id}`).set('Authorization', `Bearer ${token}`);
                const finalRes = await request(app).delete(`/api/profile/resume/${cv1Id}`).set('Authorization', `Bearer ${token}`);

                expect(finalRes.statusCode).toEqual(200);
                expect(finalRes.body.resumes.length).toBe(0);
            });
        });

        describe('GET /api/profile/resume/:filename (Preview/Download)', () => {
            it('should return 404 if attempting to download a filename that is not in the users array', async () => {
                const res = await request(app)
                    .get('/api/profile/resume/non_existent_file.pdf')
                    .set('Authorization', `Bearer ${token}`);

                expect(res.statusCode).toEqual(404);
                expect(res.body.message).toBe('Resume not found');
            });

            it('should successfully retrieve a specific resume for download using the filename parameter', async () => {
                // Get the real filename of CV1 generated by Multer
                const userDoc = await User.findById(userId);
                const targetFilename = userDoc.resumes[0].filename;

                const res = await request(app)
                    .get(`/api/profile/resume/${targetFilename}`)
                    .set('Authorization', `Bearer ${token}`);

                expect(res.statusCode).toEqual(200);
                expect(res.headers['content-type']).toContain('application/pdf'); 
            });
        });
    });
});