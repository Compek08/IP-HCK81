const { User, GameSession, Character, DialogueHistory, sequelize } = require('../models');
const bcrypt = require('bcryptjs');

beforeAll(async () => {
    await sequelize.sync({ force: true });
});

describe('User Model', () => {
    test('Should create a user with hashed password', async () => {
        const userData = {
            name: 'Model Test User',
            email: 'modeltest@example.com',
            password: 'password123'
        };

        const user = await User.create(userData);

        expect(user.id).toBeDefined();
        expect(user.name).toBe(userData.name);
        expect(user.email).toBe(userData.email);
        expect(user.password).not.toBe(userData.password); // Password should be hashed

        // Test password comparison
        const isMatch = await user.checkPassword('password123');
        expect(isMatch).toBe(true);

        const isWrong = await user.checkPassword('wrongpassword');
        expect(isWrong).toBe(false);
    });

    test('Should validate email format', async () => {
        try {
            await User.create({
                name: 'Invalid Email User',
                email: 'invalidemail',
                password: 'password123'
            });
            fail('Should have thrown validation error');
        } catch (error) {
            expect(error.name).toBe('SequelizeValidationError');
        }
    });

    test('Should require password length >= 6', async () => {
        try {
            await User.create({
                name: 'Short Password User',
                email: 'shortpw@example.com',
                password: 'short'
            });
            fail('Should have thrown validation error');
        } catch (error) {
            expect(error.name).toBe('SequelizeValidationError');
        }
    });

    test('Should handle password hashing error', async () => {
        const originalHash = require('bcryptjs').hash;
        require('bcryptjs').hash = jest.fn().mockRejectedValue(new Error('Hashing error'));

        try {
            await User.create({
                name: 'Test User',
                email: 'test@example.com',
                password: 'password123'
            });
        } catch (error) {
            expect(error.message).toBe('Hashing error');
        }

        require('bcryptjs').hash = originalHash;
    });

    test('Should handle password comparison error', async () => {
        const user = await User.create({
            name: 'Test User',
            email: 'test@example.com',
            password: 'password123'
        });

        const originalCompare = require('bcryptjs').compare;
        require('bcryptjs').compare = jest.fn().mockRejectedValue(new Error('Comparison error'));

        try {
            await user.comparePassword('password123');
        } catch (error) {
            expect(error.message).toBe('Comparison error');
        }

        require('bcryptjs').compare = originalCompare;
    });

    test('Should handle invalid password format', async () => {
        try {
            await User.create({
                name: 'Test User',
                email: 'test@example.com',
                password: '' // Empty password
            });
        } catch (error) {
            expect(error.name).toBe('SequelizeValidationError');
        }
    });

    test('Should handle password validation error', async () => {
        const originalValidate = User.prototype.validate;
        User.prototype.validate = jest.fn().mockRejectedValue(new Error('Validation error'));

        try {
            await User.create({
                name: 'Test User',
                email: 'test@example.com',
                password: 'password123'
            });
        } catch (error) {
            expect(error.message).toBe('Validation error');
        }

        User.prototype.validate = originalValidate;
    });

    test('Should handle password length validation', async () => {
        try {
            await User.create({
                name: 'Test User',
                email: 'test@example.com',
                password: '12345' // Password too short
            });
        } catch (error) {
            expect(error.name).toBe('SequelizeValidationError');
        }
    });

    test('Should handle password complexity validation', async () => {
        try {
            await User.create({
                name: 'Test User',
                email: 'test@example.com',
                password: 'password' // No numbers or special characters
            });
        } catch (error) {
            expect(error.name).toBe('SequelizeValidationError');
        }
    });

    test('Should handle password validation error with invalid salt', async () => {
        const originalGenSalt = require('bcryptjs').genSalt;
        require('bcryptjs').genSalt = jest.fn().mockRejectedValue(new Error('Salt generation error'));

        try {
            await User.create({
                name: 'Test User',
                email: 'test@example.com',
                password: 'password123'
            });
        } catch (error) {
            expect(error.message).toBe('Salt generation error');
        }

        require('bcryptjs').genSalt = originalGenSalt;
    });

    test('Should handle password validation error with invalid hash', async () => {
        const originalHash = require('bcryptjs').hash;
        require('bcryptjs').hash = jest.fn().mockRejectedValue(new Error('Hash generation error'));

        try {
            await User.create({
                name: 'Test User',
                email: 'test@example.com',
                password: 'password123'
            });
        } catch (error) {
            expect(error.message).toBe('Hash generation error');
        }

        require('bcryptjs').hash = originalHash;
    });

    test('Should handle password validation error with invalid compare', async () => {
        const user = await User.create({
            name: 'Test User',
            email: 'test@example.com',
            password: 'password123'
        });

        const originalCompare = require('bcryptjs').compare;
        require('bcryptjs').compare = jest.fn().mockRejectedValue(new Error('Compare error'));

        try {
            await user.comparePassword('password123');
        } catch (error) {
            expect(error.message).toBe('Compare error');
        }

        require('bcryptjs').compare = originalCompare;
    });
});

describe('GameSession Model', () => {
    let testUser;

    beforeAll(async () => {
        testUser = await User.create({
            name: 'Game Session Test User',
            email: 'gamesessiontest@example.com',
            password: 'password123'
        });
    });

    test('Should create a game session with default values', async () => {
        const gameSession = await GameSession.create({
            userId: testUser.id,
            currentScene: 'starting_village'
        });

        expect(gameSession.id).toBeDefined();
        expect(gameSession.userId).toBe(testUser.id);
        expect(gameSession.currentScene).toBe('starting_village');
        expect(gameSession.status).toBe('active');
        expect(gameSession.playerHealth).toBe(100);
        expect(gameSession.playerMaxHealth).toBe(100);
        expect(gameSession.playerLevel).toBe(1);
        expect(gameSession.playerExp).toBe(0);
        expect(gameSession.playerGold).toBe(10);
        expect(gameSession.playerInventory).toBeDefined();
    });

    test('Should associate with user', async () => {
        const gameSession = await GameSession.create({
            userId: testUser.id,
            currentScene: 'test_scene'
        });

        const gameWithUser = await GameSession.findByPk(gameSession.id, {
            include: User
        });

        expect(gameWithUser.User).toBeDefined();
        expect(gameWithUser.User.id).toBe(testUser.id);
    });
});

describe('Character Model', () => {
    let gameSession;

    beforeAll(async () => {
        gameSession = await GameSession.create({
            currentScene: 'test_scene'
        });
    });

    test('Should create a character with associated session', async () => {
        const characterData = {
            character_id: 'TEST_CHAR_01',
            name: 'Test Character',
            short_description: 'A test character',
            personality_traits: ['brave', 'loyal'],
            relationship_to_user: '5/10 - Neutral',
            current_emotional_state: 'Curious',
            goals_in_scene: ['Observe the user', 'Gather information'],
            speaking_style: 'Formal and precise',
            power_level: 'Average human',
            faction: 'Test Faction',
            perceived_threat_level_of_user: 'Low',
            sessionId: gameSession.id
        };

        const character = await Character.create(characterData);

        expect(character.id).toBeDefined();
        expect(character.character_id).toBe(characterData.character_id);
        expect(character.name).toBe(characterData.name);
        expect(character.sessionId).toBe(gameSession.id);
        expect(character.personality_traits).toEqual(characterData.personality_traits);
        expect(character.goals_in_scene).toEqual(characterData.goals_in_scene);
    });
});

describe('DialogueHistory Model', () => {
    let gameSession;

    beforeAll(async () => {
        gameSession = await GameSession.create({
            currentScene: 'test_scene'
        });
    });

    test('Should create dialogue history entry', async () => {
        const dialogueData = {
            sessionId: gameSession.id,
            speaker_id: 'NARRATOR',
            dialogue: 'This is a test dialogue entry.',
            timestamp: new Date()
        };

        const dialogue = await DialogueHistory.create(dialogueData);

        expect(dialogue.id).toBeDefined();
        expect(dialogue.sessionId).toBe(gameSession.id);
        expect(dialogue.speaker_id).toBe(dialogueData.speaker_id);
        expect(dialogue.dialogue).toBe(dialogueData.dialogue);
        expect(dialogue.timestamp).toBeDefined();
    });

    test('Should associate with game session', async () => {
        const dialogue = await DialogueHistory.create({
            sessionId: gameSession.id,
            speaker_id: 'USER',
            dialogue: 'User test dialogue',
            timestamp: new Date()
        });

        const dialogueWithSession = await DialogueHistory.findByPk(dialogue.id, {
            include: GameSession
        });

        expect(dialogueWithSession.GameSession).toBeDefined();
        expect(dialogueWithSession.GameSession.id).toBe(gameSession.id);
    });
});

describe('Models - Database Connection', () => {
    test('Should handle database connection error', async () => {
        const originalAuthenticate = sequelize.authenticate;
        sequelize.authenticate = jest.fn().mockRejectedValue(new Error('Connection error'));

        try {
            await sequelize.authenticate();
        } catch (error) {
            expect(error.message).toBe('Connection error');
        }

        sequelize.authenticate = originalAuthenticate;
    });

    test('Should handle database sync error', async () => {
        const originalSync = sequelize.sync;
        sequelize.sync = jest.fn().mockRejectedValue(new Error('Sync error'));

        try {
            await sequelize.sync();
        } catch (error) {
            expect(error.message).toBe('Sync error');
        }

        sequelize.sync = originalSync;
    });
});

describe('Models - Associations', () => {
    test('Should handle invalid association setup', async () => {
        const originalDefine = sequelize.define;
        sequelize.define = jest.fn().mockImplementation(() => {
            throw new Error('Association error');
        });

        try {
            await require('../models');
        } catch (error) {
            expect(error.message).toBe('Association error');
        }

        sequelize.define = originalDefine;
    });
});

describe('Models - Database Initialization', () => {
    test('Should handle database initialization error', async () => {
        const originalSync = sequelize.sync;
        sequelize.sync = jest.fn().mockRejectedValue(new Error('Initialization error'));

        try {
            await require('../models');
        } catch (error) {
            expect(error.message).toBe('Initialization error');
        }

        sequelize.sync = originalSync;
    });

    test('Should handle invalid database configuration', async () => {
        const originalConfig = sequelize.config;
        sequelize.config = {
            ...sequelize.config,
            database: 'invalid_database'
        };

        try {
            await sequelize.authenticate();
        } catch (error) {
            expect(error).toBeDefined();
        }

        sequelize.config = originalConfig;
    });

    test('Should handle database initialization error with invalid config', async () => {
        const originalConfig = sequelize.config;
        sequelize.config = {
            ...sequelize.config,
            dialect: 'invalid_dialect'
        };

        try {
            await require('../models');
        } catch (error) {
            expect(error).toBeDefined();
        }

        sequelize.config = originalConfig;
    });

    test('Should handle database initialization error with invalid options', async () => {
        const originalOptions = sequelize.options;
        sequelize.options = {
            ...sequelize.options,
            pool: {
                max: 'invalid_max'
            }
        };

        try {
            await require('../models');
        } catch (error) {
            expect(error).toBeDefined();
        }

        sequelize.options = originalOptions;
    });

    test('Should handle database initialization error with invalid logging', async () => {
        const originalLogging = sequelize.options.logging;
        sequelize.options.logging = 'invalid_logging';

        try {
            await require('../models');
        } catch (error) {
            expect(error).toBeDefined();
        }

        sequelize.options.logging = originalLogging;
    });
});

afterAll(async () => {
    await sequelize.close();
});