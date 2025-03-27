require('dotenv').config();
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');

// Initialize the Gemini API client with your API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Function to generate dialogue options
async function generateDialogueOptions(characters, chatHistory) {
    try {
        // Use the newer model with system instruction
        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash-thinking-exp-01-21",
            systemInstruction: `**Prompt Title:** Overlord VN Dialogue Generator - New World Adventurer - Quad-Choice (Hard Mode)

**Objective:** Generate four distinct, contextually relevant, and *challenging* dialogue options for the user (a newly isekai'd adventurer) in a VN-style simulation within the *Overlord* universe.  Options should reflect the harsh realities and dangers of the New World.

**Setting:** The New World, as depicted in the *Overlord* series.  Assume familiarity with the power scaling, magic system, and general ruthlessness of the setting.  The player is NOT a Nazarick denizen.

**Scenario:** The player is a normal human from our world, recently isekai'd into the New World.  They have basic adventurer gear (low-quality sword, leather armor, a few healing potions) and NO special abilities beyond their modern-world knowledge.  They are currently in or near a frontier town or village, facing the immediate challenges of survival.

**Genre:** Isekai, Dark Fantasy, Action, Survival

**Difficulty:** High.  Choices should have significant consequences, and incorrect choices can lead to injury, death, enslavement, or other highly negative outcomes.  The New World is unforgiving.

**Input:**

1.  **Character Persona Cards (Multiple):**
    *   **Format:** JSON-like structure (as before, but with additions).
    *   **Fields:**
        *   \`character_id\`: (String) Unique ID.
        *   \`name\`: (String) Full name.
        *   \`short_description\`: (String) 1-2 sentence summary.
        *   \`personality_traits\`: (Array of Strings) Keywords.
        *   \`relationship_to_user\`: (String)  Scale and description. (e.g., "1/10 - Openly hostile and considers the user weak.", "3/10 - Wary and distrustful, typical of adventurers.", "5/10 - Neutral, willing to interact for mutual benefit.")
        *   \`current_emotional_state\`: (String) Current emotions.
        *   \`goals_in_scene\`: (Array of Strings) Specific goals.
        *   \`speaking_style\`: (String) Description of speaking habits.
        *   \`hidden_information\`: (String, Optional) Relevant secrets.
        *   \`power_level\`: (String)  A *rough* estimate of the character's power relative to the New World. (e.g., "Weak villager", "Average adventurer (Copper Plate)", "Experienced adventurer (Mithril Plate)", "Powerful magic caster (equivalent to Adamantite)", "Overwhelmingly powerful (Nazarick level)"). *This is CRUCIAL for gauging the risk of certain dialogue choices.*
        *   \`faction\`: (String, Optional) The organization or group the character belongs to. (e.g., "Adventurer's Guild", "Slane Theocracy Scripture", "Re-Estize Kingdom Noble", "Worker", "Nazarick"). *Important for understanding potential alliances and conflicts.*
        *   \`perceived_threat_level_of_user\`: (String) How threatening the character *perceives* the user to be. (e.g., "Non-threat", "Minor annoyance", "Potential asset", "Significant threat"). *This influences their reactions, independent of the user's actual power.*

2.  **Chat History:**
    *   **Format:** JSON array (as before).
    *   **Fields:**
        *   \`speaker_id\`: (String) Character ID or "USER".
        *   \`dialogue\`: (String) Dialogue text.
        *   \`timestamp\`: (String, Optional) Timestamp.

**Output:**

*   **Format:** JSON array of four dialogue options.
*   **Fields:**
    *   \`option_id\`: (String) Unique ID ("A", "B", "C", "D").
    *   \`dialogue_text\`: (String) Full dialogue text.
    *   \`predicted_tone\`: (Array of Strings) Tone keywords.
    *   \`predicted_character_reactions\`: (Object) Brief reactions (by \`character_id\`).
        *   **Key:** \`character_id\`
        *   **Value:** (String)
    *   \`reasoning\`: (String) Very short reasoning.
    *   \`risk_assessment\`: (String) A brief assessment of the *potential risks* associated with this choice. (e.g., "Low risk of immediate conflict, but may reveal weakness.", "High risk of provoking a fight.", "Moderate risk of offending, but potential for gaining information."). *This is EXTREMELY important in the Overlord setting.*
    *   \`potential_long_term_consequences\`: (String, Optional) A *brief* mention of potential *long-term* effects, even if they aren't immediately apparent. (e.g., "Could lead to an alliance with a powerful faction.", "Might make the user a target for a specific enemy.", "Could damage the user's reputation.").

**Example (Simplified):**

**Input:**

*Character Cards:*
[
    {
        "character_id": "GAZ_01",
        "name": "Gazef Stronoff (Imitation)",
        "short_description": "A man claiming to be the Warrior Captain, but seems...off.",
        "personality_traits": ["arrogant", "overconfident", "cruel", "sadistic"],
        "relationship_to_user": "2/10 - Sees the user as insignificant.",
        "current_emotional_state": "Bored and looking for amusement",
        "goals_in_scene": ["Test the user's strength (for his own amusement)", "Humiliate the user"],
        "speaking_style": "Condescending and mocking.",
        "hidden_information": "Is actually a powerful undead creature disguised as Gazef.",
        "power_level": "Overwhelmingly powerful (Nazarick level)",
        "faction": "Nazarick (Suspected)",
        "perceived_threat_level_of_user": "Non-threat"
    },
    {
        "character_id": "AINS_01",
        "name": "Ains Ooal Gown (Momon)",
        "short_description": "Appear as dark warrior adventurer.",
        "personality_traits": ["observant", "protective", "secret"],
        "relationship_to_user": "5/10 - Netral.",
        "current_emotional_state": "observant and protective",
        "goals_in_scene": ["Observe the situation."],
        "speaking_style": "Short, blunt",
        "hidden_information": "Is actually Ains Ooal Gown, supreme being of Nazarick",
        "power_level": "Overwhelmingly powerful (Nazarick level)",
        "faction": "Nazarick",
        "perceived_threat_level_of_user": "Non-threat"
    }
]

*Chat History:*
[
    {
        "speaker_id": "GAZ_01",
        "dialogue": "Well, well, what do we have here? Another weakling adventurer, fresh off the turnip truck.  Show me what you've got, *worm*."
    }
]

**Output:**
[
    {
        "option_id": "A",
        "dialogue_text": "I... I'm just starting out. I don't want any trouble.",
        "predicted_tone": ["submissive", "fearful", "pleading"],
        "predicted_character_reactions": {
            "GAZ_01": "Will be further amused and likely escalate his taunting.",
            "AINS_01": "Will observe with slight dissapointment."
        },
        "reasoning": "Try to de-escalate by showing weakness.",
        "risk_assessment": "High risk of being further bullied or even attacked. Shows a complete lack of fighting spirit.",
        "potential_long_term_consequences": "May be marked as an easy target by others."
    },
    {
        "option_id": "B",
        "dialogue_text": "I may be new, but I'm not afraid to fight if I have to.",
        "predicted_tone": ["defiant", "cautious", "brave"],
        "predicted_character_reactions": {
            "GAZ_01": "Will be intrigued and likely initiate a 'test' (fight).",
            "AINS_01": "Will be slightly interested."
        },
        "reasoning": "Attempt to stand up for oneself, without being overly aggressive.",
        "risk_assessment": "Extremely high risk of a one-sided fight against a vastly superior opponent. Almost certain death or severe injury.",
        "potential_long_term_consequences": "Could lead to immediate death or enslavement."
    },
    {
        "option_id": "C",
        "dialogue_text": "Warrior Captain Stronoff? I've heard tales of your bravery. It's an honor to meet you.",
        "predicted_tone": ["respectful", "flattering", "diplomatic"],
        "predicted_character_reactions": {
            "GAZ_01": "Might be momentarily thrown off by the flattery, but his sadistic nature will likely prevail.",
            "AINS_01": "Will find it amusing."
        },
        "reasoning": "Try to use flattery and knowledge of Gazef's reputation to avoid conflict.",
        "risk_assessment": "Moderate risk. The imposter might see through the flattery, but it *could* buy a few moments.",
        "potential_long_term_consequences": "Might slightly delay the inevitable, but unlikely to change the outcome significantly."
    },
    {
        "option_id": "D",
        "dialogue_text": "You don't *feel* like the real Gazef Stronoff.  There's something wrong with you.",
        "predicted_tone": ["observant", "accusatory", "bold"],
        "predicted_character_reactions": {
            "GAZ_01": "Will be enraged and almost certainly attack.",
            "AINS_01": "Will be impressed by user observant."
        },
        "reasoning": "Directly call out the imposter, based on intuition and observation.",
        "risk_assessment": "Extremely high risk. Provokes the imposter and guarantees a fight. However, it *might* reveal a hint of the truth to any onlookers.",
        "potential_long_term_consequences": "Almost certain death, but could potentially expose the imposter *if* anyone powerful enough is nearby and willing to intervene (highly unlikely)."
    }
]

Key Changes and Rationale:

*   **Power Level:** The \`power_level\` field is critical. It allows the model to understand the *massive* power disparity common in *Overlord*.  The user is almost always outmatched.
*   **Faction:** The \`faction\` field helps establish the political landscape and potential alliances (or enmities).
*   **Perceived Threat:** \`perceived_threat_level_of_user\` acknowledges that NPCs won't react solely based on the user's *actual* power, but on their *perception* of it.
*   **Risk Assessment:** The \`risk_assessment\` field is *essential* for a "hard mode" *Overlord* VN. It highlights the dangers of each choice.
*   **Long-Term Consequences:** The \`potential_long_term_consequences\` field hints at the ripple effects of choices, even if they aren't immediately obvious.
*   **Challenging Options:** The example options are all difficult, with no "easy" outs. This reflects the unforgiving nature of the setting.  Even seemingly safe options have significant risks.
*   **Imitation Scenario:** The example uses an "imposter Gazef" to create an immediate, high-stakes situation that tests the user's perception and decision-making.
*   **Multiple Powerful Character:** Put Ainz (Momon) as another character to create unexpected outcome.

**IMPORTANT:** Your response MUST be only updated **Character Card (Required)**, **Character Dialogues (Required)**, and **Output (Required)** response
`});

        // Configure generation parameters
        const generationConfig = {
            temperature: 1,
            topP: 0.95,
            topK: 64,
            maxOutputTokens: 65536,
            responseMimeType: "text/plain",
        };

        // Format the input data
        const formattedPrompt = `
Characters:
${ JSON.stringify(characters, null, 2) }

Chat History:
${ JSON.stringify(chatHistory, null, 2) }
`;
        // console.log(formattedPrompt, "formattedPrompt");

        // console.log("Generating dialogue options with the following prompt:", formattedPrompt);

        // Generate content with the configured model
        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: formattedPrompt }] }],
            generationConfig,
        });

        const response = result.response;
        const text = response.text();
        // console.log(text, "text");

        // Extract the JSON from the response
        const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/g);

        if (jsonMatch) {
            const extractedData = jsonMatch.map(match => JSON.parse(match.replace(/```json\s*|\s*```/g, ''))).flat();

            const categories = {
                "Character Cards": "character_id",
                "Character Dialogues": "speaker_id",
                "User Options": "option_id"
            };

            const structuredOutput = Object.entries(categories).reduce((result, [categoryName, idProperty]) => {
                result[categoryName] = extractedData.filter(item => item && item[idProperty] != null && item[idProperty].length > 0);
                return result;
            }, {});

            if (Object.keys(structuredOutput).length > 0) return structuredOutput;
        }

        // Handle the new format
        try {
            const parsedResponse = JSON.parse(text.replace(/```json\s*|\s*```/g, ''));

            const structuredOutput = {
                "Character Cards": parsedResponse.character_card || parsedResponse["Character Card (Required)"] || [],
                "Character Dialogues": parsedResponse.character_dialogues || parsedResponse["Character Dialogues (Required)"] || [],
                "User Options": parsedResponse.output || parsedResponse["Output (Required)"] || []
            };

            return structuredOutput;
        } catch (error) {
            console.error("Error parsing response:", error);
            throw new Error("Failed to parse dialogue options from AI response");
        }
    } catch (error) {
        console.error("Error generating dialogue options:", error);
        throw error;
    }
}

module.exports = { generateDialogueOptions };