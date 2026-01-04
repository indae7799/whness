
import { GoogleGenerativeAI } from "@google/generative-ai"

// Default Model: Gemini 2.0 Flash Exp (Fast & High Quality)
const DEFAULT_MODEL = "gemini-2.0-flash-exp"

export async function callGoogleGenAI(
    systemPrompt: string,
    userPrompt: string,
    modelId: string = DEFAULT_MODEL
): Promise<string> {
    const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY
    if (!apiKey) {
        throw new Error("GOOGLE_API_KEY is missing. Please add it to your .env file.")
    }

    try {
        console.log(`[Google GenAI] Calling model: ${modelId}`)

        // Initialize per call to ensure env vars are loaded
        const genAI = new GoogleGenerativeAI(apiKey)

        // Gemini uses 'systemInstruction' for system prompt
        const model = genAI.getGenerativeModel({
            model: modelId,
            systemInstruction: systemPrompt
        })

        const result = await model.generateContent(userPrompt)
        const response = await result.response
        const text = response.text()

        return text
    } catch (error) {
        console.error("[Google GenAI] Error:", error)
        throw error
    }
}
