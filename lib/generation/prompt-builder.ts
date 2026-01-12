import fs from "fs/promises"
import path from "path"

export interface PromptData {
    topic: string
    focusKeyword: string
    // Expanded Strategy Fields (Phase 5.2)
    strategy?: {
        angle: string
        target_audience: string
        structure: string[]
        mustInclude: string[]
        experienceStatements: string[]
    }
    contentGaps?: string[]
    referenceInfo?: Record<string, any> // Fallback
    persona?: Record<string, any>
}

// Return type for separated prompts
export interface SeparatedPrompts {
    systemPrompt: string
    userPrompt: string
}

import { FAIL_SAFE_SYSTEM_PROMPT } from "@/lib/prompts/fixedPrompt";

// CRITICAL REMINDERS - Repeated at the end to reinforce compliance
const CRITICAL_REMINDERS = `

=== CRITICAL REMINDERS (MUST FOLLOW) ===

⚠️ META DATA BLOCK (FIRST THING TO OUTPUT):
- Output as PLAIN TEXT, NOT HTML <meta> tags!
- Format: META TITLE: [text] / META DESCRIPTION: [text] / FOCUS KEYWORD: [text]

⚠️ OUTPUT FORMAT:
- Output PURE HTML with Inline CSS (NO Markdown # ## ###)
- ENGLISH ONLY - No Korean or other languages

⚠️ EXTERNAL LINKS (REQUIRED - 2-3 links):
- You MUST include actual <a href="..."> tags, not just text mentions!
- Example: <a href="https://www.medicare.gov/" target="_blank">Medicare.gov</a>

⚠️ IMAGE RULE:
- Use [INSERT_IMAGE_HERE] EXACTLY ONCE after the intro paragraph
- Do NOT use actual image URLs or <img src="...">

⚠️ SEO COMPLIANCE:
- Focus Keyword in: H1 (1x), First 100 words (1x), 4+ H2s, Conclusion (1x)
- Keyword density: STRICTLY 1.4-1.8% (Must use 35-45 times explicitly)
- 2,000+ words minimum

⚠️ FAQ FORMAT:
- Use H3 for questions, NOT <ul><li>
- Maximum 5 FAQs with 50-100 word answers

⚠️ QUICK ACTION CHECKLIST:
- For process articles: Include ☐ checklist at the end

=== END REMINDERS ===
`;

/**
 * NEW: Returns separated System Prompt and User Prompt
 * This allows proper API handling where System Instruction is passed separately
 */
export async function buildSeparatedPrompts(data: PromptData, systemPromptOverride?: string): Promise<SeparatedPrompts> {
    // 1. SYSTEM PROMPT: Full rules from fixedPrompt.ts or override
    const systemPrompt = systemPromptOverride || FAIL_SAFE_SYSTEM_PROMPT;

    // 2. CONSTRUCT STRATEGIC CONTEXT BLOCK
    let strategyBlock = "";
    if (data.strategy) {
        strategyBlock = `
=== STRATEGIC CONTEXT ===
Target Audience: ${data.strategy.target_audience}
Content Angle: ${data.strategy.angle}

Outline Structure:
${data.strategy.structure.map(s => `- ${s}`).join("\n")}

Must Include: ${data.strategy.mustInclude.join(", ")}
Content Gaps: ${data.contentGaps && data.contentGaps.length > 0 ? data.contentGaps.join(", ") : "N/A"}
Experience Statements: ${data.strategy.experienceStatements.map(s => `"${s}"`).join(", ")}
=== END STRATEGIC CONTEXT ===
`;
    }

    // 3. CONSTRUCT GAPS BLOCK (Always include if gaps exist)
    let gapsBlock = "";
    if (data.contentGaps && data.contentGaps.length > 0) {
        gapsBlock = `
=== COMPETITOR CONTENT GAPS (OPPORTUNITIES) ===
These are missing from top competitors. YOU MUST FILL THESE HOLES:
${data.contentGaps.map(gap => `- ${gap}`).join("\n")}
=== END GAPS ===
`;
    }

    // 4. USER PROMPT: Topic + Strategy + Gaps + Critical Reminders
    const userPrompt = `
TOPIC: ${data.topic}
FOCUS KEYWORD: ${data.focusKeyword}

${strategyBlock}

${gapsBlock}

Now write the complete blog article following ALL the rules in your System Instructions.
${CRITICAL_REMINDERS}
`.trim();

    return { systemPrompt, userPrompt };
}

/**
 * LEGACY: Returns combined prompt for backward compatibility
 * @deprecated Use buildSeparatedPrompts instead
 */
export async function buildMasterPrompt(data: PromptData, systemPromptOverride?: string): Promise<string> {
    const { systemPrompt, userPrompt } = await buildSeparatedPrompts(data, systemPromptOverride);

    // Combine for legacy usage (less effective but backward compatible)
    return `
${userPrompt}

=============================================
${systemPrompt}
=============================================
`.trim();
}
