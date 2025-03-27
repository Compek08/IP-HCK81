const request = require('supertest');
const app = require('../app');
const { User, sequelize } = require('../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

describe('Auth Controller - Extended Tests', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });
  
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
  
  afterAll(async () => {
    await sequelize.close();
  });
});