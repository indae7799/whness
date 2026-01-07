
import { GoogleGenerativeAI } from "@google/generative-ai"

// Default Model: Gemini 3.0 Flash (Latest & High Quality)
const DEFAULT_MODEL = "gemini-3.0-flash"

export async function callGoogleGenAI(
    systemPrompt: string,
    userPrompt: string,
    modelId: string = DEFAULT_MODEL,
    temperature: number = 0.7,
    maxOutputTokens: number = 8175
): Promise<string> {
    // DEBUG: Check available env vars (Keys Only)
    const availableKeys = Object.keys(process.env).filter(k => k.includes('GOOGLE') || k.includes('GEMINI'));
    console.log("[Google GenAI] Available relevant Env Keys:", availableKeys);

    const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_STUDIO_API_KEY
    if (!apiKey) {
        throw new Error("GOOGLE_API_KEY is missing. Please add it to your .env file.")
    }

    try {
        // Use v1beta by default as it covers most models (1.5 Flash, 1.5 Pro, 2.0 Flash Exp)
        const urlPrimary = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`;

        const payload = {
            contents: [{ parts: [{ text: userPrompt }] }],
            systemInstruction: systemPrompt ? { parts: [{ text: systemPrompt }] } : undefined,
            generationConfig: { temperature, maxOutputTokens }
        };

        // Add Timeout (50 seconds) to prevent infinite hanging
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 50000); // 50s timeout

        let response;
        try {
            response = await fetch(urlPrimary, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
                signal: controller.signal
            });
        } finally {
            clearTimeout(timeoutId);
        }

        if (!response.ok) {
            const errText = await response.text();
            console.error(`[Google GenAI] Request FAILED. Status: ${response.status}. Reason: ${errText}`);
            throw new Error(`Google GenAI API Failed: ${response.status} - ${errText}`);
        }

        const data = await response.json();

        // Parse response safely
        if (data.candidates && data.candidates.length > 0) {
            const candidate = data.candidates[0];
            const contentPart = candidate.content?.parts?.[0]?.text || "";
            let finalContent = contentPart;

            // Handle Truncation (Auto-Continuation)
            if (candidate.finishReason === "MAX_TOKENS") {
                console.log("[Google GenAI] Output truncated (MAX_TOKENS). Attempting to continue...");

                // Construct new history including the truncated response
                const newContents = [
                    { role: "user", parts: [{ text: userPrompt }] },
                    { role: "model", parts: [{ text: contentPart }] },
                    { role: "user", parts: [{ text: "CRITICAL: The previous output was cut off due to token limits. Please CONTINUE generating the remaining part of the article immediately from where you stopped. Do NOT repeat the last sentence. Just continue." }] }
                ];

                const continuationPayload = {
                    ...payload,
                    contents: newContents
                };

                // Short timeout for continuation (20s)
                const contController = new AbortController();
                const contTimeout = setTimeout(() => contController.abort(), 20000);

                try {
                    const contResponse = await fetch(urlPrimary, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(continuationPayload),
                        signal: contController.signal
                    });
                    if (contResponse.ok) {
                        const contData = await contResponse.json();
                        if (contData.candidates && contData.candidates.length > 0) {
                            const contText = contData.candidates[0].content?.parts?.[0]?.text || "";
                            console.log(`[Google GenAI] Continuation received (${contText.length} chars). Appending...`);
                            finalContent += contText;
                        }
                    } else {
                        console.warn("[Google GenAI] Continuation request failed.");
                    }
                } catch (e) {
                    console.warn("[Google GenAI] Continuation timed out or failed:", e);
                } finally {
                    clearTimeout(contTimeout);
                }
            }

            return finalContent;
        } else {
            throw new Error("No content generated in response");
        }

    } catch (error: any) {
        if (error.name === 'AbortError') {
            console.error("[Google GenAI] Request Timeout (50s limit reached)");
            throw new Error("Google GenAI Request Timed Out");
        }
        console.error("[Google GenAI] REST API Error Details:", error.message)
        throw error
    }
}
