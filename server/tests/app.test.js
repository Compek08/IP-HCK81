const request = require('supertest');
const app = require('../app');
const { sequelize } = require('../models');

describe('App Initialization', () => {
    test('Health check endpoint returns 200', async () => {
        const response = await request(app).get('/health');
        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('status', 'ok');
    });

    test('Should handle 404 for non-existent routes', async () => {
        const response = await request(app).get('/nonexistent-route');
        expect(response.statusCode).toBe(404);
    });

    test('Should handle 500 errors gracefully', async () => {
        // Mock a route that throws an error
        app.get('/test-error', (req, res, next) => {
            throw new Error('Test error');
        });

        const response = await request(app).get('/test-error');
        expect(response.statusCode).toBe(500);
        expect(response.body).toHaveProperty('error', 'Something went wrong!');
    });

    test('Should handle CORS properly', async () => {
        const response = await request(app)
            .get('/health')
            .set('Origin', 'http://example.com');

        expect(response.headers['access-control-allow-origin']).toBe('*');
    });

    test('Should parse JSON body', async () => {
        const response = await request(app)
            .post('/api/auth/register')
            .send({ name: 'Test', email: 'test@test.com', password: 'password123' });

        expect(response.statusCode).toBe(201);
    });
});

afterAll(async () => {
    await sequelize.close();
});