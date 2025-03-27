const { createServer } = require('http');
const app = require('../app');
const { sequelize } = require('../models');
jest.mock('http');

describe('Server Bootstrap (www.js)', () => {
  const originalEnv = process.env.PORT;
  
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.PORT = '3000';
  });
  
  afterEach(() => {
    process.env.PORT = originalEnv;
  });
  
  test('Server should be configured correctly', () => {
    const mockServer = {
      listen: jest.fn().mockReturnThis(),
      on: jest.fn().mockReturnThis()
    };
    
    createServer.mockReturnValue(mockServer);
    
    // Execute the www.js file logic
    require('../bin/www');
    
    // Verify the server was created with our app
    expect(createServer).toHaveBeenCalledWith(app);
    
    // Verify listen was called with the correct port
    expect(mockServer.listen).toHaveBeenCalledWith(3000);
    
    // Verify error event handler was registered
    expect(mockServer.on).toHaveBeenCalledWith('error', expect.any(Function));
  });
  
  afterAll(async () => {
    await sequelize.close();
  });
});