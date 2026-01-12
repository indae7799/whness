
import { NextResponse } from "next/server"
import { generateChainedArticle } from "@/services/chained-generation"

export async function POST(req: Request) {
    try {
        const {
            topic,
            focusKeyword,
            persona,
            outlineModelId: userOutlineModel,
            contentModelId: userContentModel,
            temperature,
            maxOutputTokens,
            mode,
            // Phase 3.5 data passed from frontend
            serpAnalysis: serpAnalysisFromPhase3,
            peopleAlsoAsk
        } = await req.json()

        if (!topic || !focusKeyword) {
            return NextResponse.json({ error: "Missing topic or focusKeyword" }, { status: 400 })
        }

        // Map 'mode' ('3.0', '2.5', 'hybrid') to actual Model IDs
        let outlineModelId = userOutlineModel || 'google/gemini-3-flash-preview';
        let contentModelId = userContentModel || 'google/gemini-3-flash-preview';

        if (mode === '3.0') {
            outlineModelId = 'google/gemini-3-flash-preview';
            contentModelId = 'google/gemini-3-flash-preview';
        } else if (mode === '2.5') {
            outlineModelId = 'google/gemini-2.5-flash';
            contentModelId = 'google/gemini-2.5-flash';
        } else if (mode === 'hybrid') {
            outlineModelId = 'google/gemini-3-flash-preview';
            contentModelId = 'google/gemini-3-flash-preview';
        }

        console.log(`[API Chained V2] Mode: ${mode} -> Outline: ${outlineModelId}, Content: ${contentModelId}`)
        console.log(`[API Chained V2] Starting generation for: ${focusKeyword}`)
        console.log(`[API Chained V2] SERP data from Phase 3.5: ${serpAnalysisFromPhase3 ? 'Yes' : 'No'}`)

        const result = await generateChainedArticle({
            topic,
            focusKeyword,
            persona,
            outlineModelId,
            contentModelId,
            temperature,
            maxOutputTokens,
            // Pass Phase 3.5 data to Phase 4-5
            serpAnalysisFromPhase3,
            peopleAlsoAsk: peopleAlsoAsk || []
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
