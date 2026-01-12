import { NextResponse } from "next/server"
import { generateBlogImage } from "@/services/image"

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { prompt, keyword, imageModelId } = body

        if (!prompt && !keyword) {
            return NextResponse.json({ error: "Prompt or keyword is required" }, { status: 400 })
        }

        // Build image prompt
        const imagePrompt = prompt || `Professional blog header image about "${keyword}". Modern, clean, NYC aesthetic. No text, no faces.`

        // Use multi-model image service (defaults to DALL-E 3 HD)
        const result = await generateBlogImage({
            prompt: imagePrompt,
            imageModelId: imageModelId || 'dall-e-3-hd' // Default to High Quality DALL-E
        })

        return NextResponse.json({
            success: true,
            imageUrl: result.url,
            revisedPrompt: result.revisedPrompt,
            model: result.model,
            cost: result.cost
        })

    } catch (error: any) {
        console.error("Image Generation Error:", error)

        // Fallback to Unsplash on any error
        const fallbackUrl = `https://source.unsplash.com/1792x1024/?healthcare,professional`

        return NextResponse.json({
            success: true,
            imageUrl: fallbackUrl,
            revisedPrompt: "Fallback image",
            model: "Unsplash Fallback",
            cost: 0
        })
    }
}
