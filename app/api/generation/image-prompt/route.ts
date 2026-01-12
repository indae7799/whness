
import { NextRequest, NextResponse } from "next/server";
import { callGoogleGenAI } from "@/lib/google";

export const runtime = "edge";

export async function POST(req: NextRequest) {
    try {
        const { content, focusKeyword } = await req.json();

        if (!content) {
            return NextResponse.json({ error: "Content is required" }, { status: 400 });
        }

        // 1. Extract H1, Intro, and First H2 Logic
        // We need to parse markdown roughly
        const lines = content.split('\n');
        let h1 = "";
        let intro = [];
        let h2 = "";
        let h2Content = [];

        let currentSection = "start"; // start, intro, h2, after_h2

        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('# ')) {
                h1 = trimmed.replace('# ', '');
                currentSection = "intro";
            } else if (trimmed.startsWith('## ')) {
                if (currentSection === "intro") {
                    h2 = trimmed.replace('## ', '');
                    currentSection = "h2";
                } else if (currentSection === "h2") {
                    currentSection = "after_h2";
                    break; // Stop reading after first H2 section is done
                }
            } else {
                if (currentSection === "intro") {
                    intro.push(trimmed);
                } else if (currentSection === "h2") {
                    h2Content.push(trimmed);
                }
            }
        }

        // Combine extracted text
        // If parsing failed (e.g. no markup), fallback to first 2500 chars (approx enough for h1+intro+h2)
        let analysisText = "";
        if (h1 && (intro.length > 0 || h2)) {
            analysisText = `H1: ${h1}\n\nINTRODUCTION:\n${intro.join('\n')}\n\nSECTION H2 (${h2}):\n${h2Content.join('\n')}`;
        } else {
            console.log("Markdown parsing failed or incomplete structure. Using substring fallback.");
            analysisText = content.substring(0, 2500);
        }

        const systemPrompt = `You are an expert AI Art Director and SEO Strategist.
Your task is to analyze the provided minimal content (H1 Title, Introduction, First Section) and generate TWO things:
1. A Creative & Varied Midjourney Image Prompt
2. A Perfect SEO Alt Text

INPUT DATA:
- Focus Keyword: "${focusKeyword || 'General'}"
- Content: The user will provide the H1, Intro, and First H2 of a blog post.

GUIDELINES:
1. **IMAGE PROMPT (CRITICAL: AVOID REPETITION)**:
   - **PROBLEM**: We have too many "cluttered desk", "documents on table", and "laptop with coffee" images.
   - **SOLUTION**: You MUST generate diverse scenes.
   - **Dynamic Settings**: Use specific locations (NYC Street, Cozy Living Room, Park Bench, Airport Gate, Hospital Waiting Room, Modern Kitchen, Cafe Window).
   - **Human Focus**: Focus on the *person* and their *emotion* (relief, stress, joy, contemplation), not just objects.
   - **Forbidden**: DO NOT generate a "messy desk with papers" unless the text explicitly demands it. Avoid generic stock photo look.
   - **Style**: ALLOW ALL STYLES (Photorealistic, Cinematic, 3D, Painting, Illustration) **EXCEPT CARTOON**.
   - **Format**: "[Subject Description with specific location/action], [Lighting/Mood], [Style/Camera] --ar 16:9 --v 6.0"

2. **ALT TEXT (MOST IMPORTANT)**:
   - **Priority**: This is the most critical part. 
   - **Rule**: Must contain the **Focus Keyword** naturally.
   - **Length**: 5-10 words describing the image specifically.
   - **Format**: Just the text explanation.

OUTPUT FORMAT:
You must return STRICT JSON only. No markdown code blocks.
{
  "prompt": "your midjourney prompt here...",
  "altText": "your seo optimized alt text here..."
}`;

        const userPrompt = `Here is the blog content structure:\n\n${analysisText}`;

        // Using FREE Google GenAI
        const rawResponse = await callGoogleGenAI(systemPrompt, userPrompt);

        // Clean response if it contains markdown code blocks
        const cleanedResponse = rawResponse.replace(/```json/g, '').replace(/```/g, '').trim();

        let jsonResponse;
        try {
            jsonResponse = JSON.parse(cleanedResponse);
        } catch (e) {
            console.error("Failed to parse JSON from AI response:", cleanedResponse);
            // Fallback if JSON fails
            jsonResponse = {
                prompt: cleanedResponse,
                altText: `${focusKeyword} - illustrated concept`
            };
        }

        return NextResponse.json({
            prompt: jsonResponse.prompt,
            altText: jsonResponse.altText
        });

    } catch (error) {
        console.error("Error generating image prompt:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
