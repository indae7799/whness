
import { PrismaClient } from "@prisma/client"
// @ts-ignore
const prisma = new PrismaClient({ log: ['error', 'warn'] })

import { DEFAULT_SEEDS } from "@/lib/research/defaultSeeds"
import { generateArticle } from "@/services/content"
import { generateBlogImage } from "@/services/image"
import { DEFAULT_TEXT_MODEL, DEFAULT_IMAGE_MODEL } from "@/lib/config/models"

import { KeywordAnalyzer } from "@/services/keyword-analyzer"

interface PipelineConfig {
    userId: string
    articlesCount?: number
    category?: string
    publishStrategy?: 'draft' | 'schedule' | 'immediate'
    scheduleInterval?: number
    textModelId?: string
    imageModelId?: string
}

export class AutomatedContentPipeline {
    private config: PipelineConfig
    private keywordAnalyzer: KeywordAnalyzer

    constructor(config: PipelineConfig) {
        this.config = config
        this.keywordAnalyzer = new KeywordAnalyzer()
    }

    async run() {
        console.log(`[AutoPipeline] Starting job for user ${this.config.userId}`)
        console.log(`[AutoPipeline] Text Model: ${this.config.textModelId || DEFAULT_TEXT_MODEL.id}`)
        console.log(`[AutoPipeline] Image Model: ${this.config.imageModelId || DEFAULT_IMAGE_MODEL.id}`)

        const results = []

        try {
            // STEP 1: Smart Keyword Selection (Hybrid: Weighted Random Seed + LLM Analysis)
            console.log(`[AutoPipeline] 1. Selecting base seed...`)

            // A. Select Base Seed
            const weightedSeeds = DEFAULT_SEEDS.flatMap(seed =>
                Array(seed.weight).fill(seed)
            )
            const baseSeed = weightedSeeds[Math.floor(Math.random() * weightedSeeds.length)]
            console.log(`[AutoPipeline] Base Seed: "${baseSeed.term}" (Category: ${baseSeed.category})`)

            // B. Analyze & Expand to "Golden Keyword" using LLM
            console.log(`[AutoPipeline] Analyzing for competitive long-tail keyword...`)
            const analysis = await this.keywordAnalyzer.analyzeKeywords(baseSeed.term)

            const selectedKeyword = {
                term: analysis.bestKeyword,
                category: baseSeed.category
            }
            console.log(`[AutoPipeline] ✨ Golden Keyword Found: "${selectedKeyword.term}"`)
            console.log(`[AutoPipeline] Reasoning: ${analysis.reasoning}`)

            // STEP 2: Create ResearchJob FIRST (to satisfy foreign key)
            const researchJob = await prisma.researchJob.create({
                data: {
                    userId: this.config.userId,
                    seeds: [selectedKeyword.term],
                    sources: ['default_seeds'],
                    persona: {
                        age: "30s",
                        job: "NYC Professional",
                        painPoints: ["Health insurance complexity", "High costs"],
                        tone: "Friendly and informative"
                    },
                    status: 'completed',
                    progress: 100,
                    completedAt: new Date()
                }
            })
            console.log(`[AutoPipeline] ResearchJob created: ${researchJob.id}`)

            // STEP 3: Generate Real AI Article (Using Fixed Prompt)
            console.log(`[AutoPipeline] Generating AI Content for: "${selectedKeyword.term}"`)

            const content = await generateArticle({
                topic: analysis.reasoning, // Use the reasoning as the detailed topic
                focusKeyword: selectedKeyword.term,
                persona: `Age: ${(researchJob.persona as any)?.age}, Job: ${(researchJob.persona as any)?.job}, Pain Points: ${(researchJob.persona as any)?.painPoints?.join(", ")}`,
                referenceData: `Category: ${selectedKeyword.category}. Focus on real experience and specific advice.`,
                textModelId: this.config.textModelId
            })

            console.log(`[AutoPipeline] Article generated: "${content.title}" (${content.estimatedWordCount} words)`)

            // STEP 4: Image Generation (After Text) - Landscape 4:3
            let imageUrl = ""
            let imagePrompt = ""

            // Extract visual context from title or H2s
            const visualContext = content.title
            const specificImagePrompt = `Cinematic 4:3 landscape photography, realistic, NYC style. Context: ${visualContext}. Professional editorial, high resolution. NO PEOPLE, NO FACES, FOCUS ON OBJECTS/SCENERY.`

            try {
                const imageRes = await generateBlogImage({
                    prompt: specificImagePrompt,
                    imageModelId: this.config.imageModelId || DEFAULT_IMAGE_MODEL.id
                })
                imageUrl = imageRes.url
                imagePrompt = imageRes.revisedPrompt || specificImagePrompt
                console.log(`[AutoPipeline] Image generated (4:3 Landscape): ${imageUrl}`)
            } catch (imgError) {
                console.error("[AutoPipeline] Image generation failed, using fallback:", imgError)
                imageUrl = `https://source.unsplash.com/1600x1200/?${encodeURIComponent(selectedKeyword.term)},nyc,city`
                imagePrompt = "Fallback image"
            }

            // STEP 5: Insert featured image at the end of Intro (before first H2)
            // HTML Image Tag for Wordpress compatibility (as per Fixed Prompt)
            let finalContent = content.content || ""
            if (imageUrl) {
                const imageHtml = `\n\n<img src="${imageUrl}" alt="${selectedKeyword.term} - ${content.title}" style="width: 100%; height: auto; border-radius: 8px; margin: 40px 0;" />\n\n`

                // Regex to find the first H2 (<h2 or ##)
                // Since Fixed Prompt outputs HTML, we look for <h2> tag, but let's support Markdown fallback
                const h2Match = finalContent.match(/<h2/) || finalContent.match(/^##\s+/m)

                if (h2Match && h2Match.index !== undefined) {
                    // Insert before the first H2
                    finalContent =
                        finalContent.slice(0, h2Match.index) +
                        imageHtml +
                        finalContent.slice(h2Match.index)
                    console.log(`[AutoPipeline] Image inserted before first H2`)
                } else {
                    // Fallback: After H1
                    const h1Match = finalContent.match(/<\/h1>/) || finalContent.match(/^(#\s+.+)$/m)
                    if (h1Match && h1Match.index !== undefined) {
                        // Insert after H1 closing
                        const insertPos = h1Match.index + h1Match[0].length
                        finalContent =
                            finalContent.slice(0, insertPos) +
                            imageHtml +
                            finalContent.slice(insertPos)
                    }
                }
            }

            // STEP 6: Save Article to DB
            const article = await prisma.article.create({
                data: {
                    userId: this.config.userId,
                    researchJobId: researchJob.id, // Use actual ResearchJob ID
                    title: content.title || "Untitled",
                    slug: content.slug || `post-${Date.now()}`,
                    content: finalContent,
                    focusKeyword: selectedKeyword.term,
                    metaTitle: content.metaTitle || "",
                    metaDesc: content.metaDesc || "",
                    wordCount: finalContent.trim().split(/\s+/).length,
                    h2Count: finalContent.match(/^## /gm)?.length || 0,
                    h3Count: finalContent.match(/^### /gm)?.length || 0,
                    keywordDensity: 1.5,
                    estimatedScore: 85,
                    status: 'draft',
                    persona: researchJob.persona as any ?? {},
                    rankMathScore: 85,
                    images: {
                        create: [{
                            type: 'featured',
                            url: imageUrl,
                            altText: selectedKeyword.term,
                            prompt: imagePrompt,
                            position: 'main'
                        }]
                    }
                }
            })

            console.log(`[AutoPipeline] ✅ Article created: ${article.id}`)
            results.push({ id: article.id, status: 'success', title: article.title })

        } catch (error) {
            console.error("[AutoPipeline] ❌ Failed:", error)
            throw error
        }

        return results
    }
}
