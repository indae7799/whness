
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

        const systemPrompt = `You are an expert AI Art Director for high-end editorial magazines. 
Your task is to read a blog post and write a SINGLE, precise, high-quality image generation prompt for ComfyUI/Midjourney (v 6.0).

RULES:
1. OUTPUT: ONLY the prompt string. No "Here is the prompt", no quotes, no markdown.
2. FORMAT: "[Subject Description], [Atmosphere/Mood], [Lighting], [Camera/Tech Specs] --ar 16:9 --v 6.0"
3. STYLE: New York Editorial Photography, Cinematic, Highly Detailed, 8k.
4. CONTENT ANALYSIS:
   - Identify the specific scenario, location, or emotion in the Introduction.
   - If the text mentions "sitting at a kitchen table at 2am", visualize that.
   - If it mentions "opening a letter in the rain", visualize that.
   - If no specific scene is found, create a metaphorical scene related to the Focus Keyword ("${focusKeyword || 'General'}").

EXAMPLE OUTPUT:
Editorial photography of a stressed woman sitting at a messy kitchen table at night looking at insurance papers, dim warm lighting, cinematic atmosphere, authentic emotion, shot on Sony A7R IV, 8k resolution, highly detailed, 16:9 aspect ratio --ar 16:9 --v 6.0`;

        const userPrompt = `Analyze this blog post content and create the image prompt:\n\n${truncatedContent}`;

        // Using FREE Google GenAI (Flash 2.0)
        const prompt = await callGoogleGenAI(systemPrompt, userPrompt);

        return NextResponse.json({ prompt: prompt.trim() });

    } catch (error) {
        console.error("Error generating image prompt:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
