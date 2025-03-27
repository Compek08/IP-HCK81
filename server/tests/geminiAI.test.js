const { generateDialogueOptions } = require('../utils/geminiAI');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Mock the Google Generative AI library
jest.mock('@google/generative-ai', () => {
  return {
    GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
      getGenerativeModel: jest.fn().mockReturnValue({
        generateContent: jest.fn().mockImplementation(async () => ({
          response: {
            text: () => JSON.stringify({
              "Character Cards": [
                {
                  "character_id": "GUARD_ER_01",
                  "name": "Borin",
                  "relationship_to_user": "3/10 - Cautious"
                }
              ],
              "Character Dialogues": [
                {
                  "speaker_id": "GUARD_ER_01",
                  "dialogue": "State your business in E-Rantel."
                }
              ],
              "User Options": [
                {
                  "option_id": "A",
                  "dialogue_text": "I'm a traveler seeking lodging.",
                  "predicted_tone": ["polite", "straightforward"]
                },
                {
                  "option_id": "B",
                  "dialogue_text": "I have important business with the guild.",
                  "predicted_tone": ["formal", "slightly evasive"]
                },
                {
                  "option_id": "C",
                  "dialogue_text": "None of your business.",
                  "predicted_tone": ["hostile", "dismissive"]
                },
                {
                  "option_id": "D",
                  "dialogue_text": "I'm not sure. I just arrived here.",
                  "predicted_tone": ["confused", "honest"]
                }
              ],
              "Game Session Updates": {
                "health": 100,
                "gold": 12
              }
            })
          }
        }))
      })
    })),
    HarmCategory: {
      HARM_CATEGORY_HARASSMENT: 'HARM_CATEGORY_HARASSMENT',
      HARM_CATEGORY_HATE_SPEECH: 'HARM_CATEGORY_HATE_SPEECH',
      HARM_CATEGORY_SEXUALLY_EXPLICIT: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
      HARM_CATEGORY_DANGEROUS_CONTENT: 'HARM_CATEGORY_DANGEROUS_CONTENT'
    },
    HarmBlockThreshold: {
      BLOCK_ONLY_HIGH: 'BLOCK_ONLY_HIGH'
    }
  };
});

describe('GeminiAI Utility', () => {
  // Save and restore environment variables
  const originalEnv = process.env.GEMINI_API_KEY;
  
  beforeAll(() => {
    process.env.GEMINI_API_KEY = 'test-api-key';
  });
  
  afterAll(() => {
    process.env.GEMINI_API_KEY = originalEnv;
  });
  
  test('Should initialize the Gemini client with API key', () => {
    // Require the module again to test initialization
    jest.resetModules();
    require('../utils/geminiAI');
    
    // Verify GoogleGenerativeAI was initialized with the API key
    expect(GoogleGenerativeAI).toHaveBeenCalledWith('test-api-key');
  });
  
  test('Should generate dialogue options successfully', async () => {
    // Mock character and chat history data
    const characters = [
      {
        character_id: "GUARD_ER_01",
        name: "Borin",
        short_description: "A gruff city guard",
        personality_traits: ["suspicious", "dutiful"],
        relationship_to_user: "2/10 - Distrustful",
        current_emotional_state: "Alert",
        speaking_style: "Stern and official"
      }
    ];
    
    const chatHistory = [
      {
        speaker_id: "NARRATOR",
        dialogue: "You arrive at the gates of E-Rantel.",
        timestamp: new Date()
      }
    ];
    
    const playerStatus = {
      health: 100,
      maxHealth: 100,
      level: 1,
      experience: 0,
      gold: 10,
      inventory: { items: [] }
    };
    
    // Call the function
    const result = await generateDialogueOptions(characters, chatHistory, playerStatus);
    
    // Verify result structure
    expect(result).toHaveProperty('Character Cards');
    expect(result).toHaveProperty('Character Dialogues');
    expect(result).toHaveProperty('User Options');
    expect(result).toHaveProperty('Game Session Updates');
    
    // Verify the data
    expect(result['Character Cards'][0].character_id).toBe('GUARD_ER_01');
    expect(result['Character Dialogues'][0].dialogue).toBe('State your business in E-Rantel.');
    expect(result['User Options'].length).toBe(4);
    expect(result['Game Session Updates'].health).toBe(100);
  });
  
  test('Should handle API error gracefully', async () => {
    // Setup the mock to simulate an error
    const mockGenerateContent = jest.fn().mockImplementation(() => {
      throw new Error('API Error');
    });
    
    GoogleGenerativeAI.mockImplementation(() => ({
      getGenerativeModel: jest.fn().mockReturnValue({
        generateContent: mockGenerateContent
      })
    }));
    
    // Call the function and expect it to reject
    await expect(generateDialogueOptions([], [], {})).rejects.toThrow('API Error');
  });
  
  test('Should handle malformed response format', async () => {
    // Setup the mock to return malformed JSON
    GoogleGenerativeAI.mockImplementation(() => ({
      getGenerativeModel: jest.fn().mockReturnValue({
        generateContent: jest.fn().mockImplementation(async () => ({
          response: {
            text: () => `Not valid JSON`
          }
        }))
      })
    }));
    
    // Call the function and expect it to reject
    await expect(generateDialogueOptions([], [], {})).rejects.toThrow();
  });
  
  test('Should handle alternative response formats', async () => {
    // Setup the mock to return a different format
    GoogleGenerativeAI.mockImplementation(() => ({
      getGenerativeModel: jest.fn().mockReturnValue({
        generateContent: jest.fn().mockImplementation(async () => ({
          response: {
            text: () => `\`\`\`json
            {
              "character_card": [
                {
                  "character_id": "GUARD_ER_01",
                  "name": "Borin"
                }
              ],
              "character_dialogues": [
                {
                  "speaker_id": "GUARD_ER_01",
                  "dialogue": "Who goes there?"
                }
              ],
              "output": [
                {
                  "option_id": "A",
                  "dialogue_text": "A friend."
                },
                {
                  "option_id": "B",
                  "dialogue_text": "A traveler."
                },
                {
                  "option_id": "C",
                  "dialogue_text": "An enemy."
                },
                {
                  "option_id": "D",
                  "dialogue_text": "I'm lost."
                }
              ]
            }
            \`\`\``
          }
        }))
      })
    }));
    
    // Call the function
    const result = await generateDialogueOptions([], [], {});
    
    // Verify the data was properly transformed
    expect(result).toHaveProperty('Character Cards');
    expect(result).toHaveProperty('Character Dialogues');
    expect(result).toHaveProperty('User Options');
    
    expect(result['Character Cards'][0].character_id).toBe('GUARD_ER_01');
    expect(result['Character Dialogues'][0].dialogue).toBe('Who goes there?');
    expect(result['User Options'].length).toBe(4);
  });
  
  test('Should throw error if API key is missing', () => {
    // Temporarily remove API key
    const tempApiKey = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;
    
    // Require the module again to test initialization
    jest.resetModules();
    
    // Expect error when initializing without API key
    expect(() => {
      require('../utils/geminiAI');
    }).toThrow('GEMINI_API_KEY environment variable not set.');
    
    // Restore API key
    process.env.GEMINI_API_KEY = tempApiKey;
  });
});