require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize the Gemini API client
// You'll need to add API_KEY to your .env file
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Function to generate dialogue options
async function generateDialogueOptions(characters, chatHistory) {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        const prompt = {
            title: "Overlord VN Dialogue Generator - New World Adventurer - Quad-Choice (Hard Mode)",
            objective: "Generate four distinct, contextually relevant, and challenging dialogue options for the user (a newly isekai'd adventurer) in a VN-style simulation within the Overlord universe. Options should reflect the harsh realities and dangers of the New World.",
            setting: "The New World, as depicted in the Overlord series.",
            scenario: "The player is a normal human from our world, recently isekai'd into the New World. They have basic adventurer gear and NO special abilities beyond their modern-world knowledge.",
            genre: "Isekai, Dark Fantasy, Action, Survival",
            difficulty: "High. Choices should have significant consequences."
        };

        const formattedPrompt = `
      ${ JSON.stringify(prompt) }
      
      Characters:
      ${ JSON.stringify(characters, null, 2) }
      
      Chat History:
      ${ JSON.stringify(chatHistory, null, 2) }
      
      Generate four dialogue options in JSON format with:
      - option_id (A, B, C, D)
      - dialogue_text (full dialogue text)
      - predicted_tone (array of tone keywords)
      - predicted_character_reactions (object with character_id as key)
      - reasoning (short reasoning)
      - risk_assessment (brief assessment of potential risks)
      - potential_long_term_consequences (brief mention of long-term effects)
    `;

        const result = await model.generateContent(formattedPrompt);
        const response = result.response;
        const text = response.text();

        // Extract the JSON from the response
        const jsonMatch = text.match(/\[\s*\{.*\}\s*\]/s);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }

        throw new Error("Failed to parse dialogue options from AI response");
    } catch (error) {
        console.error("Error generating dialogue options:", error);
        throw error;
    }
}

module.exports = { generateDialogueOptions };