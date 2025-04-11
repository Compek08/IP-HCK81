const {
    GoogleGenerativeAI,
} = require('@google/generative-ai');

// Initialize the Gemini API client
// You'll need to add API_KEY to your .env file
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Image generation function
async function generateImagePrompt(characterCardsJson) {
    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
            systemInstruction: `**Objective:** To generate a detailed and effective text prompt for an AI image generator, based on **all** provided character card JSON data within the input array. The prompt should describe a **full body scene** featuring all characters interacting or positioned relative to each other, suitable for visualizing their encounter.

**Input:**

1.  **\`character_cards_json\`**: (JSON Array) An array containing **one or more** character card objects in the specified format. The prompt will include *all* characters listed in this array.

**Output:**

*   **Format:** A single text string. This string is the generated prompt ready to be used in an AI image generator for creating a multi-character, full body scene.`,
        });

        const generationConfig = {
            temperature: 1,
            topP: 0.95,
            topK: 40,
            maxOutputTokens: 8192,
        };

        const chatSession = model.startChat({
            generationConfig,
            history: [],
        });

        const input = JSON.stringify({
            character_cards_json: characterCardsJson,
        });

        const result = await chatSession.sendMessage(input);
        return result.response.text();
    } catch (error) {
        console.error("Error generating image prompt:", error);
        throw error;
    }
}

// Function to generate an actual image using the prompt
async function generateImage(characterCardsJson) {
    try {
        // Generate the prompt using characterCardsJson
        const prompt = await generateImagePrompt(characterCardsJson);

        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash-exp-image-generation",
        });

        const generationConfig = {
            temperature: 1,
            topP: 0.95,
            topK: 40,
            maxOutputTokens: 8192,
            responseModalities: ["image", "text"],
            responseMimeType: "text/plain",
        };

        const chatSession = model.startChat({
            generationConfig,
            history: [],
        });

        const result = await chatSession.sendMessage(prompt);

        const candidates = result.response.candidates;
        let base64Image = null;

        for (let candidateIndex = 0; candidateIndex < candidates.length; candidateIndex++) {
            for (let partIndex = 0; partIndex < candidates[candidateIndex].content.parts.length; partIndex++) {
                const part = candidates[candidateIndex].content.parts[partIndex];
                if (part.inlineData) {
                    base64Image = part.inlineData.data; // Extract base64 image data
                    break;
                }
            }
            if (base64Image) break;
        }

        if (!base64Image) {
            throw new Error("No image data found in the response.");
        }

        return {
            success: true,
            prompt,
            image: base64Image, // Return the base64 image directly
            responseText: result.response.text(),
        };
    } catch (error) {
        console.error("Error generating image:", error);
        throw error;
    }
}

module.exports = {
    generateImagePrompt,
    generateImage
};