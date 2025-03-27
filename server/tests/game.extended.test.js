const request = require('supertest');
const app = require('../app');
const { User, GameSession, DialogueHistory, Character, sequelize } = require('../models');
const jwt = require('jsonwebtoken');
const { generateDialogueOptions } = require('../utils/geminiAI');
const gameController = require('../controllers/gameController');

// Mock the geminiAI module
jest.mock('../utils/geminiAI', () => ({
  generateDialogueOptions: jest.fn()
}));

describe('Game Controller - Extended Tests', () => {
  let testUser;
  let userToken;
  let gameSessionId;
  
  beforeAll(async () => {
    await sequelize.sync({ force: true });
    
    // Create test user
    testUser = await User.create({
      name: 'Extended Game Test User',
      email: 'extendedgametest@example.com',
      password: 'password123'
    });
    
    // Generate token for authenticated routes
    userToken = jwt.sign(
      { id: testUser.id, email: testUser.email, name: testUser.name },
      process.env.JWT_SECRET
    );
  });
  
  // Test error handling in initGame
  describe('Error handling in game initialization', () => {
    const originalCreate = GameSession.create;
    
    beforeEach(() => {
      // Reset the mocks
      jest.clearAllMocks();
      GameSession.create = originalCreate;
    });
    
    test('Should handle database error during game initialization', async () => {
      GameSession.create = jest.fn().mockImplementation(() => {
        throw new Error('Database error');
      });
      
      const response = await request(app)
        .post('/api/game/init')
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(response.statusCode).toBe(500);
    });
  });
  
  // Initialize a game for subsequent tests
  beforeEach(async () => {
    // Generate mock AI response for tests
    generateDialogueOptions.mockResolvedValue({
      "Character Cards": [
        {
          character_id: "GUARD_ER_01",
          name: "Borin",
          relationship_to_user: "3/10 - Slightly suspicious"
        }
      ],
      "Character Dialogues": [
        {
          speaker_id: "GUARD_ER_01",
          dialogue: "What's your business in town?"
        }
      ],
      "User Options": [
        {
          option_id: "A",
          dialogue_text: "I'm just passing through.",
          predicted_tone: ["neutral"]
        },
        {
          option_id: "B",
          dialogue_text: "I seek shelter for the night.",
          predicted_tone: ["polite"]
        },
        {
          option_id: "C",
          dialogue_text: "None of your business.",
          predicted_tone: ["rude"]
        },
        {
          option_id: "D",
          dialogue_text: "I'm not sure myself, I just arrived.",
          predicted_tone: ["confused"]
        }
      ],
      "Game Session Updates": {
        health: 90,
        experience: 5,
        gold: 15,
        inventory: JSON.stringify({
          items: [
            { id: 1, name: "Health Potion", quantity: 2, effect: "Restores 20 HP" },
            { id: 2, name: "Basic Sword", quantity: 1, effect: "5 ATK" }
          ]
        }),
        status: "active"
      }
    });
    
    // Create a game session if needed
    if (!gameSessionId) {
      const response = await request(app)
        .post('/api/game/init')
        .set('Authorization', `Bearer ${userToken}`);
      
      gameSessionId = response.body.sessionId;
    }
  });
  
  // Test Game Session Updates from AI
  describe('Game session updates from AI', () => {
    test('Should update game session with AI-provided stats', async () => {
      // First get options to trigger the update
      await request(app)
        .get(`/api/game/session/${gameSessionId}/options`)
        .set('Authorization', `Bearer ${userToken}`);
      
      // Now check if the game session was updated
      const gameSession = await GameSession.findByPk(gameSessionId);
      expect(gameSession.playerHealth).toBe(90);
      expect(gameSession.playerExp).toBe(5);
      expect(gameSession.playerGold).toBe(15);
      
      // Verify inventory was updated
      const inventory = JSON.parse(gameSession.playerInventory);
      expect(inventory.items.length).toBe(2);
      expect(inventory.items[0].name).toBe("Health Potion");
    });
    
    test('Should handle invalid game session updates gracefully', async () => {
      // Setup AI to return invalid types for updates
      generateDialogueOptions.mockResolvedValueOnce({
        "Character Cards": [],
        "Character Dialogues": [
          {
            speaker_id: "GUARD_ER_01",
            dialogue: "What's your business in town?"
          }
        ],
        "User Options": [
          {
            option_id: "A",
            dialogue_text: "I'm just passing through.",
            predicted_tone: ["neutral"]
          },
          {
            option_id: "B",
            dialogue_text: "I seek shelter for the night.",
            predicted_tone: ["polite"]
          },
          {
            option_id: "C",
            dialogue_text: "None of your business.",
            predicted_tone: ["rude"]
          },
          {
            option_id: "D",
            dialogue_text: "I'm not sure myself, I just arrived.",
            predicted_tone: ["confused"]
          }
        ],
        "Game Session Updates": {
          health: "not-a-number",
          experience: "five",
          gold: "fifteen",
          inventory: "invalid-json",
          status: "invalid-status"
        }
      });
      
      // Get options to trigger the update with invalid data
      const response = await request(app)
        .get(`/api/game/session/${gameSessionId}/options`)
        .set('Authorization', `Bearer ${userToken}`);
      
      // Check response is still valid
      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('options');
      
      // Verify game session wasn't corrupted
      const gameSession = await GameSession.findByPk(gameSessionId);
      expect(typeof gameSession.playerHealth).toBe('number');
      expect(typeof gameSession.playerExp).toBe('number');
      expect(typeof gameSession.playerGold).toBe('number');
    });
  });
  
  // Test error cases for getPlayerStatus
  describe('Get player status error handling', () => {
    test('Should handle non-existent session ID', async () => {
      const response = await request(app)
        .get('/api/game/session/99999/status')
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(response.statusCode).toBe(500);
    });
    
    test('Should handle database errors gracefully', async () => {
      const originalFindGameSession = gameController.findGameSession;
      gameController.findGameSession = jest.fn().mockImplementation(() => {
        throw new Error('Database error');
      });
      
      const response = await request(app)
        .get(`/api/game/session/${gameSessionId}/status`)
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(response.statusCode).toBe(500);
      gameController.findGameSession = originalFindGameSession;
    });
  });
  
  // Test Character updates from AI
  describe('Character updates from AI', () => {
    test('Should update characters based on AI response', async () => {
      // Setup AI to return character updates
      generateDialogueOptions.mockResolvedValueOnce({
        "Character Cards": [
          {
            character_id: "GUARD_ER_01",
            name: "Borin",
            relationship_to_user: "4/10 - Somewhat friendly now",
            current_emotional_state: "Amused"
          }
        ],
        "Character Dialogues": [
          {
            speaker_id: "GUARD_ER_01",
            dialogue: "You seem harmless enough."
          }
        ],
        "User Options": [
          {
            option_id: "A",
            dialogue_text: "Thanks, I guess.",
            predicted_tone: ["neutral"]
          },
          {
            option_id: "B",
            dialogue_text: "I appreciate that.",
            predicted_tone: ["grateful"]
          },
          {
            option_id: "C",
            dialogue_text: "I'm stronger than I look.",
            predicted_tone: ["prideful"]
          },
          {
            option_id: "D",
            dialogue_text: "Can I enter the city now?",
            predicted_tone: ["impatient"]
          }
        ],
        "Game Session Updates": {}
      });
      
      // Trigger the update
      await request(app)
        .get(`/api/game/session/${gameSessionId}/options`)
        .set('Authorization', `Bearer ${userToken}`);
      
      // Check if character was updated
      const characters = await Character.findAll({ 
        where: { 
          sessionId: gameSessionId,
          character_id: "GUARD_ER_01"
        } 
      });
      
      expect(characters.length).toBe(1);
      expect(characters[0].relationship_to_user).toBe("4/10 - Somewhat friendly now");
      expect(characters[0].current_emotional_state).toBe("Amused");
    });
  });
  
  // Test deleteSession edge cases
  describe('Delete session edge cases', () => {
    test('Should handle unauthorized delete', async () => {
      // Create another user
      const anotherUser = await User.create({
        name: 'Another User',
        email: 'another@user.com',
        password: 'password123'
      });
      
      const anotherToken = jwt.sign(
        { id: anotherUser.id, email: anotherUser.email, name: anotherUser.name },
        process.env.JWT_SECRET
      );
      
      // Try to delete session with another user's token
      const response = await request(app)
        .delete(`/api/game/session/${gameSessionId}`)
        .set('Authorization', `Bearer ${anotherToken}`);
      
      expect(response.statusCode).toBe(404);
      expect(response.body).toHaveProperty('error', 'Session not found or unauthorized');
    });
    
    test('Should handle database error during deletion', async () => {
      const originalDestroy = DialogueHistory.destroy;
      DialogueHistory.destroy = jest.fn().mockImplementation(() => {
        throw new Error('Database error');
      });
      
      const response = await request(app)
        .delete(`/api/game/session/${gameSessionId}`)
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(response.statusCode).toBe(500);
      DialogueHistory.destroy = originalDestroy;
    });
  });
  
  afterAll(async () => {
    await sequelize.close();
  });
});