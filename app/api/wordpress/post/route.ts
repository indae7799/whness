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

        // -- EXTRACT SEO DATA BEFORE CLEANING --
        let focusKeyword = "";
        let metaDescription = "";

        const keywordMatch = finalContent.match(/FOCUS KEYWORD:\s*(.*)/i);
        if (keywordMatch && keywordMatch[1]) {
            focusKeyword = keywordMatch[1].trim();
        }

        const metaDescMatch = finalContent.match(/META DESCRIPTION:\s*(.*)/i);
        if (metaDescMatch && metaDescMatch[1]) {
            metaDescription = metaDescMatch[1].trim();
        }
        // --------------------------------------

        // Remove META info (Aggressive Cleaning)
        // 1. Remove entire HTML comment blocks containing META TITLE (e.g. <!-- META TITLE... -->)
        finalContent = finalContent.replace(/<!--[\s\S]*?META TITLE[\s\S]*?-->/gi, "");

        // 2. Remove specific lines if they leaked out of comments
        finalContent = finalContent.replace(/^META TITLE:.*$/gim, "");
        finalContent = finalContent.replace(/^META DESCRIPTION:.*$/gim, "");
        finalContent = finalContent.replace(/^FOCUS KEYWORD:.*$/gim, "");
        finalContent = finalContent.replace(/^URL SLUG:.*$/gim, "");

        // Remove image prompt comments
        finalContent = finalContent.replace(/<!--\s*\[IMAGE_PROMPT_START\][\s\S]*?\[IMAGE_PROMPT_END\]\s*-->/g, "");

        // Remove Markdown artifacts globally (start, end, middle)
        finalContent = finalContent.replace(/```html/gi, "").replace(/```/g, "");
        finalContent = finalContent.replace(/'''html/gi, "").replace(/'''/g, "");

        // Remove leading/trailing whitespace and dots
        finalContent = finalContent.replace(/^\s*\.\.\.\s*/gm, "");
        finalContent = finalContent.trim();

        // 4. Style Injection (Force formatting)

        // Links: Navy Blue (#003366), Bold, No Underline
        finalContent = finalContent.replace(
            /<a /gi,
            '<a style="color: #003366; font-weight: 700; text-decoration: underline;" '
        );

        // Paragraphs: Font size 18px, Line height 1.8, Margin bottom 28px (Natural reading flow)
        finalContent = finalContent.replace(
            /<p>/gi,
            '<p style="font-size: 18px; line-height: 1.8; margin-bottom: 28px; color: #333;">'
        );

        // Bold tags: Ensure they are readable
        // Optional: If you want bold tags to be a specific color, add it here.

        // 5. Parse Title & Style H1
        let title = "Untitled Blog Post";
        const h1Match = finalContent.match(/<h1[^>]*>(.*?)<\/h1>/i);

        if (h1Match) {
            if (h1Match[1]) {
                title = h1Match[1].replace(/<[^>]*>/g, "");
            }
            // Add margin and force Cambria/Georgia font to match H2
            const newH1 = h1Match[0].replace(
                "<h1",
                '<h1 style="margin-top: 60px; margin-bottom: 30px; font-family: Cambria, Georgia, serif; font-weight: 700; line-height: 1.2; font-size: 36px; color: #1a1a1a;"'
            );
            finalContent = finalContent.replace(h1Match[0], newH1);
        }

        // 6. Inject Body Image
        if (bodyImageUrl) {
            const imageAlt = focusKeyword || title; // Use keyword for ALT if available
            const imageHtml = `
                <figure class="wp-block-image size-full" style="margin-top: 32px; margin-bottom: 32px;">
                    <img src="${bodyImageUrl}" alt="${imageAlt}" style="width:100%; height:auto; border-radius:8px;" />
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

        // 8. Create Post with Rank Math Meta
        console.log("[API] Creating Post with Rank Math SEO...");

        const postMeta: any = {};
        if (focusKeyword) postMeta.rank_math_focus_keyword = focusKeyword;
        if (metaDescription) postMeta.rank_math_description = metaDescription;

        const postData = {
            title: title,
            content: finalContent,
            status: 'publish',
            featured_media: featuredMediaId,
            categories: [blogCategoryId],
            template: 'elementor_canvas',
            meta: postMeta // Send Rank Math Data
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
