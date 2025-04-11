const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');

// Pastikan API Key ada
if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY environment variable not set.");
}

// Initialize the Gemini API client with your API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Definisikan System Instruction (Prompt Utama)
const systemInstructionText = `
**Prompt Title:** Overlord VN Dialogue Generator - New World Adventurer - Quad-Choice (Hard Mode)

**Objective:** Generate four distinct, contextually relevant, and *challenging* dialogue options for the user (a newly isekai'd adventurer) in a VN-style simulation within the *Overlord* universe. Options should reflect the harsh realities and dangers of the New World.

**Setting:** The New World, as depicted in the *Overlord* series. Assume familiarity with the power scaling, magic system, and general ruthlessness of the setting. The player is NOT a Nazarick denizen.

**Scenario:** The player is a normal human from our world, recently isekai'd into the New World. They have basic adventurer gear (low-quality sword, leather armor, a few healing potions) and NO special abilities beyond their modern-world knowledge. They are currently in or near a frontier town or village, facing the immediate challenges of survival.

**Genre:** Isekai, Dark Fantasy, Action, Survival

**Difficulty:** Hell. Choices should have significant consequences, and incorrect choices will lead to injury, death, enslavement, or other highly negative outcomes. Ensure that the correct choice is and must be 1 from 4 choice. The New World is unforgiving. Ensure that you update the player status (health, experience, gold, inventory) if a user action should change the game state. Once player health reaches 0, add character's dialogue as Narator and set status to "game_over".

**Input (Provided via user message context):**

1.  **Character Persona Cards (Multiple):**
    *   **Format:** JSON-like structure.
    *   **Fields:**
        *   \`character_id\`: (String) Unique ID.
        *   \`name\`: (String) Full name.
        *   \`short_description\`: (String) 1-2 sentence summary.
        *   \`personality_traits\`: (Array of Strings) Keywords.
        *   \`relationship_to_user\`: (String) Scale and description.
        *   \`current_emotional_state\`: (String) Current emotions.
        *   \`goals_in_scene\`: (Array of Strings) Specific goals.
        *   \`speaking_style\`: (String) Description of speaking habits.
        *   \`hidden_information\`: (String, Optional) Relevant secrets.
        *   \`power_level\`: (String) Rough estimate relative to New World. (Crucial)
        *   \`faction\`: (String, Optional) Group affiliation. (Important)
        *   \`perceived_threat_level_of_user\`: (String) How the character perceives the user.

2.  **Chat History:**
    *   **Format:** JSON array.
    *   **Fields:**
        *   \`speaker_id\`: (String) Character ID or "USER".
        *   \`dialogue\`: (String) Dialogue text.
        *   \`timestamp\`: (String, Optional) Timestamp.

3.  **Player Status:**
    *   **Format:** JSON object.
    *   **Fields:**
        *   \`health\`: (Integer) Current health.
        *   \`maxHealth\`: (Integer) Maximum health.
        *   \`level\`: (Integer) Current level.
        *   \`experience\`: (Integer) Current experience points.
        *   \`gold\`: (Integer) Amount of gold.
        *   \`inventory\`: (Object) Player's inventory.
        *   \`currentScene\`: (String) The current scene.
        *   \`status\`: (String) The current status.

**Output Requirements (Strict JSON format - no schema enforcement, rely on prompt):**

*   **Format:** JSON object containing three keys: "Character Cards", "Character Dialogues", "User Options", and "Game Session Updates".
*   **"Character Cards":** Array of updated character card objects (following the input format). Required. Include only characters whose state has changed.
    *   \`character_id\`: (String) Unique ID.
    *   \/* Other character fields to update *\/
*   **"Character Dialogues":** Array of new dialogue objects spoken by characters in response to the last user action (or initiating the scene). Required.
    *   \`speaker_id\`: (String) Character ID.
    *   \`dialogue\`: (String) Dialogue text.
*   **"User Options":** Array of exactly four dialogue option objects for the player. Required.
    *   \`option_id\`: (String) Unique ID ("A", "B", "C", "D").
    *   \`dialogue_text\`: (String) Full dialogue text for the user to choose.
    *   \`predicted_tone\`: (Array of Strings) Tone keywords.
    *   \`predicted_character_reactions\`: (Object) Key: \`character_id\`, Value: (String) Brief predicted reaction. ***Model must generate this as an object with character_id keys based on context.***
    *   \`reasoning\`: (String) Very short reasoning for the option's design.
    *   \`risk_assessment\`: (String) Brief assessment of potential immediate risks. (Crucial)
    *   \`potential_long_term_consequences\`: (String, Optional) Brief mention of potential long-term effects.
*   **"Game Session Updates":** Object containing updates to the game session (player status).  Include only fields that need to be updated. Optional, but HIGHLY recommended if a user action should change the game state.
    *   \`health\`: (Integer, Optional) Updated health value.
    *   \`experience\`: (Integer, Optional) Updated experience value.
    *   \`gold\`: (Integer, Optional) Updated gold value.
    *   \`inventory\`: (Object, Optional) Updated inventory.  MUST be a complete, valid JSON object representing the *entire* inventory.
    *   \`currentScene\`: (String, Optional) Updated current scene.
    *   \`status\`: (ENUM 'active', 'completed', 'game_over', Optional) Updated status.  MUST be one of these values.  If the game is in a combat or confrontation state, use \`active\`. Use \`game_over\` if the player dies or otherwise loses. Use \`completed\` if the player achieves a major objective and the session is considered finished.

**IMPORTANT:**
*   Adhere strictly to the requested JSON output format.
*   Ensure options are genuinely challenging and reflect the Overlord setting's danger.
*   Base character reactions and dialogue on their persona cards and the chat history.
*   Update character cards (e.g., emotional state, relationship) if the interaction warrants it.
*   Generate plausible next dialogue(s) from NPC(s) based on the current context before presenting user options.
*   Only include updated character cards and game session properties in the output.
*   **If a user action (selecting an option) should change the player's health, gold, experience, inventory or status, you MUST include the "Game Session Updates" object in your response.**
`;

// Modify the function signature to accept playerStatus
async function generateDialogueOptions(characters, chatHistory, playerStatus) {
    try {
        // Update your dynamic system instruction to include player status
        const dynamicSystemInstruction = `${ systemInstructionText }

**Current Scene Context:**

*   **Characters Present:**
${ JSON.stringify(characters, null, 2) }

*   **Player Status:**
${ JSON.stringify(playerStatus, null, 2) }

*   **Recent Conversation:** (Most recent messages first)
${ chatHistory.slice(-5).reverse().map(msg => `    *   [${ msg.speaker_id }]: ${ msg.dialogue }`).join('\n') }
-------------------------------------
Generate the next NPC dialogue(s) and the four user options based on this context, adhering strictly to the JSON output format described above.
`;
        // --- Model Initialization ---
        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash", // Or "gemini-1.5-pro-latest" or specific version
            systemInstruction: dynamicSystemInstruction,
            safetySettings: [
                { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
                { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
                { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
                { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
            ],
        });

        // --- Generation Configuration ---
        const generationConfig = {
            temperature: 1.1,
            topP: 0.99,
            topK: 40,
            maxOutputTokens: 8192,
            responseMimeType: "application/json", // Keep this to encourage JSON output
            // *** responseSchema: REMOVED ENTIRELY ***
        };

        // --- Prepare Conversation History for API ---
        const contents = chatHistory.map(chat => ({
            role: chat.speaker_id === 'USER' ? 'user' : 'model',
            parts: [{ text: chat.dialogue }]
        }));

        // --- Generate Content ---
        console.log("Sending request to Gemini API...");
        const result = await model.generateContent({
            contents: contents,
            generationConfig,
        });

        // --- Process Response ---
        const response = result.response;

        // Check for blocked content or other immediate issues
        if (!response || !response.candidates || response.candidates.length === 0 || !response.candidates[0].content) {
            const blockReason = response?.promptFeedback?.blockReason;
            const safetyRatings = response?.promptFeedback?.safetyRatings;
            console.error("Generation failed or was blocked.");
            if (blockReason) {
                console.error(`Block Reason: ${ blockReason }`);
            }
            if (safetyRatings) {
                console.error(`Safety Ratings: ${ JSON.stringify(safetyRatings) }`);
            }
            throw new Error(`Generation failed or was blocked. Reason: ${ blockReason || 'Unknown' }`);
        }

        const responseText = response.text(); // Get text even if parsing fails later
        console.log("Raw Gemini API Response Text:", responseText);

        try {
            // Parse directly since we requested JSON (and hope it is)
            const parsedResponse = JSON.parse(responseText);

            // Basic validation - now manual since no schema enforcement
            if (!parsedResponse || !parsedResponse['User Options'] || !parsedResponse['Character Dialogues'] || !parsedResponse['Character Cards']) {
                throw new Error("Parsed response is missing required keys: 'User Options', 'Character Dialogues', or 'Character Cards'.");
            }
            if (!Array.isArray(parsedResponse['User Options']) || parsedResponse['User Options'].length !== 4) {
                console.warn(`Warning: Model returned ${ parsedResponse['User Options']?.length ?? 0 } user options instead of 4.`);
                // Decide how to handle this: error out, try to pad, or use what's given?
                // For now, let's proceed but be aware.
            }
            // Add more validation here if needed to ensure structure is as expected

            console.log("Successfully parsed JSON response.");
            return parsedResponse;

        } catch (parseError) {
            console.error("Error parsing JSON response from Gemini:", parseError);
            console.error("Response text that failed parsing:", responseText);
            throw new Error("Failed to parse the expected JSON response from the AI. Response was not valid JSON.");
        }

    } catch (error) {
        // Catch errors from API call or parsing
        console.error("Error in generateDialogueOptions:", error.message);
        // Log specific Gemini API errors if available
        if (error instanceof Error && 'status' in error && 'errorDetails' in error) { // Check if it looks like GoogleGenerativeAIFetchError
            console.error(`API Error Status: ${ error.status } ${ error.statusText }`);
            console.error("API Error Details:", JSON.stringify(error.errorDetails, null, 2));
        } else {
            console.error("Full Error Object:", error); // Log the whole error if it's not the expected API error type
        }
        throw error; // Re-throw the error for higher-level handling
    }
}

module.exports = { generateDialogueOptions };

// --- Example Usage (for testing) ---
/*
async function testGeneration() {
    const exampleCharacters = [
        {
            "character_id": "GAZ_01", "name": "Gazef Stronoff (Imitation)", "short_description": "A man claiming to be the Warrior Captain, but seems...off.", "personality_traits": ["arrogant", "overconfident", "cruel", "sadistic"], "relationship_to_user": "2/10 - Sees the user as insignificant.", "current_emotional_state": "Bored and looking for amusement", "goals_in_scene": ["Test the user's strength (for his own amusement)", "Humiliate the user"], "speaking_style": "Condescending and mocking.", "hidden_information": "Is actually a powerful undead creature disguised as Gazef.", "power_level": "Overwhelmingly powerful (Nazarick level)", "faction": "Nazarick (Suspected)", "perceived_threat_level_of_user": "Non-threat"
        },
        {
            "character_id": "AINS_01", "name": "Ains Ooal Gown (Momon)", "short_description": "Appear as dark warrior adventurer.", "personality_traits": ["observant", "protective", "secretive", "calculating"], "relationship_to_user": "5/10 - Neutral, observing.", "current_emotional_state": "Observant and cautious", "goals_in_scene": ["Observe the situation.", "Gauge the newcomer (user).", "Assess the 'Gazef' imposter."], "speaking_style": "Short, blunt, thoughtful pauses.", "hidden_information": "Is actually Ains Ooal Gown, supreme being of Nazarick.", "power_level": "Overwhelmingly powerful (Nazarick level)", "faction": "Nazarick", "perceived_threat_level_of_user": "Non-threat (initially)"
        }
    ];

    const exampleChatHistory = [
        {
            "speaker_id": "GAZ_01",
            "dialogue": "Well, well, what do we have here? Another weakling adventurer, fresh off the turnip truck. Show me what you've got, *worm*."
        }
    ];

    try {
        const result = await generateDialogueOptions(exampleCharacters, exampleChatHistory);
        console.log("Generated Options:", JSON.stringify(result, null, 2));
    } catch (error) {
        // Error is already logged inside the function, just indicate failure here.
        console.error("Test generation failed.");
    }
}

// Uncomment to run the test
// testGeneration();*/