// Multi-model image generation service
// Supports: Unsplash (free), DALL-E 2, DALL-E 3 Standard/HD

import { IMAGE_MODELS, getImageModelById, DEFAULT_IMAGE_MODEL, type ImageModel } from "@/lib/config/models"

interface GenerateImageParams {
    prompt: string
    imageModelId?: string
}

interface GeneratedImage {
    url: string
    revisedPrompt: string
    model: string
    cost: number
}

export async function generateBlogImage({ prompt, imageModelId }: GenerateImageParams): Promise<GeneratedImage> {
    const model = imageModelId
        ? getImageModelById(imageModelId) || DEFAULT_IMAGE_MODEL
        : DEFAULT_IMAGE_MODEL

    console.log(`[Image] Using model: ${model.name} (${model.tier})`)

    switch (model.id) {
        case 'unsplash':
            return generateWithUnsplash(prompt, model)
        case 'pixabay':
            return generateWithPixabay(prompt, model)
        case 'dall-e-2':
            return generateWithDallE2(prompt, model)
        case 'dall-e-3-standard':
            return generateWithDallE3(prompt, model, 'standard')
        case 'dall-e-3-hd':
            return generateWithDallE3(prompt, model, 'hd')
        default:
            return generateWithUnsplash(prompt, model)
    }
}

// Pollinations.ai - FREE generative AI (Excellent alternative to Unsplash)
async function generateWithUnsplash(prompt: string, model: ImageModel): Promise<GeneratedImage> {
    try {
        const keywords = extractKeywords(prompt)
        const simplifiedPrompt = keywords.join(" ")

        // Pollinations.ai URL
        // Simple, free, no API key needed
        const encodedPrompt = encodeURIComponent(`high quality realistic photo of ${simplifiedPrompt}, nyc aesthetic, professional photography`)
        const finalUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1792&height=1024&nologo=true`

        console.log(`[Image] Pollinations.ai generation: "${simplifiedPrompt}" → OK`)

        return {
            url: finalUrl,
            revisedPrompt: `Pollinations: ${simplifiedPrompt}`,
            model: "pollinations-ai",
            cost: 0
        }
    } catch (error) {
        console.error("Pollinations error:", error)
        // Ultimate fallback
        return {
            url: `https://picsum.photos/1792/1024`,
            revisedPrompt: "Fallback random image",
            model: "picsum",
            cost: 0
        }
    }
}

// Pixabay - Alias to Unsplash/Pollinations for now
async function generateWithPixabay(prompt: string, model: ImageModel): Promise<GeneratedImage> {
    return generateWithUnsplash(prompt, model)
}

// DALL-E 2 - Budget AI generation
async function generateWithDallE2(prompt: string, model: ImageModel): Promise<GeneratedImage> {
    const apiKey = process.env.OPENAI_API_KEY

    if (!apiKey) {
        console.warn("OPENAI_API_KEY not set, falling back to Unsplash")
        return generateWithUnsplash(prompt, DEFAULT_IMAGE_MODEL)
    }

    try {
        const response = await fetch("https://api.openai.com/v1/images/generations", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: "dall-e-2",
                prompt: `Professional photo, NYC aesthetic: ${prompt}`,
                n: 1,
                size: "1024x1024", // DALL-E 2 max size
            })
        })

        if (!response.ok) {
            const error = await response.text()
            console.error("DALL-E 2 error:", error)
            return generateWithUnsplash(prompt, DEFAULT_IMAGE_MODEL)
        }

        const data = await response.json()

        return {
            url: data.data[0].url,
            revisedPrompt: prompt,
            model: model.name,
            cost: model.costPerImage
        }
    } catch (error) {
        console.error("DALL-E 2 error:", error)
        return generateWithUnsplash(prompt, DEFAULT_IMAGE_MODEL)
    }
}

// DALL-E 3 - High quality AI generation
async function generateWithDallE3(prompt: string, model: ImageModel, quality: 'standard' | 'hd'): Promise<GeneratedImage> {
    const apiKey = process.env.OPENAI_API_KEY

    if (!apiKey) {
        console.warn("OPENAI_API_KEY not set, falling back to Unsplash")
        return generateWithUnsplash(prompt, DEFAULT_IMAGE_MODEL)
    }

    try {
        const response = await fetch("https://api.openai.com/v1/images/generations", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: "dall-e-3",
                prompt: `Professional corporate photography, NYC aesthetic, high quality, realistic. ${prompt} --no text --no words`,
                n: 1,
                size: "1792x1024",
                quality: quality,
                style: "natural",
            })
        })

        if (!response.ok) {
            const error = await response.text()
            console.error("DALL-E 3 error:", error)
            return generateWithUnsplash(prompt, DEFAULT_IMAGE_MODEL)
        }

        const data = await response.json()

        return {
            url: data.data[0].url,
            revisedPrompt: data.data[0].revised_prompt || prompt,
            model: model.name,
            cost: model.costPerImage
        }
    } catch (error) {
        console.error("DALL-E 3 error:", error)
        return generateWithUnsplash(prompt, DEFAULT_IMAGE_MODEL)
    }
}

// Extract keywords from prompt for Unsplash search
function extractKeywords(prompt: string): string[] {
    const stopWords = new Set([
        'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
        'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through',
        'professional', 'style', 'high', 'quality', 'realistic', 'no',
        'text', 'words', 'corporate', 'aesthetic', 'photography', 'new', 'york'
    ])

    const words = prompt.toLowerCase()
        .replace(/[^a-z\s]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 2 && !stopWords.has(word))

    const uniqueWords = [...new Set(words)]

    // Prioritize relevant terms
    const priorityTerms = uniqueWords.filter(w =>
        ['medicare', 'health', 'insurance', 'medical', 'hospital', 'doctor',
            'care', 'patient', 'wellness', 'office', 'business'].includes(w)
    )

    const otherTerms = uniqueWords.filter(w => !priorityTerms.includes(w))
    const result = [...priorityTerms, ...otherTerms].slice(0, 4)

    return result.length > 0 ? result : ['healthcare', 'professional']
}

// Export available models for UI
export { IMAGE_MODELS, DEFAULT_IMAGE_MODEL }
