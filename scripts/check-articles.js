const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkLatestArticle() {
    try {
        const article = await prisma.article.findFirst({
            orderBy: { createdAt: 'desc' },
            include: { images: true }
        });

        if (article) {
            console.log("=== Latest Article ===");
            console.log("Title:", article.title);
            console.log("Keyword:", article.focusKeyword);
            console.log("Word Count:", article.wordCount);
            console.log("Content Preview (First 500 chars):");
            console.log(article.content.substring(0, 500));
            console.log("\nRe-checking image placement in content:");

            const h1Match = article.content.match(/^# .+/m);
            const h2Match = article.content.match(/^## .+/m);
            const imgMatch = article.content.match(/!\[.*\]\(.*\)/);

            if (imgMatch) {
                console.log("Image tag found:", imgMatch[0]);
                console.log("Image Index:", imgMatch.index);
                console.log("H1 Index:", h1Match ? h1Match.index : "Not found");
                console.log("First H2 Index:", h2Match ? h2Match.index : "Not found");

                if (h2Match && imgMatch.index < h2Match.index && imgMatch.index > (h1Match ? h1Match.index + h1Match[0].length : 0)) {
                    console.log("✅ Image is positioned between H1 and first H2 (Intro area).");
                } else {
                    console.log("❌ Image position seems wrong.");
                }
            } else {
                console.log("❌ No image tag found in content.");
            }

        } else {
            console.log("No articles found.");
        }
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

checkLatestArticle();
