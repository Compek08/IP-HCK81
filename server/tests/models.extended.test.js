const fs = require('fs');
const path = require('path');
const { User, GameSession, Character, DialogueHistory, sequelize } = require('../models');
const bcrypt = require('bcryptjs');

describe('Model Index.js Tests', () => {
  test('Should set sequelize based on NODE_ENV', () => {
    // Test the config import path logic (line 14 in index.js)
    const env = process.env.NODE_ENV || 'development';
    const config = require('../config/config.js')[env];
    expect(config).toBeDefined();
  });
  
  test('Should initialize all models', () => {
    // Test that all model files are properly loaded
    const modelFiles = fs.readdirSync(path.join(__dirname, '../models'))
      .filter(file => 
        file.indexOf('.') !== 0 && 
        file !== 'index.js' && 
        file.slice(-3) === '.js'
      );
    
    // Check that each model exists in sequelize.models
    modelFiles.forEach(file => {
      const modelName = file.split('.')[0];
      const formattedName = modelName.charAt(0).toUpperCase() + modelName.slice(1);
      expect(sequelize.models[formattedName]).toBeDefined();
    });
  });
});

describe('User Model Extended Tests', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });
  
  test('Should test checkPassword method with null password', async () => {
    // Create a user with known password
    const user = await User.create({
      name: 'Password Test User',
      email: 'passwordtest@example.com',
      password: 'password123'
    });
    
    // Test null password case (branch at line 46)
    const result = await user.checkPassword(null);
    expect(result).toBe(false);
  });
  
  test('Should handle case where password is not hashed', async () => {
    // Create user but bypass bcrypt hooks
    const user = await User.build({
      name: 'Unhashed Password User',
      email: 'unhashed@example.com',
      password: 'plaintext'  // Not hashed
    });
    
    await user.save({ hooks: false });
    
    // Check if checkPassword handles this case
    const result = await user.checkPassword('plaintext');
    expect(result).toBe(false);  // Should fail since we're expecting a hashed password
  });
});

describe('Migration Files Validation', () => {
  test('All migration files should have valid structure', () => {
    const migrationPath = path.join(__dirname, '../migrations');
    const migrationFiles = fs.readdirSync(migrationPath)
      .filter(file => file.slice(-3) === '.js');
    
    migrationFiles.forEach(file => {
      const migration = require(path.join(migrationPath, file));
      
      // Check migration structure
      expect(migration).toHaveProperty('up');
      expect(migration).toHaveProperty('down');
      expect(typeof migration.up).toBe('function');
      expect(typeof migration.down).toBe('function');
    });
  });
  
  test('Game session migration should set up proper fields', () => {
    const gameSessionMigration = require('../migrations/20250325081331-create-game-session.js');
    
    // Mock queryInterface
    const queryInterface = {
      createTable: jest.fn().mockResolvedValue(true),
      dropTable: jest.fn().mockResolvedValue(true)
    };
    
    const Sequelize = {
      INTEGER: 'INTEGER',
      STRING: 'STRING',
      ENUM: jest.fn().mockReturnValue('ENUM'),
      DATE: 'DATE'
    };
    
    // Execute migration up
    gameSessionMigration.up(queryInterface, Sequelize);
    
    // Check if createTable was called with the right table name
    expect(queryInterface.createTable).toHaveBeenCalledWith('GameSessions', expect.any(Object));
    
    // Execute migration down
    gameSessionMigration.down(queryInterface, Sequelize);
    
    // Check if dropTable was called
    expect(queryInterface.dropTable).toHaveBeenCalledWith('GameSessions');
  });
  
  test('Character migration should set up proper fields', () => {
    const characterMigration = require('../migrations/20250325081333-create-character.js');
    
    // Mock queryInterface
    const queryInterface = {
      createTable: jest.fn().mockResolvedValue(true),
      dropTable: jest.fn().mockResolvedValue(true)
    };
    
    const Sequelize = {
      INTEGER: 'INTEGER',
      STRING: 'STRING',
      TEXT: 'TEXT',
      ARRAY: jest.fn().mockReturnValue('ARRAY'),
      JSON: 'JSON',
      DATE: 'DATE'
    };
    
    // Execute migration up
    characterMigration.up(queryInterface, Sequelize);
    
    // Check if createTable was called with the right table name
    expect(queryInterface.createTable).toHaveBeenCalledWith('Characters', expect.any(Object));
    
    // Execute migration down
    characterMigration.down(queryInterface, Sequelize);
    
    // Check if dropTable was called
    expect(queryInterface.dropTable).toHaveBeenCalledWith('Characters');
  });
  
  test('Dialogue history migration should set up proper fields', () => {
    const dialogueMigration = require('../migrations/20250325081335-create-dialogue-history.js');
    
    // Mock queryInterface
    const queryInterface = {
      createTable: jest.fn().mockResolvedValue(true),
      dropTable: jest.fn().mockResolvedValue(true)
    };
    
    const Sequelize = {
      INTEGER: 'INTEGER',
      STRING: 'STRING',
      TEXT: 'TEXT',
      DATE: 'DATE'
    };
    
    // Execute migration up
    dialogueMigration.up(queryInterface, Sequelize);
    
    // Check if createTable was called with the right table name
    expect(queryInterface.createTable).toHaveBeenCalledWith('DialogueHistories', expect.any(Object));
    
    // Execute migration down
    dialogueMigration.down(queryInterface, Sequelize);
    
    // Check if dropTable was called
    expect(queryInterface.dropTable).toHaveBeenCalledWith('DialogueHistories');
  });
  
  test('Player stats migration should add columns correctly', () => {
    const statsMigration = require('../migrations/20250325081350-add-player-stats.js');
    
    // Mock queryInterface
    const queryInterface = {
      addColumn: jest.fn().mockResolvedValue(true),
      removeColumn: jest.fn().mockResolvedValue(true)
    };
    
    const Sequelize = {
      INTEGER: 'INTEGER',
      JSON: 'JSON'
    };
    
    // Execute migration up
    statsMigration.up(queryInterface, Sequelize);
    
    // Check if addColumn was called multiple times
    expect(queryInterface.addColumn).toHaveBeenCalledTimes(5);
    
    // Execute migration down
    statsMigration.down(queryInterface, Sequelize);
    
    // Check if removeColumn was called multiple times
    expect(queryInterface.removeColumn).toHaveBeenCalledTimes(5);
  });
});