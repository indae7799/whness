import { NextResponse } from "next/server";

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    console.log("[API] Starting WordPress Auto-Publish with Rank Math SEO...");

    try {
        // Check content type to determine how to parse request
        const contentType = req.headers.get("content-type") || "";

        let htmlContent: string;
        let featuredMediaId: number | null = null;
        let featuredMediaUrl: string | null = null;
        let bodyMediaUrl: string | null = null;
        let clientFocusKeyword = ""; // NEW: From client (thumbnail title)

        if (contentType.includes("application/json")) {
            // NEW: JSON payload (images already uploaded separately)
            const jsonData = await req.json();
            htmlContent = jsonData.htmlContent;
            featuredMediaId = jsonData.featuredMediaId || null;
            featuredMediaUrl = jsonData.featuredMediaUrl || null;
            bodyMediaUrl = jsonData.bodyMediaUrl || null;
            clientFocusKeyword = jsonData.focusKeyword || ""; // Capture thumbnail title

            console.log("[API] Received JSON payload, focusKeyword:", clientFocusKeyword);
        } else {
            // LEGACY: FormData with embedded images (may hit size limits)
            const formData = await req.formData();
            htmlContent = formData.get("htmlContent") as string;
            const featuredImageFile = formData.get("featuredImage") as File;
            const bodyImageFile = formData.get("bodyImage") as File;

            // Get WordPress credentials
            const wpUrl = process.env.WORDPRESS_URL || process.env.WP_BASE_URL;
            const wpUser = process.env.WORDPRESS_USERNAME || process.env.WP_USERNAME;
            const wpPass = process.env.WORDPRESS_APP_PASSWORD || process.env.WP_APP_PASSWORD;

            if (!wpUrl || !wpUser || !wpPass) {
                return NextResponse.json({ error: "WP Credentials Missing" }, { status: 500 });
            }

            const authHeader = `Basic ${Buffer.from(`${wpUser}:${wpPass}`).toString("base64")}`;

            // Upload images inline (legacy support)
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

            if (featuredMedia) {
                featuredMediaId = featuredMedia.id;
                featuredMediaUrl = featuredMedia.source_url;
            }
            if (bodyMedia) {
                bodyMediaUrl = bodyMedia.source_url;
            }

            console.log("[API] Received FormData with embedded images");
        }

        if (!htmlContent) {
            return NextResponse.json({ error: "Missing HTML content" }, { status: 400 });
        }

        // Get WordPress credentials
        const wpUrl = process.env.WORDPRESS_URL || process.env.WP_BASE_URL;
        const wpUser = process.env.WORDPRESS_USERNAME || process.env.WP_USERNAME;
        const wpPass = process.env.WORDPRESS_APP_PASSWORD || process.env.WP_APP_PASSWORD;

        if (!wpUrl || !wpUser || !wpPass) {
            return NextResponse.json({ error: "WP Credentials Missing" }, { status: 500 });
        }

        const authHeader = `Basic ${Buffer.from(`${wpUser}:${wpPass}`).toString("base64")}`;

        // SEO Extraction - Prioritize client-provided focusKeyword (thumbnail title)
        let focusKeyword = "";
        let metaDesc = "";

        // 1. PRIORITY: Use client-provided focusKeyword (thumbnail title)
        if (clientFocusKeyword) {
            focusKeyword = clientFocusKeyword;
            console.log("[API] Using client-provided focusKeyword:", focusKeyword);
        } else {
            // 2. Fallback: Try to extract from HTML content
            const kwMatch = htmlContent.match(/FOCUS\s*KEYWORD[:\s]+([^\r\n<]+)/i);
            if (kwMatch) {
                focusKeyword = kwMatch[1].replace(/['"]/g, '').trim();
            }
        }

        // Extract meta description from HTML
        const descMatch = htmlContent.match(/META\s*DESCRIPTION[:\s]+([^\r\n<]+)/i);
        if (descMatch) {
            metaDesc = descMatch[1].replace(/['"]/g, '').trim();
        }

        // IMPORTANT: If meta description doesn't contain focus keyword, append it
        if (focusKeyword && metaDesc && !metaDesc.toLowerCase().includes(focusKeyword.toLowerCase())) {
            // Construct a new meta description that includes the focus keyword
            metaDesc = `${focusKeyword}: ${metaDesc}`;
            if (metaDesc.length > 160) {
                metaDesc = metaDesc.substring(0, 157) + "...";
            }
        }

        // If no meta description at all, create one with focus keyword
        if (!metaDesc && focusKeyword) {
            metaDesc = `Complete guide to ${focusKeyword}. Expert tips, step-by-step instructions, and everything you need to know.`;
        }

        console.log("[API] Extracted SEO Data:", { focusKeyword, metaDesc });

        // Clean Artifacts
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

        // Style Injections (ONLY for unstyled tags)
        finalContent = finalContent.replace(/<a(?![^>]*style=)([^>]*)>/gi, '<a style="color: #003366; font-weight: 700; text-decoration: underline;"$1>');
        finalContent = finalContent.replace(/<p>(?![^>]*style=)/gi, '<p style="font-size: 18px; line-height: 1.8; margin-bottom: 28px; color: #232323; font-family: Cambria, Georgia, serif;">');

        // Parse Title & H1
        let title = "Blog Post " + Date.now();
        const h1Match = finalContent.match(/<h1[^>]*>(.*?)<\/h1>/i);
        if (h1Match) {
            title = h1Match[1].replace(/<[^>]*>/g, "");
            if (!h1Match[0].includes('style=')) {
                const styledH1 = h1Match[0].replace("<h1", '<h1 style="margin-top: 60px; margin-bottom: 30px; font-family: Georgia, serif; font-size: 38px; color: #111;"');
                finalContent = finalContent.replace(h1Match[0], styledH1);
            }
        }

        // Body Image Injection
        if (bodyMediaUrl) {
            const imgHtml = `
                <figure class="wp-block-image size-full" style="margin: 40px 0;">
                    <img src="${bodyMediaUrl}" alt="${focusKeyword || title}" style="width:100%; border-radius:12px;" />
                </figure>
            `;

            if (finalContent.includes("[INSERT_IMAGE_HERE]")) {
                finalContent = finalContent.replace("[INSERT_IMAGE_HERE]", imgHtml);
            } else {
                const firstP = finalContent.indexOf("</p>");
                if (firstP !== -1) {
                    finalContent = finalContent.slice(0, firstP + 4) + imgHtml + finalContent.slice(firstP + 4);
                } else {
                    finalContent = imgHtml + finalContent;
                }
            }
        }

        // Remove ALL remaining image placeholders
        finalContent = finalContent.replace(/\[INSERT_IMAGE_HERE\]/gi, "");
        finalContent = finalContent.replace(/\[INSERT IMAGE HERE\]/gi, "");
        finalContent = finalContent.replace(/INSERT_IMAGE_HERE/gi, "");
        finalContent = finalContent.replace(/\[Image:.*?\]/gi, "");

        // Publish to WordPress with Rank Math Meta
        console.log("[API] Sending to WP with SEO:", { focusKeyword, metaDesc, title });

        const postData = {
            title: title,
            content: finalContent,
            status: 'publish',
            featured_media: featuredMediaId || 0,
            categories: [1],
            template: 'elementor_canvas',
            meta: {
                rank_math_focus_keyword: focusKeyword,
                rank_math_description: metaDesc,
                _rank_math_focus_keyword: focusKeyword,
                _rank_math_description: metaDesc,
                rank_math_seo_score: 80,
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
