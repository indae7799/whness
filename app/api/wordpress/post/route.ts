import { NextResponse } from "next/server";

export async function POST(req: Request) {
    console.log("[API] Starting WordPress Auto-Publish with Rank Math SEO...");

    try {
        const formData = await req.formData();
        const htmlContent = formData.get("htmlContent") as string;
        const featuredImageFile = formData.get("featuredImage") as File;
        const bodyImageFile = formData.get("bodyImage") as File;

        if (!htmlContent) {
            return NextResponse.json({ error: "Missing HTML content" }, { status: 400 });
        }

        // 1. Credentials Check
        const wpUrl = process.env.WORDPRESS_URL || process.env.WP_BASE_URL;
        const wpUser = process.env.WORDPRESS_USERNAME || process.env.WP_USERNAME;
        const wpPass = process.env.WORDPRESS_APP_PASSWORD || process.env.WP_APP_PASSWORD;

        if (!wpUrl || !wpUser || !wpPass) {
            return NextResponse.json({ error: "WP Credentials Missing" }, { status: 500 });
        }

        const authHeader = `Basic ${Buffer.from(`${wpUser}:${wpPass}`).toString("base64")}`;

        // 2. Upload Images
        const uploadImage = async (file: File) => {
            if (!file || file.size === 0) return null;
            const res = await fetch(`${wpUrl}/wp-json/wp/v2/media`, {
                method: "POST",
                headers: {
                    "Authorization": authHeader,
                    "Content-Disposition": `attachment; filename="${file.name}"`,
                    "Content-Type": file.type || "image/png",
                },
                body: Buffer.from(await file.arrayBuffer())
            });
            if (!res.ok) return null;
            return await res.json();
        };

        const featuredMedia = await uploadImage(featuredImageFile);
        const bodyMedia = await uploadImage(bodyImageFile);

        // 3. SEO Extraction FIRST (Before any cleaning!)
        let focusKeyword = "";
        let metaDesc = "";

        // Try multiple formats for focus keyword
        const kwMatch = htmlContent.match(/FOCUS\s*KEYWORD[:\s]+([^\r\n<]+)/i);
        if (kwMatch) {
            focusKeyword = kwMatch[1].replace(/['"]/g, '').trim();
        }

        // Try multiple formats for meta description  
        const descMatch = htmlContent.match(/META\s*DESCRIPTION[:\s]+([^\r\n<]+)/i);
        if (descMatch) {
            metaDesc = descMatch[1].replace(/['"]/g, '').trim();
        }

        console.log("[API] Extracted SEO Data:", { focusKeyword, metaDesc });

        // 4. THEN Clean Artifacts (after extraction)
        let finalContent = htmlContent;
        finalContent = finalContent.replace(/<!--[\s\S]*?META TITLE[\s\S]*?-->/gi, "");
        finalContent = finalContent.replace(/^META TITLE:.*$/gim, "");
        finalContent = finalContent.replace(/^META DESCRIPTION:.*$/gim, "");
        finalContent = finalContent.replace(/^FOCUS KEYWORD:.*$/gim, "");
        finalContent = finalContent.replace(/^URL SLUG:.*$/gim, "");
        finalContent = finalContent.replace(/```html/gi, "").replace(/```/g, "");
        finalContent = finalContent.replace(/'''html/gi, "").replace(/'''/g, "");
        finalContent = finalContent.replace(/<!--\s*\[IMAGE_PROMPT_START\][\s\S]*?\[IMAGE_PROMPT_END\]\s*-->/g, "");
        finalContent = finalContent.trim();

        // 4. Style Injections (ONLY for unstyled tags - preserve Gemini's original styling)
        // Only add styles to <a> and <p> tags that DON'T already have style attributes
        finalContent = finalContent.replace(/<a(?![^>]*style=)([^>]*)>/gi, '<a style="color: #003366; font-weight: 700; text-decoration: underline;"$1>');
        finalContent = finalContent.replace(/<p>(?![^>]*style=)/gi, '<p style="font-size: 18px; line-height: 1.8; margin-bottom: 28px; color: #232323; font-family: Cambria, Georgia, serif;">');

        // Parse Title & H1 (only add style if not already present)
        let title = "Blog Post " + Date.now();
        const h1Match = finalContent.match(/<h1[^>]*>(.*?)<\/h1>/i);
        if (h1Match) {
            title = h1Match[1].replace(/<[^>]*>/g, "");
            // Only add style if H1 doesn't already have style
            if (!h1Match[0].includes('style=')) {
                const styledH1 = h1Match[0].replace("<h1", '<h1 style="margin-top: 60px; margin-bottom: 30px; font-family: Georgia, serif; font-size: 38px; color: #111;"');
                finalContent = finalContent.replace(h1Match[0], styledH1);
            }
        }

        // Body Image Injection (Replace placeholder OR insert after first paragraph)
        if (bodyMedia?.source_url) {
            const imgHtml = `
                <figure class="wp-block-image size-full" style="margin: 40px 0;">
                    <img src="${bodyMedia.source_url}" alt="${focusKeyword || title}" style="width:100%; border-radius:12px;" />
                </figure>
            `;

            // Primary: Replace [INSERT_IMAGE_HERE] placeholder (first occurrence)
            if (finalContent.includes("[INSERT_IMAGE_HERE]")) {
                finalContent = finalContent.replace("[INSERT_IMAGE_HERE]", imgHtml);
            } else {
                // Fallback: Insert after first paragraph
                const firstP = finalContent.indexOf("</p>");
                if (firstP !== -1) {
                    finalContent = finalContent.slice(0, firstP + 4) + imgHtml + finalContent.slice(firstP + 4);
                } else {
                    finalContent = imgHtml + finalContent;
                }
            }
        }

        // ALWAYS remove ALL remaining image placeholders (any format)
        finalContent = finalContent.replace(/\[INSERT_IMAGE_HERE\]/gi, "");
        finalContent = finalContent.replace(/\[INSERT IMAGE HERE\]/gi, "");
        finalContent = finalContent.replace(/INSERT_IMAGE_HERE/gi, "");
        finalContent = finalContent.replace(/\[Image:.*?\]/gi, "");

        // 5. Publish to WordPress with Rank Math Meta
        console.log("[API] Sending to WP with SEO:", { focusKeyword, metaDesc, title });

        const postData = {
            title: title,
            content: finalContent,
            status: 'publish',
            featured_media: featuredMedia?.id || 0,
            categories: [1],
            template: 'elementor_canvas',
            meta: {
                // Rank Math (all known formats)
                rank_math_focus_keyword: focusKeyword,
                rank_math_description: metaDesc,
                _rank_math_focus_keyword: focusKeyword,
                _rank_math_description: metaDesc,
                rank_math_seo_score: 80,
                // Yoast SEO (for compatibility)
                _yoast_wpseo_focuskw: focusKeyword,
                _yoast_wpseo_metadesc: metaDesc,
            }
        };

        const postRes = await fetch(`${wpUrl}/wp-json/wp/v2/posts`, {
            method: "POST",
            headers: { "Authorization": authHeader, "Content-Type": "application/json" },
            body: JSON.stringify(postData)
        });

        if (!postRes.ok) {
            const errorText = await postRes.text();
            console.error("[API] WP Publish Error:", errorText);
            throw new Error(`WP Final Publish Failed: ${postRes.status}`);
        }

        const result = await postRes.json();
        console.log("[API] Published successfully:", result.link);
        return NextResponse.json({ success: true, link: result.link });

    } catch (err: any) {
        console.error(err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
