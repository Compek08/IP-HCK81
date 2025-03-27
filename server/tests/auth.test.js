const request = require('supertest');
const app = require('../app');
const { User, sequelize } = require('../models');
const jwt = require('jsonwebtoken');

let testUser;
let userToken;

beforeAll(async () => {
    await sequelize.sync({ force: true }); // Reset database

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

describe('Authentication API', () => {
    describe('POST /api/auth/register', () => {
        test('Should register a new user successfully', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    name: 'New User',
                    email: 'newuser@example.com',
                    password: 'password123'
                });

            expect(response.statusCode).toBe(201);
            expect(response.body).toHaveProperty('token');
            expect(response.body).toHaveProperty('user');
            expect(response.body.user).toHaveProperty('name', 'New User');
        });

        test('Should reject registration with existing email', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    name: 'Duplicate User',
                    email: 'test@example.com', // Already exists
                    password: 'password123'
                });

            expect(response.statusCode).toBe(400);
            expect(response.body).toHaveProperty('error');
        });

        test('Should reject registration with invalid data', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    name: 'Invalid User',
                    email: 'invalid-email',
                    password: 'pass'
                });

            expect(response.statusCode).toBe(400);
        });
    });

    describe('POST /api/auth/login', () => {
        test('Should login successfully with valid credentials', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'password123'
                });

            expect(response.statusCode).toBe(200);
            expect(response.body).toHaveProperty('token');
            expect(response.body).toHaveProperty('user');
        });

        test('Should reject login with invalid email', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'nonexistent@example.com',
                    password: 'password123'
                });

            expect(response.statusCode).toBe(401);
            expect(response.body).toHaveProperty('error');
        });

        test('Should reject login with invalid password', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'wrongpassword'
                });

            expect(response.statusCode).toBe(401);
            expect(response.body).toHaveProperty('error');
        });
    });

    describe('GET /api/auth/verify', () => {
        test('Should verify valid token', async () => {
            const response = await request(app)
                .get('/api/auth/verify')
                .set('Authorization', `Bearer ${ userToken }`);

            expect(response.statusCode).toBe(200);
            expect(response.body).toHaveProperty('user');
        });

        test('Should reject invalid token', async () => {
            const response = await request(app)
                .get('/api/auth/verify')
                .set('Authorization', 'Bearer invalid-token');

            expect(response.statusCode).toBe(401);
        });

        test('Should reject missing token', async () => {
            const response = await request(app)
                .get('/api/auth/verify');

            expect(response.statusCode).toBe(401);
        });
    });
});

afterAll(async () => {
    await sequelize.close();
});