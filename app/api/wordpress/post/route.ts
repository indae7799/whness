import { NextResponse } from "next/server";

export async function POST(req: Request) {
    console.log("[API] Starting WordPress Auto-Publish...");

    try {
        const formData = await req.formData();
        const htmlContent = formData.get("htmlContent") as string;

        // Revised Inputs: Distinct Featured vs Body images
        const featuredImageFile = formData.get("featuredImage") as File;
        const bodyImageFile = formData.get("bodyImage") as File;

        // Fallback for backward compatibility
        const legacyImageFile = formData.get("imageFile") as File;

        // Decide which files to use
        const finalFeatured = featuredImageFile || legacyImageFile;
        const finalBody = bodyImageFile || legacyImageFile;

        if (!htmlContent) {
            return NextResponse.json({ error: "Missing HTML content" }, { status: 400 });
        }

        // 1. Credentials Check
        const wpUrl = process.env.WORDPRESS_URL || process.env.WP_BASE_URL;
        const wpUser = process.env.WORDPRESS_USERNAME || process.env.WP_USERNAME;
        const wpPass = process.env.WORDPRESS_APP_PASSWORD || process.env.WP_APP_PASSWORD;

        if (!wpUrl || !wpUser || !wpPass) {
            console.error("Missing WP Credentials in .env");
            return NextResponse.json({ error: "Server Configuration Error: WP Credentials Missing" }, { status: 500 });
        }

        const authHeader = `Basic ${Buffer.from(`${wpUser}:${wpPass}`).toString("base64")}`;

        // Helper to upload image
        const uploadImage = async (file: File) => {
            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const res = await fetch(`${wpUrl}/wp-json/wp/v2/media`, {
                method: "POST",
                headers: {
                    "Authorization": authHeader,
                    "Content-Disposition": `attachment; filename="${file.name}"`,
                    "Content-Type": file.type,
                },
                body: buffer
            });
            if (!res.ok) throw new Error(`Upload Failed: ${res.status}`);
            return await res.json();
        };

        // 2. Upload Images
        let featuredMediaId = 0;
        let bodyImageUrl = "";

        if (finalFeatured) {
            console.log("[API] Uploading Featured Image...");
            const mediaData = await uploadImage(finalFeatured);
            featuredMediaId = mediaData.id;
        }

        if (finalBody) {
            console.log("[API] Uploading Body Image...");
            const mediaData = await uploadImage(finalBody);
            bodyImageUrl = mediaData.source_url;
        }

        // 3. Clean Content - Remove META info and Artifacts
        let finalContent = htmlContent;

        // Remove META info
        finalContent = finalContent.replace(/META TITLE[^<\n]*/gi, "");
        finalContent = finalContent.replace(/META DESCRIPTION[^<\n]*/gi, "");
        finalContent = finalContent.replace(/FOCUS KEYWORD[^<\n]*/gi, "");
        finalContent = finalContent.replace(/URL SLUG[^<\n]*/gi, "");

        // Remove image prompt comments
        finalContent = finalContent.replace(/<!--\s*\[IMAGE_PROMPT_START\][\s\S]*?\[IMAGE_PROMPT_END\]\s*-->/g, "");

        // Remove Markdown artifacts ('''html, ''', ```html, ```)
        finalContent = finalContent.replace(/^```html\s*/i, "").replace(/^```\s*/, "").replace(/```$/, "");
        finalContent = finalContent.replace(/^'''html\s*/i, "").replace(/^'''\s*/, "").replace(/'''$/, "");

        // Remove leading/trailing whitespace and dots
        finalContent = finalContent.replace(/^\s*\.\.\.\s*/gm, "");
        finalContent = finalContent.trim();

        // 4. Parse Title from H1
        let title = "Untitled Blog Post";
        const h1Match = finalContent.match(/<h1[^>]*>(.*?)<\/h1>/i);
        if (h1Match && h1Match[1]) {
            title = h1Match[1].replace(/<[^>]*>/g, "");
        }

        // 5. Enhance H1 Style (Margin + Font Family)
        if (h1Match) {
            // Add margin and force Cambria/Georgia font to match H2
            const newH1 = h1Match[0].replace(
                "<h1",
                '<h1 style="margin-top: 60px; font-family: Cambria, Georgia, serif; font-weight: 700; line-height: 1.2;"'
            );
            finalContent = finalContent.replace(h1Match[0], newH1);
        }

        // 6. Inject Body Image
        if (bodyImageUrl) {
            const imageHtml = `
                <figure class="wp-block-image size-full" style="margin-top: 32px; margin-bottom: 32px;">
                    <img src="${bodyImageUrl}" alt="${title}" style="width:100%; height:auto; border-radius:8px;" />
                </figure>
            `;

            // Strategy: Try to put it after the intro paragraph
            const introEndMatch = finalContent.match(/<\/h1>[\s\S]*?<\/p>/i);

            if (introEndMatch) {
                const insertPosition = finalContent.indexOf(introEndMatch[0]) + introEndMatch[0].length;
                finalContent = finalContent.slice(0, insertPosition) + imageHtml + finalContent.slice(insertPosition);
            } else if (finalContent.includes("[INSERT_IMAGE_HERE]")) {
                // If no intro paragraph found but placeholder exists, use placeholder
                finalContent = finalContent.replace("[INSERT_IMAGE_HERE]", imageHtml);
            } else {
                // Fallback: after first paragraph tag ending
                const firstPEnd = finalContent.indexOf("</p>");
                if (firstPEnd !== -1) {
                    finalContent = finalContent.slice(0, firstPEnd + 4) + imageHtml + finalContent.slice(firstPEnd + 4);
                }
            }
        }

        // ALWAYS remove the placeholder tag if it remains (e.g. if we used intro-matching instead)
        finalContent = finalContent.replace("[INSERT_IMAGE_HERE]", "");

        // 7. Get blog category ID
        let blogCategoryId = 1; // Default to uncategorized
        try {
            const catRes = await fetch(`${wpUrl}/wp-json/wp/v2/categories?slug=blog`, {
                headers: { "Authorization": authHeader }
            });
            if (catRes.ok) {
                const categories = await catRes.json();
                if (categories.length > 0) {
                    blogCategoryId = categories[0].id;
                }
            }
        } catch (e) {
            console.log("[API] Could not fetch blog category, using default");
        }

        // 8. Create Post with category and template
        console.log("[API] Creating Post...");
        const postData = {
            title: title,
            content: finalContent,
            status: 'publish',
            featured_media: featuredMediaId,
            categories: [blogCategoryId],
            template: 'elementor_canvas'
        };

        const postRes = await fetch(`${wpUrl}/wp-json/wp/v2/posts`, {
            method: "POST",
            headers: { "Authorization": authHeader, "Content-Type": "application/json" },
            body: JSON.stringify(postData)
        });

        if (!postRes.ok) {
            const err = await postRes.text();
            console.error("[API] Post Creation Failed:", err);
            return NextResponse.json({ error: `Post Creation Failed: ${postRes.status}` }, { status: 500 });
        }

        const newPost = await postRes.json();
        console.log("[API] Post Published! Link:", newPost.link);

        return NextResponse.json({
            success: true,
            link: newPost.link,
            title: newPost.title.rendered
        });

    } catch (error) {
        console.error("[API] Auto-Publish Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
