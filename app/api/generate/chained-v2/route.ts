
import { NextResponse } from "next/server"
import { generateChainedArticle } from "@/services/chained-generation"

export async function POST(req: Request) {
    try {
        const { topic, focusKeyword, persona, outlineModelId: userOutlineModel, contentModelId: userContentModel, temperature, maxOutputTokens, mode } = await req.json()

        if (!topic || !focusKeyword) {
            return NextResponse.json({ error: "Missing topic or focusKeyword" }, { status: 400 })
        }

        // Map 'mode' ('3.0', '2.5', 'hybrid') to actual Model IDs
        // Downgraded to 2.0-flash-exp for stability (3.0 is causing 500 errors)
        let outlineModelId = userOutlineModel || 'google/gemini-3.0-flash';
        let contentModelId = userContentModel || 'google/gemini-3.0-flash';

        if (mode === '3.0') {
            outlineModelId = 'google/gemini-3-flash-preview';
            contentModelId = 'google/gemini-3-flash-preview';
        } else if (mode === '2.5') {
            outlineModelId = 'google/gemini-2.5-flash';
            contentModelId = 'google/gemini-2.5-flash';
        } else if (mode === 'hybrid') {
            // Hybrid: Smart Outline (3.0) + Fast Generation (3.0)
            outlineModelId = 'google/gemini-3.0-flash';
            contentModelId = 'google/gemini-3.0-flash';
        }

        console.log(`[API Chained V2] Mode: ${mode} -> Outline: ${outlineModelId}, Content: ${contentModelId}`)
        console.log(`[API Chained V2] Starting generation for: ${focusKeyword}`)

        const result = await generateChainedArticle({
            topic,
            focusKeyword,
            persona,
            outlineModelId,
            contentModelId,
            temperature,
            maxOutputTokens
        })

        return NextResponse.json(result)
    } catch (error: any) {
        console.error("[API Chained V2] CRITICAL ERROR:", error)

        // REMOVED MOCK DATA FALLBACK to force real error exposure
        return NextResponse.json({
            error: `GENERATION FAILED: ${error.message}`,
            details: error.stack
        }, { status: 500 })
    }
}
