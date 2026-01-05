
import { buildMasterPrompt } from "@/lib/generation/prompt-builder"
import { getTextModelById, DEFAULT_TEXT_MODEL } from "@/lib/config/models"
import { callGoogleGenAI } from "@/lib/google"
import { callOpenRouter } from "@/lib/openrouter"
import { FIXED_PROMPT_CONTENT } from "@/lib/prompts/fixedPrompt"

interface ChainedGenerationParams {
    topic: string
    focusKeyword: string
    persona?: any
    outlineModelId?: string
    contentModelId?: string
    temperature?: number
    maxOutputTokens?: number
}

export async function generateChainedArticle({
    topic,
    focusKeyword,
    persona,
    outlineModelId = 'google/gemini-3.0-flash:free',
    contentModelId = 'google/gemini-2.5-flash:free',
    temperature = 0.7,
    maxOutputTokens = 8192
}: ChainedGenerationParams) {
    console.log(`[ChainedGen] Starting... Topic: ${topic}`)

    // STEP 1: Generate Outline with Model A (e.g. 3.0)
    const outlinePrompt = `
      You are a Senior SEO Content Strategist. 
      Generate a detailed blog post outline for the topic: "${topic}"
      Focus Keyword: "${focusKeyword}"
      
      The outline must include:
      - A catchy H1 title
      - 4-6 H2 sections
      - 2-3 H3 sub-sections for each H2
      - A brief description of what to cover in each section.
      
      Format the output as a clear Markdown list.
    `

    console.log(`[ChainedGen] Generating outline with ${outlineModelId}...`)
    const rawOutline = await callModel(outlineModelId, outlinePrompt, "", temperature, 2000)

    // STEP 2: Generate Full Content with Model B (e.g. 2.5) based on the outline
    const masterPrompt = await buildMasterPrompt({
        topic: topic,
        focusKeyword: focusKeyword,
        persona: persona,
        referenceInfo: { data: `Use this outline as the strictly followed structure:\n${rawOutline}` }
    })

    console.log(`[ChainedGen] Generating full content with ${contentModelId}...`)
    // Use the FIXED_PROMPT_CONTENT as the final system instruction to ensure premium quality
    const fullContent = await callModel(contentModelId, masterPrompt, FIXED_PROMPT_CONTENT, temperature, maxOutputTokens)

    // STEP 3: Parse and Return
    return parseGeneratedContent(fullContent, focusKeyword)
}

async function callModel(modelId: string, userPrompt: string, systemPrompt: string = "", temp = 0.7, maxTokens = 8192) {
    const model = getTextModelById(modelId) || DEFAULT_TEXT_MODEL
    const isGoogleModel = model.id.toLowerCase().includes('gemini') || model.id.toLowerCase().includes('google')

    // Clean up IDs for native API if needed (e.g. remove 'google/' and ':free')
    const nativeId = model.id.replace('google/', '').replace(':free', '')

    if (isGoogleModel) {
        try {
            // Re-map to the actual Gemini IDs if they are the new 2026 ones
            // For now, if it's 3.0/2.5 we use the native fallback or handle it in lib/google.ts
            return await callGoogleGenAI(systemPrompt, userPrompt, nativeId, temp, maxTokens)
        } catch (err) {
            console.warn(`Native Google API failed for ${nativeId}, trying OpenRouter...`)
            return await callOpenRouter(model.id, [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ])
        }
    } else {
        return await callOpenRouter(model.id, [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
        ])
    }
}

function parseGeneratedContent(content: string, focusKeyword: string) {
    const metaTitleMatch = content.match(/META TITLE.*?: (.*)/i)
    const metaDescMatch = content.match(/META DESCRIPTION.*?: (.*)/i)
    const slugMatch = content.match(/URL SLUG.*?: (.*)/i)
    const h1Match = content.match(/^#\s+(.+)$/m)

    const title = h1Match ? h1Match[1].trim() : (metaTitleMatch?.[1]?.trim() || `${focusKeyword} Guide`)

    const cleanContent = content
        .replace(/^```html/m, '')
        .replace(/^```markdown/m, '')
        .replace(/^```/m, '')
        .replace(/```$/m, '')
        .trim()

    return {
        title,
        content: cleanContent,
        metaTitle: metaTitleMatch ? metaTitleMatch[1].trim() : title,
        metaDesc: metaDescMatch ? metaDescMatch[1].trim() : "",
        slug: slugMatch ? slugMatch[1].trim().replace(/^\/|\/$/g, '') : focusKeyword.toLowerCase().replace(/\s+/g, '-'),
        wordCount: cleanContent.split(/\s+/).length
    }
}
