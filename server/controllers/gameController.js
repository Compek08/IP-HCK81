const { Character, GameSession, DialogueHistory } = require('../models');
const { generateDialogueOptions } = require('../utils/geminiAI');
const { generateImagePrompt, generateImage } = require('../utils/imageGen');

// Helper function to find a game session
const findGameSession = async (sessionId) => {
    const gameSession = await GameSession.findByPk(sessionId);
    if (!gameSession) {
        throw new Error('Game session not found');
    }
    return gameSession;
};

// Helper function to create initial characters
const createInitialCharacters = async (gameSessionId) => {
    const characterData = [
        {
            character_id: "GAZ_01",
            name: "Gazef Stronoff",
            short_description: "A Warrior Captain of Re-Estize Kingdom, but seems...off.",
            personality_traits: ["arrogant", "overconfident", "cruel", "sadistic"],
            relationship_to_user: "2/10 - Sees the user as insignificant.",
            current_emotional_state: "Bored and looking for amusement",
            goals_in_scene: ["Test the user's strength (for his own amusement)", "Humiliate the user"],
            speaking_style: "Condescending and mocking.",
            hidden_information: "Is actually a powerful undead creature disguised as Gazef.",
            power_level: "Overwhelmingly powerful (Nazarick level)",
            faction: "Nazarick (Suspected)",
            perceived_threat_level_of_user: "Non-threat",
            sessionId: gameSessionId,
        },
        {
            character_id: "GUARD_ER_01",
            name: "Borin",
            short_description: "A grizzled, weary city guard stationed at the main gate of E-Rantel.",
            personality_traits: ["suspicious", "dutiful", "impatient", "jaded", "slightly pragmatic"],
            relationship_to_user: "2/10 - Views user as an unidentified, strangely dressed potential problem.",
            current_emotional_state: "Bored, mildly suspicious, slightly annoyed",
            goals_in_scene: ["Identify the stranger", "Assess potential threat/illegality", "Process entry (if applicable, likely involving fees)", "Avoid unnecessary trouble"],
            speaking_style: "Gruff, official, cuts to the point.",
            hidden_information: "Has seen many strange travellers, but finds the user's likely modern attire exceptionally odd. Might overlook minor irregularities for a 'processing fee' if not overtly threatened or challenged.",
            power_level: "Slightly above average human (Guard training)",
            faction: "Re-Estize Kingdom (E-Rantel City Guard)",
            perceived_threat_level_of_user: "Minor annoyance / Potential trouble / Possible vagrant",
            sessionId: gameSessionId,
        },
    ];
    await Character.bulkCreate(characterData);
};

// Helper function to create initial dialogues
const createInitialDialogues = async (gameSessionId) => {
    const initialDialogues = [
        {
            sessionId: gameSessionId,
            speaker_id: "NARRATOR",
            dialogue: "One moment, you were surrounded by the mundane familiarity of your world. The next, a jarring wrench, a blinding light, and the scent of unfamiliar earth and smoke fills your senses. You stumble forward onto a dusty road, the imposing stone walls and gate of a medieval city looming before you. People in rough-spun clothes and occasional adventurers clad in mismatched armor eye you strangely. Your own clothes – jeans? a t-shirt? – feel utterly alien here. Before you can fully grasp the impossible situation, a man in worn leather armor bearing a city insignia steps forward, his hand resting on the pommel of his sword, eyes narrowed.",
            timestamp: new Date(),
        },
    ];
    await DialogueHistory.bulkCreate(initialDialogues);
};

const gameController = {
    async initGame(req, res, next) {
        try {
            const gameSession = await GameSession.create({
                userId: req.user?.id,
                currentScene: 'starting_village',
            });

            await createInitialCharacters(gameSession.id);
            await createInitialDialogues(gameSession.id);

            res.status(201).json({
                message: 'Game initialized successfully',
                sessionId: gameSession.id,
            });
        } catch (error) {
            next(error);
        }
    },

    async getOptions(req, res, next) {
        try {
            const { sessionId } = req.params;
            const gameSession = await findGameSession(sessionId);

            const characters = await Character.findAll({ where: { sessionId } });
            const chatHistory = await DialogueHistory.findAll({
                where: { sessionId },
                order: [['createdAt', 'ASC']],
            });

            const formattedCharacters = characters.map((char) => char.toJSON());
            const formattedChatHistory = chatHistory.map((chat) => ({
                speaker_id: chat.speaker_id,
                dialogue: chat.dialogue,
                timestamp: chat.timestamp,
            }));

            // Format player status to send to AI
            const playerStatus = {
                health: gameSession.playerHealth,
                maxHealth: gameSession.playerMaxHealth,
                level: gameSession.playerLevel,
                experience: gameSession.playerExp,
                gold: gameSession.playerGold,
                inventory: typeof gameSession.playerInventory === 'string'
                    ? JSON.parse(gameSession.playerInventory)
                    : gameSession.playerInventory || { items: [] },
                currentScene: gameSession.currentScene,
                status: gameSession.status
            };

            // Pass player status as third parameter to generateDialogueOptions
            const options = await generateDialogueOptions(formattedCharacters, formattedChatHistory, playerStatus);

            if (options["Character Dialogues"]?.length) {
                await DialogueHistory.bulkCreate(
                    options["Character Dialogues"].map((dialogue) => ({
                        sessionId: gameSession.id,
                        ...dialogue,
                        timestamp: new Date(),
                    }))
                );
            }

            if (options["Character Cards"]?.length) {
                await Promise.all(
                    characters.map(async (char) => {
                        const matchingChar = options["Character Cards"].find(
                            (c) => c.name === char.name || c.character_id === char.character_id
                        );
                        if (matchingChar) {
                            await char.update(matchingChar);
                        }
                    })
                );
            }

            // Update GameSession if updates are provided
            if (options["Game Session Updates"]) {
                const updates = options["Game Session Updates"];

                // Validate and sanitize updates
                const validUpdates = {};

                if (updates.health !== undefined) {
                    const health = parseInt(updates.health);
                    if (!isNaN(health)) validUpdates.playerHealth = health;
                }
                if (updates.experience !== undefined) {
                    const experience = parseInt(updates.experience);
                    if (!isNaN(experience)) validUpdates.playerExp = experience;
                }
                if (updates.gold !== undefined) {
                    const gold = parseInt(updates.gold);
                    if (!isNaN(gold)) validUpdates.playerGold = gold;
                }
                if (updates.inventory !== undefined) {
                    try {
                        const inventory = typeof updates.inventory === 'string'
                            ? JSON.parse(updates.inventory)
                            : updates.inventory;
                        if (inventory && typeof inventory === 'object' && Array.isArray(inventory.items)) {
                            validUpdates.playerInventory = JSON.stringify(inventory);
                        }
                    } catch (e) {
                        console.error("Invalid inventory JSON:", e);
                    }
                }
                if (updates.status && ['active', 'completed', 'game_over'].includes(updates.status)) {
                    validUpdates.status = updates.status;
                }
                if (updates.currentScene) {
                    validUpdates.currentScene = updates.currentScene;
                }

                try {
                    await gameSession.update(validUpdates);
                } catch (e) {
                    console.error("Error updating game session:", e);
                }
            }

            res.json({
                full: options,
                options: options["User Options"].map((opt) => ({
                    ...opt,
                    dialogue_text: opt.dialogue_text.replace(/\[Player Name\]/g, req.user?.name || 'Adventurer'),
                })),
            });
        } catch (error) {
            next(error);
        }
    },

    async imageGeneration(req, res, next) {
        try {
            const { sessionId } = req.params;
            const gameSession = await findGameSession(sessionId);

            // Fetch characters for the session
            const characters = await Character.findAll({ where: { sessionId } });
            const characterCardsJson = characters.map((char) => char.toJSON());

            // Generate prompt and image
            const prompt = await generateImagePrompt(characterCardsJson);
            const image = await generateImage(prompt);

            res.json({ image }); // Return the generated image (base64 or URL)
        } catch (error) {
            console.error("Error generating image:", error);
            next(error);
        }
    },

    async selectOption(req, res, next) {
        try {
            const { sessionId } = req.params;
            const { optionId, dialogue } = req.body;

            await findGameSession(sessionId);

            await DialogueHistory.create({
                sessionId,
                speaker_id: 'USER',
                dialogue,
                timestamp: new Date(),
            });

            res.json({ message: 'Option selected successfully' });
        } catch (error) {
            next(error);
        }
    },

    async getDialogueHistory(req, res, next) {
        try {
            const { sessionId } = req.params;
            await findGameSession(sessionId);

            const dialogueHistory = await DialogueHistory.findAll({
                where: { sessionId },
                order: [['timestamp', 'ASC']],
            });

            res.json({ dialogueHistory });
        } catch (error) {
            next(error);
        }
    },

    async getPlayerStatus(req, res, next) {
        try {
            const { sessionId } = req.params;
            const gameSession = await findGameSession(sessionId);

            res.json({
                health: gameSession.playerHealth,
                maxHealth: gameSession.playerMaxHealth,
                level: gameSession.playerLevel,
                experience: gameSession.playerExp,
                gold: gameSession.playerGold,
                inventory: gameSession.playerInventory ? JSON.parse(gameSession.playerInventory) : { items: [] },
                currentScene: gameSession.currentScene,
            });
        } catch (error) {
            next(error);
        }
    },

    async getCharacters(req, res, next) {
        try {
            const { sessionId } = req.params;
            await findGameSession(sessionId);

            const characters = await Character.findAll({
                where: { sessionId },
                attributes: [
                    'id',
                    'character_id',
                    'name',
                    'short_description',
                    'personality_traits',
                    'current_emotional_state',
                    'faction',
                    'relationship_to_user',
                ],
            });

            res.json({ characters });
        } catch (error) {
            next(error);
        }
    },

    // Add this new method to the gameController object:
    async getUserSessions(req, res, next) {
        try {
            const userId = req.user.id;

            const sessions = await GameSession.findAll({
                where: { userId },
                order: [['updatedAt', 'DESC']]
            });

            res.json({ sessions });
        } catch (error) {
            next(error);
        }
    },

    async deleteSession(req, res, next) {
        try {
            const { sessionId } = req.params;
            const userId = req.user.id;

            // Find the session and make sure it belongs to the current user
            const session = await GameSession.findOne({
                where: {
                    id: sessionId,
                    userId: userId
                }
            });

            if (!session) {
                return res.status(404).json({ error: "Session not found or unauthorized" });
            }

            // First delete related records to avoid foreign key constraint errors
            // Delete dialogue history
            await DialogueHistory.destroy({ where: { sessionId } });

            // Delete characters
            await Character.destroy({ where: { sessionId } });

            // Then delete the session itself
            await session.destroy();

            res.json({ message: "Session deleted successfully" });
        } catch (error) {
            console.error("Error deleting session:", error);
            res.status(500).json({ error: "Failed to delete session" });
        }
    }
};

module.exports = gameController;