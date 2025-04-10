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

describe('Extended Model Tests', () => {
    describe('User Model Associations', () => {
        let testUser;
        let gameSession;

        beforeAll(async () => {
            testUser = await User.create({
                name: 'Association Test User',
                email: 'associationtest@example.com',
                password: 'password123'
            });

            gameSession = await GameSession.create({
                userId: testUser.id,
                currentScene: 'test_scene'
            });
        });

        test('Should have many game sessions', async () => {
            const userWithSessions = await User.findByPk(testUser.id, {
                include: GameSession
            });

            expect(userWithSessions.GameSessions).toBeDefined();
            expect(userWithSessions.GameSessions.length).toBe(1);
            expect(userWithSessions.GameSessions[0].id).toBe(gameSession.id);
        });

        test('Should handle cascading delete', async () => {
            await testUser.destroy();

            const deletedSession = await GameSession.findByPk(gameSession.id);
            expect(deletedSession).toBeNull();
        });
    });

    describe('GameSession Model Associations', () => {
        let gameSession;
        let character;
        let dialogue;

        beforeAll(async () => {
            gameSession = await GameSession.create({
                currentScene: 'test_scene'
            });

            character = await Character.create({
                character_id: 'TEST_CHAR_02',
                name: 'Test Character 2',
                short_description: 'Another test character',
                personality_traits: ['friendly', 'helpful'],
                relationship_to_user: '7/10 - Friendly',
                current_emotional_state: 'Happy',
                goals_in_scene: ['Help the user', 'Make friends'],
                speaking_style: 'Friendly and casual',
                power_level: 'Average human',
                faction: 'Test Faction',
                perceived_threat_level_of_user: 'None',
                sessionId: gameSession.id
            });

            dialogue = await DialogueHistory.create({
                sessionId: gameSession.id,
                speaker_id: character.character_id,
                dialogue: 'Hello there!',
                timestamp: new Date()
            });
        });

        test('Should have many characters', async () => {
            const sessionWithCharacters = await GameSession.findByPk(gameSession.id, {
                include: Character
            });

            expect(sessionWithCharacters.Characters).toBeDefined();
            expect(sessionWithCharacters.Characters.length).toBe(1);
            expect(sessionWithCharacters.Characters[0].id).toBe(character.id);
        });

        test('Should have many dialogue histories', async () => {
            const sessionWithDialogues = await GameSession.findByPk(gameSession.id, {
                include: DialogueHistory
            });

            expect(sessionWithDialogues.DialogueHistories).toBeDefined();
            expect(sessionWithDialogues.DialogueHistories.length).toBe(1);
            expect(sessionWithDialogues.DialogueHistories[0].id).toBe(dialogue.id);
        });

        test('Should handle cascading delete for characters and dialogues', async () => {
            await gameSession.destroy();

            const deletedCharacter = await Character.findByPk(character.id);
            const deletedDialogue = await DialogueHistory.findByPk(dialogue.id);

            expect(deletedCharacter).toBeNull();
            expect(deletedDialogue).toBeNull();
        });
    });

    describe('Character Model Associations', () => {
        let gameSession;
        let character;
        let dialogue;

        beforeAll(async () => {
            gameSession = await GameSession.create({
                currentScene: 'test_scene'
            });

            character = await Character.create({
                character_id: 'TEST_CHAR_03',
                name: 'Test Character 3',
                short_description: 'Yet another test character',
                personality_traits: ['mysterious', 'quiet'],
                relationship_to_user: '3/10 - Distant',
                current_emotional_state: 'Neutral',
                goals_in_scene: ['Observe', 'Stay hidden'],
                speaking_style: 'Minimal and cryptic',
                power_level: 'Unknown',
                faction: 'Unknown',
                perceived_threat_level_of_user: 'Unknown',
                sessionId: gameSession.id
            });

            dialogue = await DialogueHistory.create({
                sessionId: gameSession.id,
                speaker_id: character.character_id,
                dialogue: '...',
                timestamp: new Date()
            });
        });

        test('Should have many dialogues', async () => {
            const characterWithDialogues = await Character.findByPk(character.id, {
                include: {
                    model: DialogueHistory,
                    as: 'dialogues'
                }
            });

            expect(characterWithDialogues.dialogues).toBeDefined();
            expect(characterWithDialogues.dialogues.length).toBe(1);
            expect(characterWithDialogues.dialogues[0].id).toBe(dialogue.id);
        });

        test('Should belong to game session', async () => {
            const characterWithSession = await Character.findByPk(character.id, {
                include: GameSession
            });

            expect(characterWithSession.GameSession).toBeDefined();
            expect(characterWithSession.GameSession.id).toBe(gameSession.id);
        });
    });

    describe('DialogueHistory Model Associations', () => {
        let gameSession;
        let character;
        let dialogue;

        beforeAll(async () => {
            gameSession = await GameSession.create({
                currentScene: 'test_scene'
            });

            character = await Character.create({
                character_id: 'TEST_CHAR_04',
                name: 'Test Character 4',
                short_description: 'Final test character',
                personality_traits: ['wise', 'patient'],
                relationship_to_user: '8/10 - Mentor',
                current_emotional_state: 'Calm',
                goals_in_scene: ['Guide the user', 'Share wisdom'],
                speaking_style: 'Wise and measured',
                power_level: 'Experienced',
                faction: 'Wise Ones',
                perceived_threat_level_of_user: 'Student',
                sessionId: gameSession.id
            });

            dialogue = await DialogueHistory.create({
                sessionId: gameSession.id,
                speaker_id: character.character_id,
                dialogue: 'Listen carefully, young one.',
                timestamp: new Date()
            });
        });

        test('Should belong to game session', async () => {
            const dialogueWithSession = await DialogueHistory.findByPk(dialogue.id, {
                include: GameSession
            });

            expect(dialogueWithSession.GameSession).toBeDefined();
            expect(dialogueWithSession.GameSession.id).toBe(gameSession.id);
        });

        test('Should belong to character', async () => {
            const dialogueWithCharacter = await DialogueHistory.findByPk(dialogue.id, {
                include: {
                    model: Character,
                    as: 'character'
                }
            });

            expect(dialogueWithCharacter.character).toBeDefined();
            expect(dialogueWithCharacter.character.id).toBe(character.id);
        });
    });
});

afterAll(async () => {
    await sequelize.close();
});