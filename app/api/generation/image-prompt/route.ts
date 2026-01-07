
import { NextRequest, NextResponse } from "next/server";
import { callGoogleGenAI } from "@/lib/google";

export const runtime = "edge";

export async function POST(req: NextRequest) {
    try {
        const { content, focusKeyword } = await req.json();

        if (!content) {
            return NextResponse.json({ error: "Content is required" }, { status: 400 });
        }

        // Limit content to first 3000 chars to avoid token limits and focus on intro/atmosphere
        const truncatedContent = content.substring(0, 3000);

        const systemPrompt = `You are an expert AI Art Director for authentic lifestyle content. 
Your task is to read a blog post introduction and write a SINGLE, precise image generation prompt.

RULES:
1. OUTPUT: ONLY the prompt string. No "Here is the prompt", no quotes, no markdown.
2. FORMAT: "[Subject Description], [Natural Lighting], [Camera/Tech Specs] --ar 16:9 --v 6.0"
3. STYLE: Documentary Photography / Street Photography / Unsplash Style
4. CONTENT ANALYSIS:
   - Focus on the INTRO paragraph and Focus Keyword ("${focusKeyword || 'General'}").
   - Identify the specific scenario, location, or emotion.
   - Visualize real-life moments, not staged or overly cinematic.
5. FORBIDDEN: No text, no faces, no posed models, no cinematic lighting.

EXAMPLE OUTPUT:
Documentary photography of insurance documents spread on a kitchen countertop with morning coffee, natural window lighting, shot on Fujifilm X100V, raw style, authentic texture, 16:9 aspect ratio --ar 16:9 --v 6.0 --no text --no face --no posed models`;

        const userPrompt = `Analyze this blog post content and create the image prompt:\n\n${truncatedContent}`;

        // Using FREE Google GenAI (Flash 2.0)
        const prompt = await callGoogleGenAI(systemPrompt, userPrompt);

        return NextResponse.json({ prompt: prompt.trim() });

    } catch (error) {
        console.error("Error generating image prompt:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
