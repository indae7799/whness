import fs from 'fs';
import path from 'path';
import { buildMasterPrompt } from "@/lib/generation/prompt-builder"
import { getTextModelById, DEFAULT_TEXT_MODEL } from "@/lib/config/models"
import { callGoogleGenAI } from "@/lib/google"
import { callOpenRouter } from "@/lib/openrouter"

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
    outlineModelId = 'gemini-3.0-flash', // Default to Gemini 3.0 Flash
    contentModelId = 'gemini-3.0-flash', // Default to Gemini 3.0 Flash
    temperature = 0.7,
    maxOutputTokens = 16384 // Increased to prevent truncation
}: ChainedGenerationParams) {
    console.log(`[ChainedGen] Starting... Topic: ${topic}`)

    // LOAD PROMPT FROM FILE (Parsed for Core Prompt Only)
    let systemInstruction = "";
    try {
        const primaryPath = path.join(process.cwd(), 'PROMPT-v3.1-FINAL.md'); // USER: This is the FINAL one
        const secondaryPath = path.join(process.cwd(), '프롬프트고정.md');
        const fallbackPath = path.join(process.cwd(), 'blog-prompt.md');
        let rawFileContent = "";

        if (fs.existsSync(primaryPath)) {
            rawFileContent = fs.readFileSync(primaryPath, 'utf-8');
            console.log(`[ChainedGen] Parsing System Prompt from: ${primaryPath}`);
        } else if (fs.existsSync(secondaryPath)) {
            rawFileContent = fs.readFileSync(secondaryPath, 'utf-8');
            console.log(`[ChainedGen] Parsing Secondary Prompt from: ${secondaryPath}`);
        } else if (fs.existsSync(fallbackPath)) {
            rawFileContent = fs.readFileSync(fallbackPath, 'utf-8');
            console.log(`[ChainedGen] Parsing Fallback Prompt from: ${fallbackPath}`);
        }

        // Extract SYSTEM PROMPT
        // 1. Try to find the code block inside "## 4. SYSTEM PROMPTS" (for v2.x legacy format)
        const systemPromptMatch = rawFileContent.match(/##\s*4\.\s*SYSTEM\s*PROMPTS[\s\S]*?(```markdown[\s\S]*?```)/i);

        if (systemPromptMatch && systemPromptMatch[1]) {
            // Extract the content inside the first code block under Section 4
            systemInstruction = systemPromptMatch[1].replace(/```markdown|```/g, "").trim();
            console.log(`[ChainedGen] Extracted Core System Prompt from Block (${systemInstruction.length} chars)`);
        } else {
            // 2. FOR v3.1 FINAL: Use the ENTIRE file content
            // The v3.1 file IS the system prompt itself, not just a section.
            console.log("[ChainedGen] Using FULL file content as System Prompt (v3.x Standard)");
            systemInstruction = rawFileContent;
        }

    } catch (e) {
        console.error("[ChainedGen] Failed to load prompt file:", e);
    }

    // STEP 1: Generate Outline with Model A
    const outlinePrompt = `
      You are a Senior SEO Content Strategist. 
      Generate a detailed blog post outline for the topic: "${topic}"
      Focus Keyword: "${focusKeyword}"
      
      The outline must include:
      - A catchy H1 title
      - 4-6 H2 sections (Do NOT include an "Introduction" H2. The intro goes directly under H1).
      - 2-3 H3 sub-sections for each H2
      - A brief description of what to cover in each section (mention real data/examples).
      
      Format the output as a clear Markdown list.
    `

    console.log(`[ChainedGen] Generating outline with ${outlineModelId}...`)
    const rawOutline = await callModel(outlineModelId, outlinePrompt, "", temperature, 2000)

    // Parse Outline into a list for Strategy Structure
    const structureList = rawOutline.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 5 && (line.startsWith('-') || line.startsWith('*') || line.match(/^\d+\./) || line.startsWith('#')));

    // STEP 2: Generate Full Content with Model B using PROMPT BUILDER (Phase 5.2)
    const masterPrompt = await buildMasterPrompt({
        topic: topic,
        focusKeyword: focusKeyword,
        persona: persona,
        strategy: {
            angle: "Data-Driven Guide with First-Hand Experience",
            target_audience: "General Audience seeking actionable advice",
            structure: structureList.length > 0 ? structureList : ["Introduction", "Main Analysis", "Cost Breakdown", "Conclusion"],
            mustInclude: ["Real Cost Numbers ($)", "Comparison Table", "Personal Experience/Mistakes", "Step-by-Step Walkthrough"],
            experienceStatements: ["Based on my recent experience...", "I analyzing the data explicitly...", "When I tried this myself..."]
        },
        contentGaps: []
    }, systemInstruction) // Pass the dynamic prompt file content here

    console.log(`[ChainedGen] Generating full content with ${contentModelId}...`)

    // Pass the FULLY ASSEMBLED prompt (User + System) as a single prompt block
    // We pass "" as systemPrompt because masterPrompt already contains the System Prompt block.
    const fullContent = await callModel(contentModelId, masterPrompt, "", temperature, maxOutputTokens)

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

            // FALLBACK CHAIN: 3.0 → 2.5 → 2.0
            // If primary failed, try 2.5 Flash first
            if (nativeId !== 'gemini-2.5-flash') {
                console.warn(`[ChainedGen] Primary Model failed. Fallback to Gemini 2.5 Flash...`);
                try {
                    return await callGoogleGenAI(systemPrompt, userPrompt, 'gemini-2.5-flash', temp, maxTokens);
                } catch (err2) {
                    console.error(`[ChainedGen] Fallback (2.5 Flash) failed:`, err2);
                }
            }

            // Second Fallback: 2.0 Flash Exp
            if (nativeId !== 'gemini-2.0-flash-exp') {
                console.warn(`[ChainedGen] Fallback to Gemini 2.0 Flash Exp...`);
                try {
                    return await callGoogleGenAI(systemPrompt, userPrompt, 'gemini-2.0-flash-exp', temp, maxTokens);
                } catch (err3) {
                    console.error(`[ChainedGen] Fallback (2.0 Flash Exp) failed:`, err3);
                }
            }

            // Final Fallback: 1.5 Flash (very stable)
            console.warn(`[ChainedGen] Final Fallback to Gemini 1.5 Flash...`);
            return await callGoogleGenAI(systemPrompt, userPrompt, 'gemini-1.5-flash', temp, maxTokens);
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
