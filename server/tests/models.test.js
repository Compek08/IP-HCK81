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

afterAll(async () => {
    await sequelize.close();
});