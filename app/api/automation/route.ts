
import { NextResponse } from "next/server"
import { AutomatedContentPipeline } from "@/services/automation/autoPipeline"
import { PrismaClient } from "@prisma/client"
import { publishToWordPress, uploadImageToWordPress } from "@/services/publish"
import { generateArticle } from "@/services/content"
import { generateBlogImage } from "@/services/image"

// @ts-ignore
const prisma = new PrismaClient({ log: ['error', 'warn'] })

// GET: Fetch drafts for the dashboard
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const status = searchParams.get("status") || "draft"

        const articles = await prisma.article.findMany({
            where: { status },
            orderBy: { createdAt: "desc" },
            include: { images: true }
        })

        const formatted = articles.map((a: any) => ({
            id: a.id,
            title: a.title,
            keyword: a.focusKeyword || "N/A",
            seoScore: a.estimatedScore || 0,
            createdAt: a.createdAt,
            status: a.status
        }))

        return NextResponse.json(formatted)
    } catch (error) {
        console.error("Failed to fetch articles:", error)
        return NextResponse.json({ error: "Failed to fetch articles" }, { status: 500 })
    }
}

// DELETE: Remove drafts
export async function DELETE(req: Request) {
    try {
        const body = await req.json()
        const { articleIds } = body || {}

        if (!articleIds || !Array.isArray(articleIds) || articleIds.length === 0) {
            return NextResponse.json({ error: "Missing articleIds array" }, { status: 400 })
        }

        console.log(`[API] Deleting articles (DELETE method): ${articleIds.join(', ')}`)

        await prisma.image.deleteMany({ where: { articleId: { in: articleIds } } })
        const result = await prisma.article.deleteMany({ where: { id: { in: articleIds } } })

        return NextResponse.json({ success: true, deletedCount: result.count })
    } catch (error) {
        console.error("Delete failed:", error)
        return NextResponse.json({ error: "Failed to delete" }, { status: 500 })
    }
}

// POST: Handle actions
export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { action, config, articleId, publishIds, articleIds } = body
        const userId = "cm5h3822t0000abc123456789" // Test user ID

        // 1. DELETE
        if (action === "delete") {
            const targetIds = (articleIds || (config && config.articleIds)) as string[]
            if (!targetIds || !Array.isArray(targetIds)) {
                return NextResponse.json({ error: "Invalid articleIds" }, { status: 400 })
            }

            console.log(`[API] Deleting via POST: ${targetIds.join(', ')}`)

            await prisma.image.deleteMany({ where: { articleId: { in: targetIds } } })
            const result = await prisma.article.deleteMany({ where: { id: { in: targetIds } } })

            return NextResponse.json({ success: true, deletedCount: result.count })
        }

        // 2. PUBLISH
        if (action === "publish_selected") {
            if (!publishIds || !Array.isArray(publishIds)) {
                return NextResponse.json({ error: "No IDs provided" }, { status: 400 })
            }

            const results = []
            for (const id of publishIds) {
                try {
                    const article = await prisma.article.findUnique({
                        where: { id },
                        include: { images: true }
                    })
                    if (!article) continue

                    const uploadedImages: any[] = []
                    for (const img of (article.images as any[])) {
                        try {
                            const wpImage = await uploadImageToWordPress(img.url, img.altText) as any
                            if (wpImage && wpImage.id) {
                                uploadedImages.push({ ...img, wpMediaId: wpImage.id });
                            }
                        } catch (imgErr) {
                            console.error("Image upload failed, skipping", imgErr)
                        }
                    }

                    // @ts-ignore
                    const wpPost = await publishToWordPress({
                        title: article.title,
                        content: article.content,
                        status: 'publish',
                        categories: [1],
                        featuredMediaId: uploadedImages.find((i: any) => i.type === 'featured')?.wpMediaId
                    })

                    await prisma.article.update({
                        where: { id },
                        data: {
                            status: 'published',
                            publishedAt: new Date(),
                            wpPostId: wpPost.id,
                            wpPostUrl: wpPost.link
                        }
                    })
                    results.push({ id, status: 'success', url: wpPost.link })
                } catch (e: any) {
                    console.error(`Failed to publish ${id}:`, e)
                    results.push({ id, status: 'failed', error: e.message })
                }
            }
            return NextResponse.json({ success: true, results })
        }

        // 3. REGENERATE CONTENT
        if (action === 'regenerate_content') {
            const article = await prisma.article.findUnique({ where: { id: articleId } })
            if (!article) throw new Error("Article not found")

            const persona = article.persona as any
            const newContent = await generateArticle({
                topic: article.title,
                focusKeyword: article.focusKeyword,
                persona: `직업: ${persona?.job || '블로거'}, 연령: ${persona?.age || '30대'}`,
                referenceData: ""
            }) as any

            await prisma.article.update({
                where: { id: articleId },
                data: {
                    title: newContent.title || article.title,
                    content: newContent.content,
                    wordCount: (newContent.content || "").length / 5,
                    estimatedScore: 85
                }
            })
            return NextResponse.json({ success: true })
        }

        // 4. REGENERATE IMAGE
        if (action === 'regenerate_image') {
            const article = await prisma.article.findUnique({ where: { id: articleId } })
            if (!article) throw new Error("Article not found")

            await prisma.image.deleteMany({ where: { articleId } })

            const imgRes = await generateBlogImage({
                prompt: `Featured image for blog post: ${article.title}. Minimalist, high quality.`
            })

            await prisma.image.create({
                data: {
                    articleId,
                    type: "featured",
                    url: imgRes.url,
                    altText: article.title,
                    prompt: imgRes.revisedPrompt || "Featured image",
                    position: "after_h1"
                }
            })
            return NextResponse.json({ success: true })
        }

        // 5. START PIPELINE
        if (action === "start") {
            const pipeline = new AutomatedContentPipeline({
                userId,
                articlesCount: config.targetCount || 1,
                category: config.selectedCategories?.[0],
                publishStrategy: 'draft',
                textModelId: config.textModelId,
                imageModelId: config.imageModelId,
            })

            console.log("🚀 [API] Starting background pipeline...")

            // IIFE with explicit void to prevent ASI issues
            void (async () => {
                try {
                    const results = await pipeline.run()
                    console.log("✅ [Background] Pipeline finished:", results)
                } catch (err) {
                    console.error("❌ [Background] Pipeline crashed:", err)
                }
            })()

            return NextResponse.json({
                success: true,
                message: "백그라운드에서 작업이 시작되었습니다. (약 1-2분 소요)",
            })
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 })

    } catch (error) {
        console.error("Automation API Error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
