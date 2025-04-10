const request = require('supertest');
const app = require('../app');
const { User, sequelize } = require('../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');

// Mock Google OAuth2Client
jest.mock('google-auth-library', () => ({
    OAuth2Client: jest.fn().mockImplementation(() => ({
        verifyIdToken: jest.fn().mockImplementation(() => ({
            getPayload: () => ({
                email: 'googleuser@example.com',
                name: 'Google User',
                sub: 'google123',
                picture: 'https://example.com/photo.jpg'
            })
        }))
    }))
}));

let testUser;
let userToken;

beforeAll(async () => {
    await sequelize.sync({ force: true });

    // Create test user
    testUser = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
    });

    // Generate token for authenticated routes
    userToken = jwt.sign(
        { id: testUser.id, email: testUser.email, name: testUser.name },
        process.env.JWT_SECRET
    );
});

describe('Auth Controller - Extended Tests', () => {
    // Test invalid registration inputs
    describe('Validation in registration', () => {
        test('Should reject registration with empty fields', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    name: '',
                    email: '',
                    password: ''
                });

            expect(response.statusCode).toBe(400);
            expect(response.body).toHaveProperty('error');
        });

        test('Should reject registration with short password', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    name: 'Short Password User',
                    email: 'valid@email.com',
                    password: '123'
                });

            expect(response.statusCode).toBe(400);
            expect(response.body).toHaveProperty('error');
        });

        test('Should reject registration with invalid email format', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    name: 'Invalid Email User',
                    email: 'not-an-email',
                    password: 'password123'
                });

            expect(response.statusCode).toBe(400);
            expect(response.body).toHaveProperty('error');
        });
    });

    // Test internal server error scenario
    describe('Error handling', () => {
        const originalCreate = User.create;

        beforeEach(() => {
            User.create = jest.fn().mockImplementation(() => {
                throw new Error('Database error');
            });
        });

        afterEach(() => {
            User.create = originalCreate;
        });

        test('Should handle internal server error during registration', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    name: 'Error Test User',
                    email: 'error@test.com',
                    password: 'password123'
                });

            expect(response.statusCode).toBe(500);
            expect(response.body).toHaveProperty('error', 'Something went wrong!');
        });
    });

    // Test additional login scenarios
    describe('Login edge cases', () => {
        beforeEach(async () => {
            // Create a user for testing
            await User.create({
                name: 'Login Test User',
                email: 'logintest@example.com',
                password: await bcrypt.hash('password123', 10)
            });
        });

        test('Should reject login with missing fields', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: '',
                    password: ''
                });

            expect(response.statusCode).toBe(400);
            expect(response.body).toHaveProperty('error');
        });

        test('Should handle login internal server error', async () => {
            const originalFindOne = User.findOne;
            User.findOne = jest.fn().mockImplementation(() => {
                throw new Error('Database error');
            });

            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'logintest@example.com',
                    password: 'password123'
                });

            expect(response.statusCode).toBe(500);
            User.findOne = originalFindOne;
        });
    });

    // Test token verification scenarios
    describe('Token verification edge cases', () => {
        let validUser;

        beforeEach(async () => {
            validUser = await User.create({
                name: 'Token Test User',
                email: 'tokentest@example.com',
                password: await bcrypt.hash('password123', 10)
            });
        });

        test('Should reject malformed token', async () => {
            const response = await request(app)
                .get('/api/auth/verify')
                .set('Authorization', 'Bearer malformed.token.here');

            expect(response.statusCode).toBe(401);
            expect(response.body).toHaveProperty('error', 'Invalid or expired token');
        });

        test('Should reject token with invalid signature', async () => {
            // Create token with wrong secret
            const invalidToken = jwt.sign(
                { id: validUser.id, email: validUser.email },
                'wrong-secret'
            );

            const response = await request(app)
                .get('/api/auth/verify')
                .set('Authorization', `Bearer ${invalidToken}`);

            expect(response.statusCode).toBe(401);
            expect(response.body).toHaveProperty('error', 'Invalid or expired token');
        });

        test('Should handle database error during verification', async () => {
            const validToken = jwt.sign(
                { id: validUser.id, email: validUser.email },
                process.env.JWT_SECRET
            );

            const originalFindByPk = User.findByPk;
            User.findByPk = jest.fn().mockImplementation(() => {
                throw new Error('Database error');
            });

            const response = await request(app)
                .get('/api/auth/verify')
                .set('Authorization', `Bearer ${validToken}`);

            expect(response.statusCode).toBe(500);
            User.findByPk = originalFindByPk;
        });
    });

    describe('POST /api/auth/google', () => {
        test('Should login with Google successfully for new user', async () => {
            const response = await request(app)
                .post('/api/auth/google')
                .send({
                    idToken: 'valid-google-token'
                });

            expect(response.statusCode).toBe(200);
            expect(response.body).toHaveProperty('token');
            expect(response.body).toHaveProperty('user');
            expect(response.body.user).toHaveProperty('name', 'Google User');
            expect(response.body.user).toHaveProperty('isNewUser', true);
        });

        test('Should login with Google successfully for existing user', async () => {
            // Create a user with Google ID
            await User.create({
                name: 'Existing Google User',
                email: 'googleuser@example.com',
                password: 'password123',
                googleId: 'google123'
            });

            const response = await request(app)
                .post('/api/auth/google')
                .send({
                    idToken: 'valid-google-token'
                });

            expect(response.statusCode).toBe(200);
            expect(response.body).toHaveProperty('token');
            expect(response.body).toHaveProperty('user');
            expect(response.body.user).toHaveProperty('isNewUser', false);
        });

        test('Should handle invalid Google token', async () => {
            // Mock Google OAuth2Client to throw error
            OAuth2Client.mockImplementation(() => ({
                verifyIdToken: jest.fn().mockRejectedValue(new Error('Invalid token'))
            }));

            const response = await request(app)
                .post('/api/auth/google')
                .send({
                    idToken: 'invalid-google-token'
                });

            expect(response.statusCode).toBe(500);
            expect(response.body).toHaveProperty('error');
        });
    });

    describe('Token Validation', () => {
        test('Should handle expired token', async () => {
            // Create an expired token
            const expiredToken = jwt.sign(
                { id: testUser.id, email: testUser.email, name: testUser.name },
                process.env.JWT_SECRET,
                { expiresIn: '-1s' }
            );

            const response = await request(app)
                .get('/api/auth/verify')
                .set('Authorization', `Bearer ${expiredToken}`);

            expect(response.statusCode).toBe(401);
            expect(response.body).toHaveProperty('error', 'Invalid or expired token');
        });

        test('Should handle malformed token', async () => {
            const response = await request(app)
                .get('/api/auth/verify')
                .set('Authorization', 'Bearer malformed.token.here');

            expect(response.statusCode).toBe(401);
            expect(response.body).toHaveProperty('error', 'Invalid or expired token');
        });

        test('Should handle token with invalid signature', async () => {
            const invalidToken = jwt.sign(
                { id: testUser.id, email: testUser.email, name: testUser.name },
                'wrong-secret'
            );

            const response = await request(app)
                .get('/api/auth/verify')
                .set('Authorization', `Bearer ${invalidToken}`);

            expect(response.statusCode).toBe(401);
            expect(response.body).toHaveProperty('error', 'Invalid or expired token');
        });
    });
});

describe('Auth Controller - Error Handling', () => {
    test('Should handle database error during registration', async () => {
        const originalCreate = User.create;
        User.create = jest.fn().mockRejectedValue(new Error('Database error'));

        const response = await request(app)
            .post('/api/auth/register')
            .send({
                name: 'Test User',
                email: 'test@example.com',
                password: 'password123'
            });

        expect(response.status).toBe(500);
        expect(response.body).toHaveProperty('error', 'Something went wrong!');

        User.create = originalCreate;
    });

    test('Should handle database error during login', async () => {
        const originalFindOne = User.findOne;
        User.findOne = jest.fn().mockRejectedValue(new Error('Database error'));

        const response = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'test@example.com',
                password: 'password123'
            });

        expect(response.status).toBe(500);
        expect(response.body).toHaveProperty('error', 'Something went wrong!');

        User.findOne = originalFindOne;
    });

    test('Should handle invalid password format during registration', async () => {
        const response = await request(app)
            .post('/api/auth/register')
            .send({
                name: 'Test User',
                email: 'test@example.com',
                password: '123' // Password terlalu pendek
            });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
    });

    test('Should handle invalid email format during registration', async () => {
        const response = await request(app)
            .post('/api/auth/register')
            .send({
                name: 'Test User',
                email: 'invalid-email',
                password: 'password123'
            });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
    });
});

describe('Auth Controller - Edge Cases', () => {
    test('Should handle empty request body during registration', async () => {
        const response = await request(app)
            .post('/api/auth/register')
            .send({});

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
    });

    test('Should handle empty request body during login', async () => {
        const response = await request(app)
            .post('/api/auth/login')
            .send({});

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
    });

    test('Should handle missing fields during registration', async () => {
        const response = await request(app)
            .post('/api/auth/register')
            .send({
                name: 'Test User',
                // email missing
                password: 'password123'
            });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
    });

    test('Should handle missing fields during login', async () => {
        const response = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'test@example.com'
                // password missing
            });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
    });
});

describe('Auth Controller - Specific Error Cases', () => {
    test('Should handle invalid token format during password reset', async () => {
        const response = await request(app)
            .post('/api/auth/reset-password')
            .send({
                token: 'invalid_token_format',
                newPassword: 'newPassword123'
            });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
    });

    test('Should handle expired token during password reset', async () => {
        const response = await request(app)
            .post('/api/auth/reset-password')
            .send({
                token: 'expired_token',
                newPassword: 'newPassword123'
            });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
    });

    test('Should handle invalid password format during reset', async () => {
        const response = await request(app)
            .post('/api/auth/reset-password')
            .send({
                token: 'valid_token',
                newPassword: '' // Empty password
            });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
    });
});

afterAll(async () => {
    await sequelize.close();
});