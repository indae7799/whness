
import { buildMasterPrompt } from "@/lib/generation/prompt-builder"
import { getTextModelById, DEFAULT_TEXT_MODEL } from "@/lib/config/models"
import { callOpenRouter } from "@/lib/openrouter"
import { callGoogleGenAI } from "@/lib/google"
import { FIXED_PROMPT_CONTENT } from "@/lib/prompts/fixedPrompt"

interface GenerateContentParams {
    topic: string
    focusKeyword: string
    persona?: string
    referenceData?: string
    textModelId?: string
}

export interface GeneratedArticle {
    title: string
    content: string
    markdownContent?: string
    metaTitle: string
    metaDesc: string
    slug: string
    estimatedWordCount: number
}

export async function generateArticle({
    topic,
    focusKeyword,
    persona,
    referenceData,
    textModelId
}: GenerateContentParams): Promise<GeneratedArticle> {

    // Get the selected model or use default
    const model = textModelId
        ? getTextModelById(textModelId) || DEFAULT_TEXT_MODEL
        : DEFAULT_TEXT_MODEL

    console.log(`[Content] Selected model: ${model.name} (${model.tier})`)

    // Build unique prompt path from blog-prompt.md logic
    const promptContent = await buildMasterPrompt({
        topic: topic,
        focusKeyword: focusKeyword,
        persona: typeof persona === 'string' ? { description: persona } : undefined,
        referenceInfo: referenceData ? { data: referenceData } : undefined
    })

    // Use the FIXED PROMPT as the System Prompt to enforce all rules
    const systemPrompt = FIXED_PROMPT_CONTENT
    let content = ""

    // Strategy: Respect User Selection
    // If Google model selected -> Try Google SDK -> Fallback to OpenRouter
    // If other model selected -> OpenRouter directly

    const isGoogleModel = model.id.toLowerCase().includes('gemini') || model.id.toLowerCase().includes('google')

    try {
        if (isGoogleModel) {
            try {
                // 1. Google GenAI Native
                content = await callGoogleGenAI(systemPrompt, promptContent)
            } catch (googleError) {
                console.warn("⚠️ Google GenAI failed, falling back to OpenRouter...", googleError)

                // 2. OpenRouter Fallback (using same ID)
                content = await callOpenRouter(model.id, [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: promptContent }
                ])
            }
        } else {
            // 3. Non-Google Model (OpenRouter Direct)
            console.log(`[Content] Using OpenRouter for ${model.name}`)
            content = await callOpenRouter(model.id, [
                { role: "system", content: systemPrompt },
                { role: "user", content: promptContent }
            ])
        }

        // Parse metadata from content
        const metaTitleMatch = content.match(/META TITLE.*?: (.*)/i)
        const metaDescMatch = content.match(/META DESCRIPTION.*?: (.*)/i)
        const slugMatch = content.match(/URL SLUG.*?: (.*)/i)

        // Extract title from H1 or fallback
        const h1Match = content.match(/^#\s+(.+)$/m)
        const title = h1Match ? h1Match[1].trim() : (metaTitleMatch?.[1]?.trim() || `${focusKeyword} Guide`)

        // Clean up markdown code blocks if present
        const cleanContent = content
            .replace(/^```html/m, '')
            .replace(/^```markdown/m, '')
            .replace(/^```/m, '')
            .replace(/```$/m, '')
            .trim()

        return {
            title: title,
            content: cleanContent,
            markdownContent: cleanContent,
            metaTitle: metaTitleMatch ? metaTitleMatch[1].trim() : title,
            metaDesc: metaDescMatch ? metaDescMatch[1].trim() : "",
            slug: slugMatch ? slugMatch[1].trim().replace(/^\/|\/$/g, '') : focusKeyword.toLowerCase().replace(/\s+/g, '-'),
            estimatedWordCount: cleanContent.trim().split(/\s+/).length
        }

    } catch (error) {
        console.error("Error generating content:", error)
        throw error
    }
}
