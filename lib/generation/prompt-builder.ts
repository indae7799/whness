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

import { FAIL_SAFE_SYSTEM_PROMPT } from "@/lib/prompts/fixedPrompt";

export async function buildMasterPrompt(data: PromptData, systemPromptOverride?: string): Promise<string> {
    try {
        // 1. USE OVERRIDE (Dynamic File) OR FAIL-SAFE (Static)
        const systemInstruction = systemPromptOverride || FAIL_SAFE_SYSTEM_PROMPT;


        // 2. CONSTRUCT STRATEGIC CONTEXT BLOCK (Matches fixedPrompt.ts format)
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

        // 3. CONSTRUCT GAPS BLOCK (Only if not already in STRATEGIC CONTEXT)
        let gapsBlock = "";
        if (!data.strategy && data.contentGaps && data.contentGaps.length > 0) {
            gapsBlock = `
[CONTENT GAPS TO FILL (Competitor Weaknesses)]
${data.contentGaps.map(gap => `- ${gap}`).join("\n")}
`;
        }

        // 4. BUILD FULL PROMPT (Clean & Direct)
        // We removed hardcoded [SEO REQUIREMENTS] and [EXPANSION INSTRUCTION] 
        // because "프롬프트고정.md" (systemInstruction) now contains the full authoritative rules.
        const fullPrompt = `
TOPIC: ${data.topic}
FOCUS KEYWORD: ${data.focusKeyword}

${strategyBlock}

${gapsBlock}

=============================================
${systemInstruction}
=============================================
`.trim();

        return fullPrompt;

    } catch (error) {
        console.error("Error building prompt:", error)
        throw error
    }
}
