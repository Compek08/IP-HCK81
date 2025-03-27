const { authenticate } = require('../middleware/authenticate');
const { User, sequelize } = require('../models');
const jwt = require('jsonwebtoken');

describe('Authentication Middleware', () => {
    let testUser;
    let validToken;

    beforeAll(async () => {
        await sequelize.sync({ force: true });

        // Create test user
        testUser = await User.create({
            name: 'Middleware Test User',
            email: 'middlewaretest@example.com',
            password: 'password123'
        });

        // Generate valid token
        validToken = jwt.sign(
            { id: testUser.id, email: testUser.email, name: testUser.name },
            process.env.JWT_SECRET
        );
    });

    test('Should set req.user for valid token', async () => {
        const req = {
            headers: {
                authorization: `Bearer ${ validToken }`
            }
        };
        const res = {};
        const next = jest.fn();

        await authenticate(req, res, next);

        expect(req.user).toBeDefined();
        expect(req.user.id).toBe(testUser.id);
        expect(req.user.email).toBe(testUser.email);
        expect(req.user.name).toBe(testUser.name);
        expect(next).toHaveBeenCalled();
    });

    test('Should return 401 for missing token', async () => {
        const req = { headers: {} };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        const next = jest.fn();

        await authenticate(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: 'No token provided' });
        expect(next).not.toHaveBeenCalled();
    });

    test('Should return 401 for invalid token format', async () => {
        const req = {
            headers: {
                authorization: 'InvalidFormat'
            }
        };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        const next = jest.fn();

        await authenticate(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: 'No token provided' });
        expect(next).not.toHaveBeenCalled();
    });

    test('Should return 401 for invalid token', async () => {
        const req = {
            headers: {
                authorization: 'Bearer invalid.token.here'
            }
        };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        const next = jest.fn();

        await authenticate(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: 'Invalid or expired token' });
        expect(next).not.toHaveBeenCalled();
    });

    test('Should return 401 for non-existent user', async () => {
        // Generate token with non-existent user ID
        const nonExistentToken = jwt.sign(
            { id: 999999, email: 'nonexistent@example.com', name: 'Nonexistent User' },
            process.env.JWT_SECRET
        );

        const req = {
            headers: {
                authorization: `Bearer ${ nonExistentToken }`
            }
        };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        const next = jest.fn();

        await authenticate(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token' });
        expect(next).not.toHaveBeenCalled();
    });

    afterAll(async () => {
        await sequelize.close();
    });
});