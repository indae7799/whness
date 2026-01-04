
import { PrismaClient } from '@prisma/client'

// @ts-ignore
const prisma = new PrismaClient({ log: ['error', 'warn'] })

async function main() {
    try {
        const article = await prisma.article.findFirst({
            orderBy: { createdAt: 'desc' },
            include: { images: true }
        })

        if (!article) {
            console.log("No articles found.")
            return
        }

        console.log("\n=== LATEST ARTICLE FOUND ===")
        console.log(`Title: ${article.title}`)
        console.log(`Keyword: ${article.focusKeyword}`)
        console.log(`Status: ${article.status}`)
        console.log(`Images: ${article.images.length}`)
        console.log("\n--- Content Snippet ---")
        console.log(article.content.substring(0, 300) + "...")
        console.log("\n--- End of Snippet ---")

    } catch (e) {
        console.error(e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
