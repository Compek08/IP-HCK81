const jwt = require('jsonwebtoken');
const { authenticate } = require('../middleware/authenticate');
const { User, sequelize } = require('../models');

describe('Extended Authentication Middleware', () => {
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

    describe('Token Validation', () => {
        test('Should handle token with missing user data', async () => {
            const tokenWithMissingData = jwt.sign(
                { id: testUser.id }, // Missing email and name
                process.env.JWT_SECRET
            );

            const req = {
                headers: {
                    authorization: `Bearer ${tokenWithMissingData}`
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

        test('Should handle token with invalid user ID', async () => {
            const tokenWithInvalidId = jwt.sign(
                { id: 'invalid-id', email: testUser.email, name: testUser.name },
                process.env.JWT_SECRET
            );

            const req = {
                headers: {
                    authorization: `Bearer ${tokenWithInvalidId}`
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
    });

    describe('Database Error Handling', () => {
        test('Should handle database connection errors', async () => {
            // Mock database error
            const originalFindByPk = User.findByPk;
            User.findByPk = jest.fn().mockRejectedValue(new Error('Database error'));

            const req = {
                headers: {
                    authorization: `Bearer ${validToken}`
                }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            const next = jest.fn();

            await authenticate(req, res, next);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: 'Authentication failed' });
            expect(next).not.toHaveBeenCalled();

            // Restore original method
            User.findByPk = originalFindByPk;
        });

        test('Should handle database timeout', async () => {
            // Mock database timeout
            const originalFindByPk = User.findByPk;
            User.findByPk = jest.fn().mockImplementation(() => {
                return new Promise((_, reject) => {
                    setTimeout(() => reject(new Error('Database timeout')), 1000);
                });
            });

            const req = {
                headers: {
                    authorization: `Bearer ${validToken}`
                }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            const next = jest.fn();

            await authenticate(req, res, next);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: 'Authentication failed' });
            expect(next).not.toHaveBeenCalled();

            // Restore original method
            User.findByPk = originalFindByPk;
        });
    });

    describe('Edge Cases', () => {
        test('Should handle empty authorization header', async () => {
            const req = {
                headers: {
                    authorization: ''
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

        test('Should handle authorization header with only "Bearer"', async () => {
            const req = {
                headers: {
                    authorization: 'Bearer'
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

        test('Should handle authorization header with extra spaces', async () => {
            const req = {
                headers: {
                    authorization: `Bearer  ${validToken}  `
                }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            const next = jest.fn();

            await authenticate(req, res, next);

            expect(req.user).toBeDefined();
            expect(req.user.id).toBe(testUser.id);
            expect(next).toHaveBeenCalled();
        });
    });

    afterAll(async () => {
        await sequelize.close();
    });
});