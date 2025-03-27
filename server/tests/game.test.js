const request = require('supertest');
const app = require('../app');
const { User, GameSession, DialogueHistory, Character, sequelize } = require('../models');
const jwt = require('jsonwebtoken');
const { generateDialogueOptions } = require('../utils/geminiAI');

// Mock the geminiAI module
jest.mock('../utils/geminiAI', () => ({
    generateDialogueOptions: jest.fn()
}));

let testUser;
let userToken;
let gameSessionId;

beforeAll(async () => {
    await sequelize.sync({ force: true }); // Reset database

    // Create test user
    testUser = await User.create({
        name: 'Game Test User',
        email: 'gametest@example.com',
        password: 'password123'
    });

    // Generate token for authenticated routes
    userToken = jwt.sign(
        { id: testUser.id, email: testUser.email, name: testUser.name },
        process.env.JWT_SECRET
    );

    // Setup mock response for geminiAI
    generateDialogueOptions.mockResolvedValue({
        "Character Cards": [],
        "Character Dialogues": [
            {
                speaker_id: "GUARD_ER_01",
                dialogue: "Hold it right there, stranger! State your business in E-Rantel."
            }
        ],
        "User Options": [
            {
                option_id: "A",
                dialogue_text: "I'm just a traveler seeking shelter.",
                predicted_tone: ["polite", "honest"],
                predicted_character_reactions: {},
                reasoning: "Simple, non-threatening approach",
                risk_assessment: "Low risk"
            },
            {
                option_id: "B",
                dialogue_text: "None of your business, guard.",
                predicted_tone: ["hostile", "dismissive"],
                predicted_character_reactions: {},
                reasoning: "Confrontational approach",
                risk_assessment: "High risk"
            },
            {
                option_id: "C",
                dialogue_text: "I'm not sure myself. I just arrived here.",
                predicted_tone: ["confused", "honest"],
                predicted_character_reactions: {},
                reasoning: "Honest confusion",
                risk_assessment: "Medium risk"
            },
            {
                option_id: "D",
                dialogue_text: "I have important information for your superiors.",
                predicted_tone: ["urgent", "important"],
                predicted_character_reactions: {},
                reasoning: "Appeal to authority",
                risk_assessment: "Medium risk"
            }
        ],
        "Game Session Updates": {}
    });
});

describe('Game API', () => {
    describe('POST /api/game/init', () => {
        test('Should initialize a new game session', async () => {
            const response = await request(app)
                .post('/api/game/init')
                .set('Authorization', `Bearer ${ userToken }`);

            expect(response.statusCode).toBe(201);
            expect(response.body).toHaveProperty('sessionId');
            expect(response.body).toHaveProperty('message', 'Game initialized successfully');

            gameSessionId = response.body.sessionId;

            // Verify that the game session was created in the database
            const gameSession = await GameSession.findByPk(gameSessionId);
            expect(gameSession).toBeTruthy();
            expect(gameSession.userId).toBe(testUser.id);

            // Verify that initial characters and dialogues were created
            const characters = await Character.findAll({ where: { sessionId: gameSessionId } });
            expect(characters.length).toBeGreaterThan(0);

            const dialogues = await DialogueHistory.findAll({ where: { sessionId: gameSessionId } });
            expect(dialogues.length).toBeGreaterThan(0);
        });

        test('Should reject initialization without authentication', async () => {
            const response = await request(app)
                .post('/api/game/init');

            expect(response.statusCode).toBe(401);
        });
    });

    describe('GET /api/game/session/:sessionId/options', () => {
        test('Should get dialogue options for a session', async () => {
            const response = await request(app)
                .get(`/api/game/session/${ gameSessionId }/options`)
                .set('Authorization', `Bearer ${ userToken }`);

            expect(response.statusCode).toBe(200);
            expect(response.body).toHaveProperty('options');
            expect(Array.isArray(response.body.options)).toBe(true);
            expect(response.body.options.length).toBe(4);
        });

        test('Should reject request for non-existent session', async () => {
            const response = await request(app)
                .get('/api/game/session/999999/options')
                .set('Authorization', `Bearer ${ userToken }`);

            expect(response.statusCode).toBe(500);
        });
    });

    describe('GET /api/game/session/:sessionId/history', () => {
        test('Should get dialogue history for a session', async () => {
            const response = await request(app)
                .get(`/api/game/session/${ gameSessionId }/history`)
                .set('Authorization', `Bearer ${ userToken }`);

            expect(response.statusCode).toBe(200);
            expect(response.body).toHaveProperty('dialogueHistory');
            expect(Array.isArray(response.body.dialogueHistory)).toBe(true);
        });
    });

    describe('POST /api/game/session/:sessionId/select', () => {
        test('Should select a dialogue option', async () => {
            const response = await request(app)
                .post(`/api/game/session/${ gameSessionId }/select`)
                .set('Authorization', `Bearer ${ userToken }`)
                .send({
                    optionId: 'A',
                    dialogue: "I'm just a traveler seeking shelter."
                });

            expect(response.statusCode).toBe(200);
            expect(response.body).toHaveProperty('message', 'Option selected successfully');

            // Verify that the dialogue was added to history
            const dialogues = await DialogueHistory.findAll({
                where: {
                    sessionId: gameSessionId,
                    speaker_id: 'USER',
                    dialogue: "I'm just a traveler seeking shelter."
                }
            });

            expect(dialogues.length).toBe(1);
        });
    });

    describe('GET /api/game/session/:sessionId/status', () => {
        test('Should get player status', async () => {
            const response = await request(app)
                .get(`/api/game/session/${ gameSessionId }/status`)
                .set('Authorization', `Bearer ${ userToken }`);

            expect(response.statusCode).toBe(200);
            expect(response.body).toHaveProperty('health');
            expect(response.body).toHaveProperty('maxHealth');
            expect(response.body).toHaveProperty('level');
            expect(response.body).toHaveProperty('experience');
            expect(response.body).toHaveProperty('gold');
            expect(response.body).toHaveProperty('inventory');
        });
    });

    describe('GET /api/game/session/:sessionId/characters', () => {
        test('Should get characters for a session', async () => {
            const response = await request(app)
                .get(`/api/game/session/${ gameSessionId }/characters`)
                .set('Authorization', `Bearer ${ userToken }`);

            expect(response.statusCode).toBe(200);
            expect(response.body).toHaveProperty('characters');
            expect(Array.isArray(response.body.characters)).toBe(true);
            expect(response.body.characters.length).toBeGreaterThan(0);
        });
    });

    describe('GET /api/game/sessions', () => {
        test('Should get all user sessions', async () => {
            const response = await request(app)
                .get('/api/game/sessions')
                .set('Authorization', `Bearer ${ userToken }`);

            expect(response.statusCode).toBe(200);
            expect(response.body).toHaveProperty('sessions');
            expect(Array.isArray(response.body.sessions)).toBe(true);
            expect(response.body.sessions.length).toBeGreaterThan(0);
        });
    });

    describe('DELETE /api/game/session/:sessionId', () => {
        test('Should delete a session', async () => {
            const response = await request(app)
                .delete(`/api/game/session/${ gameSessionId }`)
                .set('Authorization', `Bearer ${ userToken }`);

            expect(response.statusCode).toBe(200);
            expect(response.body).toHaveProperty('message', 'Session deleted successfully');

            // Verify that the session was deleted
            const gameSession = await GameSession.findByPk(gameSessionId);
            expect(gameSession).toBeNull();

            // Verify that related records were deleted
            const characters = await Character.findAll({ where: { sessionId: gameSessionId } });
            expect(characters.length).toBe(0);

            const dialogues = await DialogueHistory.findAll({ where: { sessionId: gameSessionId } });
            expect(dialogues.length).toBe(0);
        });

        test('Should reject deletion of non-existent session', async () => {
            const response = await request(app)
                .delete(`/api/game/session/${ gameSessionId }`)
                .set('Authorization', `Bearer ${ userToken }`);

            expect(response.statusCode).toBe(404);
            expect(response.body).toHaveProperty('error');
        });
    });
});

afterAll(async () => {
    await sequelize.close();
});