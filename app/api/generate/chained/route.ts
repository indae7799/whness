
import { NextResponse } from "next/server"
import { generateChainedArticle } from "@/services/chained-generation"

export async function POST(req: Request) {
    try {
        const { topic, focusKeyword, persona, outlineModelId, contentModelId, temperature, maxOutputTokens } = await req.json()

        if (!topic || !focusKeyword) {
            return NextResponse.json({ error: "Missing topic or focusKeyword" }, { status: 400 })
        }

        console.log(`[API Chained] Starting generation for: ${focusKeyword}`)

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
        console.error("[API Chained] Error:", error)
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 })
    }
}
