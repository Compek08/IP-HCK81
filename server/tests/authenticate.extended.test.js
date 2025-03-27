const jwt = require('jsonwebtoken');
const { authenticate } = require('../middleware/authenticate');
const { User, sequelize } = require('../models');

describe('Authenticate Middleware - Edge Cases', () => {
  let validUser;
  
  beforeAll(async () => {
    await sequelize.sync({ force: true });
    
    // Create test user
    validUser = await User.create({
      name: 'Auth Middleware Test User',
      email: 'authmiddleware@example.com',
      password: 'password123'
    });
  });
  
  test('Should handle database errors in user lookup', async () => {
    // Create a valid token
    const token = jwt.sign(
      { id: validUser.id, email: validUser.email },
      process.env.JWT_SECRET
    );
    
    // Mock req, res, next
    const req = {
      headers: {
        authorization: `Bearer ${token}`
      }
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    const next = jest.fn();
    
    // Mock User.findByPk to throw an error
    const originalFindByPk = User.findByPk;
    User.findByPk = jest.fn().mockImplementation(() => {
      throw new Error('Database error');
    });
    
    // Call middleware
    await authenticate(req, res, next);
    
    // Verify response
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Server error' });
    
    // Restore original function
    User.findByPk = originalFindByPk;
  });
  
  test('Should handle jwt verify errors other than JsonWebTokenError', async () => {
    // Mock jwt.verify to throw a different error
    const originalVerify = jwt.verify;
    jwt.verify = jest.fn().mockImplementation(() => {
      const error = new Error('Some other error');
      error.name = 'NotJsonWebTokenError';
      throw error;
    });
    
    // Mock req, res, next
    const req = {
      headers: {
        authorization: 'Bearer some.token.here'
      }
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    const next = jest.fn();
    
    // Call middleware
    await authenticate(req, res, next);
    
    // Verify response
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid or expired token' });
    
    // Restore original function
    jwt.verify = originalVerify;
  });
  
  afterAll(async () => {
    await sequelize.close();
  });
});