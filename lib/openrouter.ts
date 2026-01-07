
import { TEXT_MODELS } from "./config/models"

const MOCK_WAIT_MS = 2000

export async function callOpenRouter(
    modelId: string,
    messages: { role: string; content: string }[],
    options: {
        maxTokens?: number
        temperature?: number
    } = {}
): Promise<string> {
    const apiKey = process.env.OPENROUTER_API_KEY
    const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const siteName = "Whness Blog Automation"

    // Default to a known working model if empty
    const targetModel = modelId || "meta-llama/llama-3.3-70b-instruct:free"

    try {
        if (!apiKey) {
            console.warn("[OpenRouter] No API Key found.")
            throw new Error("OPENROUTER_API_KEY is missing via .env");
        }

        console.log(`[OpenRouter] 🚀 Calling Model: ${targetModel}`)
        console.log(`[OpenRouter] 📦 Payload: ${messages.length} messages`)
        if (messages.length > 0) {
            console.log(`[OpenRouter] 📝 System Prompt Length: ${messages[0].content.length}`)
            if (messages[1]) console.log(`[OpenRouter] 👤 User Prompt Length: ${messages[1].content.length}`)
        }

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "HTTP-Referer": siteUrl,
                "X-Title": siteName,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: targetModel,
                messages: messages,
                max_tokens: options.maxTokens || 8192,
                temperature: options.temperature || 0.7,
            })
        })

        if (!response.ok) {
            const rawError = await response.text()
            console.error(`[OpenRouter API Error] ❌ Status: ${response.status}`)
            console.error(`[OpenRouter API Error] 📄 Body: ${rawError}`)

            // 429 Rate Limit -> Use Mock
            // 429 Rate Limit -> Throw
            if (response.status === 429) {
                throw new Error("[OpenRouter] Rate Limit Exceeded (429)");
            }
            if (response.status === 503 || response.status === 502) {
                throw new Error("[OpenRouter] Service Unavailable");
            }

            throw new Error(`OpenRouter Error ${response.status}: ${rawError}`)
        }

        const data = await response.json()
        const content = data.choices[0]?.message?.content || ""

        if (!content) {
            throw new Error("Empty response from OpenRouter")
        }

        console.log(`[OpenRouter] ✅ Success! Received ${content.length} chars.`)
        return content

    } catch (error: any) {
        console.error("[OpenRouter] 💥 Request Failed:", error.message)
        throw error; // NO MORE MOCK FALLBACK
    }
}
