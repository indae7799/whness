
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

        const systemPrompt = `You are an expert AI Art Director.
Your task is to analyze the provided blog context (H1 Title, Introduction, First Section) and generate a High-Quality Image Prompt and SEO Alt Text.

INPUT DATA:
- Focus Keyword: "${focusKeyword || 'General'}"
- Context: H1 (Title), Intro, and First H2.

GUIDELINES:
1. **IMAGE PROMPT**:
   - **Goal**: Create a visual metaphor or realistic scene that represents the *core theme* of the content.
   - **Style**: Cinematic, Photorealistic, 3D Render, or Professional Photography.
   - **Constraint**: **NO CARTOON, NO ANIME, NO ILLUSTRATION**.
   - **Banned**: **NO DESKS, NO PAPERWORK, NO LAPTOPS, NO OFFICE INTERIORS**.
   - **Variety**: Focus on *cinematic scenes*, *outdoor settings*, *emotional close-ups*, or *abstract metaphors*.
   - **Format**: "[Subject/Scene Description], [Lighting], [Style/Camera] --ar 16:9 --v 6.0"

2. **ALT TEXT**:
   - Must contain the **Focus Keyword** naturally.
   - 5-10 words describing the image.

OUTPUT FORMAT (STRICT JSON):
{
  "prompt": "your midjourney prompt...",
  "altText": "your alt text..."
}`;

        const userPrompt = `Here is the blog content structure:\n\n${analysisText}`;

        // Using FREE Google GenAI with high temperature for variety
        const rawResponse = await callGoogleGenAI(systemPrompt, userPrompt, undefined, 0.9);

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
