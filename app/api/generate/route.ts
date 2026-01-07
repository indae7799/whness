import { NextResponse } from "next/server"
import { buildMasterPrompt } from "@/lib/generation/prompt-builder"
import { TEXT_MODELS, getTextModelById, DEFAULT_TEXT_MODEL, type TextModel } from "@/lib/config/models"
import { callGoogleGenAI } from "@/lib/google"

export const runtime = 'nodejs'

// OpenRouter API (supports multiple models including free ones)
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"

// OpenAI API (for GPT-4o direct calls)
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions"

async function callModel(model: TextModel, systemPrompt: string, userPrompt: string): Promise<string> {
    if (model.provider === 'openai') {
        return callOpenAI(model.id, systemPrompt, userPrompt)
    } else {
        return callOpenRouter(model.id, systemPrompt, userPrompt)
    }
}

async function callOpenRouter(modelId: string, systemPrompt: string, userPrompt: string): Promise<string> {
    const apiKey = process.env.OPENROUTER_API_KEY

    if (!apiKey) {
        throw new Error("OPENROUTER_API_KEY is not set")
    }

    console.log(`[Generate] Using OpenRouter model: ${modelId}`)

    const response = await fetch(OPENROUTER_API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
            "HTTP-Referer": process.env.OPENROUTER_REFERER || "http://localhost:3000",
            "X-Title": process.env.OPENROUTER_TITLE || "Whness Blog Generator"
        },
        body: JSON.stringify({
            model: modelId,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            temperature: 0.7,
            max_tokens: 8192,
        })
    })

    if (!response.ok) {
        const error = await response.text()
        console.error("OpenRouter API error:", error)
        throw new Error(`OpenRouter API failed: ${response.status} - ${error}`)
    }

    const data = await response.json()
    return data.choices?.[0]?.message?.content || ""
}

async function callOpenAI(modelId: string, systemPrompt: string, userPrompt: string): Promise<string> {
    const apiKey = process.env.OPENAI_API_KEY

    if (!apiKey) {
        throw new Error("OPENAI_API_KEY is not set")
    }

    console.log(`[Generate] Using OpenAI model: ${modelId}`)

    const response = await fetch(OPENAI_API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: modelId,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            temperature: 0.7,
            max_tokens: 8192,
        })
    })

    if (!response.ok) {
        const error = await response.text()
        console.error("OpenAI API error:", error)
        throw new Error(`OpenAI API failed: ${response.status} - ${error}`)
    }

    const data = await response.json()
    return data.choices?.[0]?.message?.content || ""
}

// Content analysis and validation functions
function analyzeContent(content: string, focusKeyword: string) {
    const issues: string[] = []
    const words = content.match(/\b\w[\w']*\b/g) || []
    const wordCount = words.length
    const h2 = content.match(/^##\s+.+/gm) || []
    const hasTable = /\n\|.+\|\n/.test(content)
    const hasMeta = content.includes("META TITLE")

    if (wordCount < 2000) issues.push("Word count below 2,000")
    if (h2.length < 4) issues.push("Need more H2 sections")
    if (!hasTable) issues.push("Add comparison table")
    if (!hasMeta) issues.push("Add meta block")

    return { issues, wordCount }
}

function ensureMetaBlock(content: string, focusKeyword: string): string {
    if (content.includes("META TITLE")) return content

    const h1Match = content.match(/^#\s+(.+)$/m)
    const title = h1Match ? h1Match[1].trim() : `Guide to ${focusKeyword}`
    const slug = `/${focusKeyword.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}/`

    const metaBlock = `<!-- 
META TITLE: ${title}
META DESCRIPTION: Complete guide to ${focusKeyword}
URL SLUG: ${slug}
FOCUS KEYWORD: ${focusKeyword}
-->

`
    return metaBlock + content.trimStart()
}

function stripCodeFences(content: string): string {
    let updated = content.trim()
    if (updated.startsWith("```")) {
        const firstBreak = updated.indexOf("\n")
        updated = firstBreak === -1 ? updated : updated.slice(firstBreak + 1)
        if (updated.endsWith("```")) {
            updated = updated.slice(0, -3).trim()
        }
    }
    return updated
}

export async function POST(req: Request) {
    try {
        const body = await req.json()

        // CASE 1: Image Prompt Generation (High-End Prompt Creator)
        if (body.prompt) {
            console.log("[Generate] Processing Image Prompt Request...");

            const IMAGE_PROMPT_SYSTEM = `
You are an expert AI Art Director for a New York Lifestyle Blog.
Generate a MIDJOURNEY PROMPT (\`--v 6.0\`) based on the User's Topic.

[STYLE RULES - STRICT]
- Genre: Documentary Photography / Street Photography / Unsplash Style
- Camera: Fujifilm X100V or Leica M6 (Film simulation)
- Lens: 35mm (Natural perspective)
- Lighting: Natural Day Light, Window Light, or Raw Flash (No dramatic studio lighting)
- Texture: Kodak Portra 400 grain, slight motion blur, 4k realistic

[CONTENT RULES]
- **NO FACES**: Focusing on hands, objects, feet, back of head, or silhouettes.
- **RAW REALITY**: Capture the messiness of life (overflowing trash can, stack of papers, crumpled receipts).
- **POV**: First-person view (looking at hands) or Over-the-shoulder.
- **Space**: Authentic NYC environments (subway tiles, messy desk, busy crosswalk).

[OUTPUT FORMAT]
Documentary photography of [SCENE/OBJECT FOCUS], [NATURAL LIGHTING], shot on Fujifilm X100V, raw style, authentic texture, 16:9 aspect ratio --ar 16:9 --v 6.0 --no text --no face --no posed models --no cinematic lighting


`;

            // Clean up the input (remove previous hardcoded instructions if any)
            const topic = body.prompt.replace(/Create a premium.*about: /, "").split(".")[0].replace(/"/g, "").trim();
            const userInstruction = `Topic: "${topic}". \nCreate a photorealistic prompt focusing on STORY and ATMOSPHERE.`;

            // Use the robust callGoogleGenAI (System Prompt, User Prompt, Model)
            const result = await callGoogleGenAI(
                IMAGE_PROMPT_SYSTEM,
                userInstruction,
                body.model || 'gemini-1.5-pro'
            );
            return NextResponse.json({ result: result.trim() });
        }

        // CASE 2: Legacy Article Generation (existing logic)
        const { keyword, topic, textModelId } = body
        if (!keyword) {
            return NextResponse.json({ error: "Keyword or Prompt is required" }, { status: 400 })
        }
        // ... rest of the function ...

        const focusKeyword = keyword.phrase || keyword

        // Get the selected model or use default (free model)
        const selectedModel = textModelId
            ? getTextModelById(textModelId) || DEFAULT_TEXT_MODEL
            : DEFAULT_TEXT_MODEL

        console.log(`[Generate] Selected model: ${selectedModel.name} (${selectedModel.tier})`)

        // Build the system prompt
        const systemPrompt = await buildMasterPrompt({
            topic: topic || focusKeyword,
            focusKeyword: focusKeyword,
        })

        // Build user prompt
        const userPrompt = `Write a comprehensive SEO blog article about "${focusKeyword}".

Requirements:
- 2,200-2,500 words
- Include H1, H2 (4-8), H3 sections
- Add image placeholders [Image: description]
- Include FAQ section with 5-6 questions
- Add comparison table
- Use first-person NYC resident perspective
- Include specific dollar amounts, times, and brand names

Focus Keyword: ${focusKeyword}
Topic: ${topic || focusKeyword}

Return the complete article in Markdown format.`

        // Generate content
        let content = await callModel(selectedModel, systemPrompt, userPrompt)

        // Post-process
        content = stripCodeFences(content)
        content = ensureMetaBlock(content, focusKeyword)

        // Analyze
        const { issues, wordCount } = analyzeContent(content, focusKeyword)

        // If too short and not free model, try to expand
        if (wordCount < 2000 && selectedModel.tier !== 'free') {
            const expandPrompt = `Expand the following article to 2,200-2,500 words while maintaining quality:\n\n${content}`
            content = await callModel(selectedModel, systemPrompt, expandPrompt)
            content = stripCodeFences(content)
            content = ensureMetaBlock(content, focusKeyword)
        }

        // Stream response
        const encoder = new TextEncoder()
        const stream = new TransformStream()
        const writer = stream.writable.getWriter()

            ; (async () => {
                try {
                    await writer.write(encoder.encode(content))
                } catch (err) {
                    console.error("Stream Error:", err)
                    await writer.write(encoder.encode("\n\n[Error: " + String(err) + "]"))
                } finally {
                    await writer.close()
                }
            })()

        return new NextResponse(stream.readable, {
            headers: {
                "Content-Type": "text/plain; charset=utf-8",
                "Cache-Control": "no-cache",
                "X-Model-Used": selectedModel.name,
                "X-Model-Tier": selectedModel.tier,
            },
        })

    } catch (error) {
        console.error("Generation API Error:", error)
        return NextResponse.json(
            { error: "Internal Server Error: " + String(error) },
            { status: 500 }
        )
    }
}

// GET endpoint to list available models
export async function GET() {
    return NextResponse.json({
        textModels: TEXT_MODELS.map(m => ({
            id: m.id,
            name: m.name,
            tier: m.tier,
            description: m.description,
            inputCost: m.inputCost,
            outputCost: m.outputCost
        })),
        defaultModel: DEFAULT_TEXT_MODEL.id
    })
}
