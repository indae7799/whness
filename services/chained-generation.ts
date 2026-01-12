import fs from 'fs';
import path from 'path';
import { buildSeparatedPrompts } from "@/lib/generation/prompt-builder"
import { getTextModelById, DEFAULT_TEXT_MODEL } from "@/lib/config/models"
import { callGoogleGenAI } from "@/lib/google"
import { callOpenRouter } from "@/lib/openrouter"
import { analyzeSERP } from "@/lib/serp/analyzer"
import { generateAIStrategy } from "@/services/ai-strategy"

interface ChainedGenerationParams {
    topic: string
    focusKeyword: string
    persona?: any
    outlineModelId?: string
    contentModelId?: string
    temperature?: number
    maxOutputTokens?: number
    // Phase 3.5 data passed from keyword generation
    serpAnalysisFromPhase3?: any
    peopleAlsoAsk?: string[]
}

export async function generateChainedArticle({
    topic,
    focusKeyword,
    persona,
    outlineModelId = 'gemini-3.0-flash',
    contentModelId = 'gemini-3.0-flash',
    temperature = 0.7,
    maxOutputTokens = 16384,
    serpAnalysisFromPhase3,
    peopleAlsoAsk = []
}: ChainedGenerationParams) {
    console.log(`[ChainedGen] Starting... Topic: ${topic}`)

    // LOAD PROMPT FROM FILE (PRIMARY: PROMPT-v3.1-FINAL.md, SECONDARY: 프롬프트고정.md)
    let systemInstruction = "";
    const PRIMARY_PATH = path.join(process.cwd(), 'PROMPT-v3.1-FINAL.md');
    const SECONDARY_PATH = path.join(process.cwd(), '프롬프트고정.md');

    let promptFilePath = "";
    if (fs.existsSync(PRIMARY_PATH)) {
        promptFilePath = PRIMARY_PATH;
    } else if (fs.existsSync(SECONDARY_PATH)) {
        promptFilePath = SECONDARY_PATH;
        console.warn(`[ChainedGen] WARNING: Using fallback prompt file: 프롬프트고정.md`);
    } else {
        throw new Error(`[CRITICAL] No prompt file found! Required: PROMPT-v3.1-FINAL.md or 프롬프트고정.md`);
    }

    try {
        const rawFileContent = fs.readFileSync(promptFilePath, 'utf-8');
        console.log(`[ChainedGen] Loading System Prompt from: ${promptFilePath}`);

        const systemPromptMatch = rawFileContent.match(/##\s*4\.\s*SYSTEM\s*PROMPTS[\s\S]*?(```markdown[\s\S]*?```)/i);
        if (systemPromptMatch && systemPromptMatch[1]) {
            systemInstruction = systemPromptMatch[1].replace(/```markdown|```/g, "").trim();
        } else {
            systemInstruction = rawFileContent;
        }
    } catch (e) {
        console.error("[ChainedGen] Failed to load PROMPT-v3.1-FINAL.md:", e);
        throw e;
    }

    // ========== PHASE 4: SERP DEEP DIVE (1-2 calls) ==========
    // Only call SERP if not already done in Phase 3.5
    let serpAnalysis = serpAnalysisFromPhase3;
    let contentGaps: string[] = [];
    let differentiationStrategy: any = null;

    if (!serpAnalysis) {
        console.log(`[ChainedGen] Phase 4: Running SERP analysis for "${focusKeyword}"...`);
        try {
            serpAnalysis = await analyzeSERP(focusKeyword);
            console.log(`[ChainedGen] SERP analysis completed. Gaps found: ${serpAnalysis?.contentGaps?.length || 0}`);
        } catch (e) {
            console.error("[ChainedGen] SERP analysis failed:", e);
        }
    } else {
        console.log(`[ChainedGen] Using SERP analysis from Phase 3.5`);
    }

    // Extract content gaps from SERP analysis
    if (serpAnalysis?.contentGaps) {
        contentGaps = serpAnalysis.contentGaps;
    }

    // ========== PHASE 5.1: AI STRATEGY GENERATION ==========
    console.log(`[ChainedGen] Phase 5.1: Generating differentiation strategy...`);
    try {
        differentiationStrategy = await generateAIStrategy(
            focusKeyword,
            serpAnalysis,
            peopleAlsoAsk,
            [topic]
        );
        console.log(`[ChainedGen] Strategy generated. Angle: ${differentiationStrategy?.angle || 'N/A'}`);
    } catch (e) {
        console.error("[ChainedGen] Strategy generation failed, using defaults:", e);
    }

    // STEP 1: Generate Outline with Model A
    const outlinePrompt = `
      You are a Senior SEO Content Strategist. 
      Generate a detailed blog post outline for the topic: "${topic}"
      Focus Keyword: "${focusKeyword}"
      
      ${contentGaps.length > 0 ? `Content Gaps to Address: ${contentGaps.slice(0, 3).join(", ")}` : ""}
      
      The outline must include:
      - A catchy H1 title
      - 4-6 H2 sections (Do NOT include an "Introduction" H2. The intro goes directly under H1).
      - 2-3 H3 sub-sections for each H2
      - A brief description of what to cover in each section (mention real data/examples).
      
      Format the output as a clear Markdown list.
    `

    console.log(`[ChainedGen] Generating outline with ${outlineModelId}...`)
    const rawOutline = await callModel(outlineModelId, outlinePrompt, "", temperature, 2000)

    const structureList = rawOutline.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 5 && (line.startsWith('-') || line.startsWith('*') || line.match(/^\d+\./) || line.startsWith('#')));

    // ========== PHASE 5.2: BUILD PROMPT WITH REAL STRATEGY ==========
    const { systemPrompt, userPrompt } = await buildSeparatedPrompts({
        topic: topic,
        focusKeyword: focusKeyword,
        persona: persona,
        strategy: {
            angle: differentiationStrategy?.angle || "Data-Driven Guide with First-Hand Experience",
            target_audience: differentiationStrategy?.targetAudience || "General Audience seeking actionable advice",
            structure: structureList.length > 0 ? structureList : ["Introduction", "Main Analysis", "Cost Breakdown", "Conclusion"],
            mustInclude: differentiationStrategy?.mustInclude || ["Real Cost Numbers ($)", "Comparison Table", "Personal Experience/Mistakes", "Step-by-Step Walkthrough"],
            experienceStatements: differentiationStrategy?.experienceStatements || ["Based on my recent experience...", "I analyzing the data explicitly...", "When I tried this myself..."]
        },
        contentGaps: contentGaps  // REAL content gaps from SERP analysis!
    }, systemInstruction)

    console.log(`[ChainedGen] Generating full content with ${contentModelId}...`)
    console.log(`[ChainedGen] Content Gaps being used: ${contentGaps.length > 0 ? contentGaps.join(", ") : "None"}`)
    console.log(`[ChainedGen] System Prompt Length: ${systemPrompt.length} chars`)
    console.log(`[ChainedGen] User Prompt Length: ${userPrompt.length} chars`)

    const fullContent = await callModel(contentModelId, userPrompt, systemPrompt, temperature, maxOutputTokens)

    // STEP 3: Parse and Return
    return parseGeneratedContent(fullContent, focusKeyword)
}

async function callModel(modelId: string, userPrompt: string, systemPrompt: string = "", temp = 0.7, maxTokens = 8192) {
    const model = getTextModelById(modelId) || DEFAULT_TEXT_MODEL

    // routing logic: distinct check for Google/Gemini models to use Native SDK
    const isGoogleModel = model.id.toLowerCase().includes('gemini') ||
        model.name.toLowerCase().includes('gemini') ||
        model.id.toLowerCase().includes('google');

    if (isGoogleModel) {
        // Remove 'google/' or suffixes for Native API
        let nativeId = model.id.replace('google/', '').replace(':free', '')

        console.log(`[ChainedGen] Usage: Native Google SDK for ${nativeId}`)

        try {
            return await callGoogleGenAI(systemPrompt, userPrompt, nativeId, temp, maxTokens)
        } catch (err: any) {
            console.error(`[ChainedGen] Google API Failed for ${nativeId}:`, err.message)

            // FALLBACK Logic
            // Level 1: Try stable 1.5 Flash (001)
            console.warn(`[ChainedGen] Primary Model (${nativeId}) failed. Attempting Fallback 1: 'gemini-1.5-flash-001'...`);

            try {
                return await callGoogleGenAI(systemPrompt, userPrompt, 'gemini-1.5-flash-001', temp, maxTokens);
            } catch (fallbackErr1: any) {
                console.error(`[ChainedGen] Fallback 1 failed:`, fallbackErr1.message);

                // Level 2: Try stable 1.5 Pro (001) - Last Resort
                console.warn(`[ChainedGen] Attempting Fallback 2: 'gemini-1.5-pro-001' (High Stable)...`);
                try {
                    return await callGoogleGenAI(systemPrompt, userPrompt, 'gemini-1.5-pro-001', temp, maxTokens);
                } catch (fallbackErr2: any) {
                    console.error(`[ChainedGen] ALL Fallbacks failed.`, fallbackErr2.message);
                    throw err; // Throw ORIGINAL error
                }
            }
        }
    } else {
        // Non-Google models (or other providers) will use OpenRouter
        console.log(`[ChainedGen] Using OpenRouter for Model: ${model.id}`)
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

    // 1. Remove ALL Markdown code fences (global, multiline)
    let cleanContent = content
        .replace(/```html\s*/gi, '')
        .replace(/```markdown\s*/gi, '')
        .replace(/```text\s*/gi, '')
        .replace(/```\s*/g, '')  // Remove ALL remaining code fences
        .replace(/^text\s*/im, '') // Remove 'text' artifact at start
        .trim();

    // 2. Fix Markdown Bold to HTML Strong (AI often mixes them inside HTML)
    cleanContent = cleanContent.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // 3. Keep ONLY the FIRST image placeholder, remove duplicates
    const imagePlaceholder = '[INSERT_IMAGE_HERE]';
    const firstImageIndex = cleanContent.indexOf(imagePlaceholder);
    if (firstImageIndex !== -1) {
        // Keep first occurrence, remove all others
        const beforeFirst = cleanContent.substring(0, firstImageIndex + imagePlaceholder.length);
        const afterFirst = cleanContent.substring(firstImageIndex + imagePlaceholder.length)
            .replace(/\[INSERT_IMAGE_HERE\]/g, ''); // Remove all subsequent
        cleanContent = beforeFirst + afterFirst;
    }

    // 4. Remove Korean text (usually from truncation/language mixing)
    cleanContent = cleanContent.replace(/[가-힣]+[^<>]*(?=<|$)/g, '');

    // 5. Fix Common Capitalization Issues
    cleanContent = cleanContent.replace(/\bmedicare\b/gi, 'Medicare')
        .replace(/\bpart a\b/gi, 'Part A')
        .replace(/\bpart b\b/gi, 'Part B')
        .replace(/\bpart c\b/gi, 'Part C')
        .replace(/\bpart d\b/gi, 'Part D');

    // 6. Clean up any double line breaks from removed content
    cleanContent = cleanContent.replace(/\n{3,}/g, '\n\n');

    return {
        title,
        content: cleanContent,
        metaTitle: metaTitleMatch ? metaTitleMatch[1].trim() : title,
        metaDesc: metaDescMatch ? metaDescMatch[1].trim() : "",
        slug: slugMatch ? slugMatch[1].trim().replace(/^\/|\/$/g, '') : focusKeyword.toLowerCase().replace(/\s+/g, '-'),
        wordCount: cleanContent.split(/\s+/).length
    }
}
