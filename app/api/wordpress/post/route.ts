import { NextResponse } from "next/server";
import { marked } from "marked";

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export const config = {
    api: {
        bodyParser: {
            sizeLimit: '50mb',
        },
    },
};

export async function POST(req: Request) {
    console.log("[API] Starting WordPress Auto-Publish with Rank Math SEO...");

    try {
        const contentType = req.headers.get("content-type") || "";

        let rawContent: string;
        let featuredMediaId: number | null = null;
        let featuredMediaUrl: string | null = null;
        let bodyMediaUrl: string | null = null;
        let clientFocusKeyword = "";

        // 1. Parse Request
        if (contentType.includes("application/json")) {
            const jsonData = await req.json();
            rawContent = jsonData.htmlContent || "";
            featuredMediaId = jsonData.featuredMediaId || null;
            featuredMediaUrl = jsonData.featuredMediaUrl || null;
            bodyMediaUrl = jsonData.bodyMediaUrl || null;
            clientFocusKeyword = jsonData.focusKeyword || "";
        } else {
            // Legacy FormData support
            const formData = await req.formData();
            rawContent = formData.get("htmlContent") as string || "";
            // ... (Image upload logic omitted for brevity, assuming existing flow uses JSON mainly now)
            // But if needed, we assume images are handled upstream or via separated calls for reliability.
            return NextResponse.json({ error: "Please use JSON format with separate image uploads." }, { status: 400 });
        }

        if (!rawContent) {
            return NextResponse.json({ error: "Missing content" }, { status: 400 });
        }

        // 2. Extract & Clean Metadata (Before Markdown Conversion)
        let focusKeyword = clientFocusKeyword;
        let metaDesc = "";
        let metaTitle = "";

        // Extract META BLOCK from top of text (Robust Regex)
        // Handles: "META TITLE:", "**META TITLE**:", "## META TITLE:", etc.
        const metaTitleMatch = rawContent.match(/(?:^|\n)(?:\*\*|#\s*)?META\s*TITLE(?:\*\*|#)?\s*:?\s*(.*)/i);
        const metaDescMatch = rawContent.match(/(?:^|\n)(?:\*\*|#\s*)?META\s*DESCRIPTION(?:\*\*|#)?\s*:?\s*(.*)/i);
        const focusKwMatch = rawContent.match(/(?:^|\n)(?:\*\*|#\s*)?FOCUS\s*KEYWORD(?:\*\*|#)?\s*:?\s*(.*)/i);

        if (metaTitleMatch) metaTitle = metaTitleMatch[1].trim();
        if (metaDescMatch) metaDesc = metaDescMatch[1].trim();
        if (focusKwMatch) {
            // Prefer document keyword if explicitly set, otherwise keep client keyword
            const docKw = focusKwMatch[1].trim();
            if (docKw && docKw.length > 2) focusKeyword = docKw;
        }

        // Clean Metadata Block
        // Remove text between ```text and ``` if it contains META info, or just the lines
        rawContent = rawContent.replace(/```text[\s\S]*?META TITLE[\s\S]*?```/gi, "");
        rawContent = rawContent.replace(/META TITLE:.*$/gim, "");
        rawContent = rawContent.replace(/META DESCRIPTION:.*$/gim, "");
        rawContent = rawContent.replace(/FOCUS KEYWORD:.*$/gim, "");
        rawContent = rawContent.replace(/URL SLUG:.*$/gim, "");
        rawContent = rawContent.replace(/```/g, ""); // Clean stray backticks

        // Remove Internal Prompts/Comments
        rawContent = rawContent.replace(/<!--\s*\[IMAGE_PROMPT_START\][\s\S]*?\[IMAGE_PROMPT_END\]\s*-->/g, "");
        rawContent = rawContent.trim();

        // 3. Convert Markdown to HTML (Universal Fix)
        // Check if content looks like markdown (Headings, Bold, Table)
        const isMarkdown = /#\s|\|.*\||\*\*|\[.*\]\(.*\)/.test(rawContent);
        let htmlContent = rawContent;

        if (isMarkdown) {
            console.log("[API] Markdown detected. Converting to HTML...");
            htmlContent = await marked.parse(rawContent);
        }

        // 4. Style Injection (Ensure fonts & spacing)
        // Add styling to essential tags if they don't have it (Force Consistency)
        const commonFont = 'font-family: Georgia, serif; line-height: 1.8; color: #1a1a1a;';

        if (!htmlContent.includes("font-family: Georgia")) {
            // Body Text
            htmlContent = htmlContent.replace(/<p>/g, `<p style="${commonFont} font-size: 18px; margin-bottom: 24px;">`);

            // Lists (Unordered & Ordered)
            htmlContent = htmlContent.replace(/<ul>/g, `<ul style="${commonFont} font-size: 18px; margin-bottom: 24px; padding-left: 20px;">`);
            htmlContent = htmlContent.replace(/<ol>/g, `<ol style="${commonFont} font-size: 18px; margin-bottom: 24px; padding-left: 20px;">`);
            htmlContent = htmlContent.replace(/<li>/g, '<li style="margin-bottom: 10px;">');

            // Headings (All use Georgia for consistency)
            // H1: strict 60px top margin requirement
            htmlContent = htmlContent.replace(/<h1>/g, `<h1 style="font-family: Georgia, serif; font-size: 36px; font-weight: 700; text-align: center; margin-top: 60px; margin-bottom: 40px; letter-spacing: -0.5px;">`);
            htmlContent = htmlContent.replace(/<h2>/g, `<h2 style="font-family: Georgia, serif; font-size: 28px; font-weight: 700; margin-top: 50px; margin-bottom: 20px; border-bottom: 1px solid #eaeaea; padding-bottom: 12px;">`);
            htmlContent = htmlContent.replace(/<h3>/g, `<h3 style="font-family: Georgia, serif; font-size: 24px; font-weight: 600; margin-top: 35px; margin-bottom: 15px;">`);

            // Blockquotes
            htmlContent = htmlContent.replace(/<blockquote>/g, `<blockquote style="border-left: 4px solid #333; padding-left: 20px; margin: 30px 0; font-style: italic; background: #f9f9f9; padding: 20px;">`);
        }

        // Table Styling (Robust & Responsive)
        htmlContent = htmlContent.replace(/<table>/g, '<div style="overflow-x: auto;"><table style="width: 100%; border-collapse: collapse; margin: 30px 0; font-family: Georgia, serif; font-size: 16px;">');
        htmlContent = htmlContent.replace(/<\/table>/g, '</table></div>'); // Close wrapper
        htmlContent = htmlContent.replace(/<th>/g, '<th style="text-align: left; padding: 14px; border-bottom: 2px solid #333; background: #f4f4f4; font-weight: bold;">');
        htmlContent = htmlContent.replace(/<td>/g, '<td style="padding: 14px; border-bottom: 1px solid #ddd;">');


        // 5. Title & H1 Logic
        let postTitle = metaTitle; // Priority 1: Meta Title

        // Priority 2: Extracted H1
        const h1Match = htmlContent.match(/<h1[^>]*>(.*?)<\/h1>/i);
        if (h1Match) {
            const h1Text = h1Match[1].replace(/<[^>]*>/g, "").trim();
            if (!postTitle || postTitle === "Blog Post") postTitle = h1Text;

            // Remove regular H1 from body if we are setting it as Post Title (avoid duplication)
            // BUT user mentioned wanting H1 *in* the body? 
            // Standard WP: Post Title becomes H1. Body H1 is redundant.
            // Let's keep it styled as H1 but ensure it's not the ONLY source of title.

            // Style H1 (Fallback if not already styled by regex above)
            if (!h1Match[0].includes('margin-top: 60px')) {
                htmlContent = htmlContent.replace(h1Match[0], `<h1 style="font-family: Georgia, serif; font-size: 36px; text-align: center; margin-top: 60px; margin-bottom: 40px; font-weight: 700;">${h1Text}</h1>`);
            }
        }

        if (!postTitle) {
            postTitle = `Blog Post ${new Date().toLocaleDateString()}`;
        }


        // 6. Inject Body Image (The "Drag & Drop" Fix)
        const finalFocusKeyword = postTitle; // Title is the Focus Keyword

        // 6. Inject Body Image (Clean & Prevent Duplicates)
        // First, remove ANY existing <img> or <figure> tags generated by AI
        htmlContent = htmlContent.replace(/<figure[^>]*>[\s\S]*?<\/figure>/g, ""); // FIXED REGEX
        htmlContent = htmlContent.replace(/<img[^>]*>/g, "");
        htmlContent = htmlContent.replace(/\[INSERT_IMAGE_HERE\]/g, ""); // Remove placeholder

        if (bodyMediaUrl) {
            const imgTag = `
                <figure class="wp-block-image size-full" style="margin: 40px 0;">
                    <img src="${bodyMediaUrl}" alt="${postTitle} details" style="width: 100%; height: auto; border-radius: 8px;" />
                     <figcaption style="text-align: center; font-style: italic; color: #666; font-size: 14px; margin-top: 8px;">${postTitle}</figcaption>
                </figure>
            `;

            // Insert after first H2 (Best Position)
            const firstH2 = htmlContent.indexOf("<h2");
            if (firstH2 !== -1) {
                htmlContent = htmlContent.slice(0, firstH2) + imgTag + htmlContent.slice(firstH2);
            } else {
                // Fallback: Top of content
                htmlContent = imgTag + htmlContent;
            }
        }

        // Clean any remaining placeholders
        htmlContent = htmlContent.replace(/\[INSERT_IMAGE_HERE\]/g, "");


        // 7. RESPONSIVE WRAPPER (Mobile Readability Guard)
        // Wraps entirely to ensure lateral padding on mobile and centered layout on desktop.
        htmlContent = `
            <div style="max-width: 800px; margin: 0 auto; padding: 0 15px; box-sizing: border-box; font-family: Georgia, serif;">
                ${htmlContent}
            </div>
        `;

        // 8. Prepare WP Credentials
        const wpUrl = process.env.WORDPRESS_URL || process.env.WP_BASE_URL;
        const wpUser = process.env.WORDPRESS_USERNAME || process.env.WP_USERNAME;
        const wpPass = process.env.WORDPRESS_APP_PASSWORD || process.env.WP_APP_PASSWORD;

        if (!wpUrl || !wpUser || !wpPass) {
            throw new Error("WordPress Credentials Missing in Environment Variables");
        }

        const authHeader = `Basic ${Buffer.from(`${wpUser}:${wpPass}`).toString("base64")}`;

        // 9. Category Logic (Auto-select 'blog' slug)
        let categoryIds = [1];
        try {
            const catRes = await fetch(`${wpUrl}/wp-json/wp/v2/categories?slug=blog`, {
                headers: { "Authorization": authHeader }
            });
            if (catRes.ok) {
                const cats = await catRes.json();
                if (cats.length > 0) categoryIds = [cats[0].id];
                else {
                    const createCat = await fetch(`${wpUrl}/wp-json/wp/v2/categories`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json", "Authorization": authHeader },
                        body: JSON.stringify({ name: "Blog", slug: "blog" })
                    });
                    if (createCat.ok) {
                        const newCat = await createCat.json();
                        categoryIds = [newCat.id];
                    }
                }
            }
        } catch (e) {
            console.warn("Category sync failed:", e);
        }

        // 10. Publish to WordPress
        // USER REQUIREMENT: Focus Keyword MUST be the Post Title
        // (finalFocusKeyword already defined above)

        // Extract Slug if available
        let finalSlug = "";
        const slugMatch = htmlContent.match(/URL SLUG:\s*([^\n]+)/i);
        if (slugMatch) {
            finalSlug = slugMatch[1].trim();
        }

        const postData = {
            title: postTitle,
            content: htmlContent,
            status: 'publish',
            slug: finalSlug || undefined, // Use extracted slug if available
            featured_media: featuredMediaId || 0,
            categories: categoryIds,
            template: 'elementor_canvas',
            meta: {
                // Rank Math SEO Fields (Try both Public and Protected keys)
                rank_math_focus_keyword: finalFocusKeyword,
                _rank_math_focus_keyword: finalFocusKeyword, // Added back for compatibility
                rank_math_description: metaDesc || `Learn about ${postTitle}`,
                rank_math_title: metaTitle || postTitle,
                rank_math_robots: ["index", "follow"], // Ensure indexing
            }
        };

        console.log("[API] Publishing to WP:", { title: postTitle, focusKeyword: finalFocusKeyword, metaDesc: metaDesc });

        const postRes = await fetch(`${wpUrl}/wp-json/wp/v2/posts`, {
            method: "POST",
            headers: {
                "Authorization": authHeader,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(postData)
        });

        if (!postRes.ok) {
            const err = await postRes.text();
            throw new Error(`WordPress API Error: ${err}`);
        }

        const result = await postRes.json();
        const postId = result.id;

        // 11. CRITICAL: Update Rank Math Meta Fields Separately
        // WordPress REST API sometimes doesn't save custom meta fields on create
        // So we make a separate POST call to update the meta after creation
        try {
            console.log(`[API] Updating Rank Math meta for post ${postId}...`);

            const metaUpdateRes = await fetch(`${wpUrl}/wp-json/wp/v2/posts/${postId}`, {
                method: "POST",
                headers: {
                    "Authorization": authHeader,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    meta: {
                        rank_math_focus_keyword: finalFocusKeyword,
                        rank_math_description: metaDesc || `Learn about ${postTitle}`,
                        rank_math_title: metaTitle || postTitle,
                    }
                })
            });

            if (metaUpdateRes.ok) {
                console.log(`[API] Rank Math meta updated successfully for post ${postId}`);
            } else {
                console.warn(`[API] Failed to update Rank Math meta: ${await metaUpdateRes.text()}`);
            }
        } catch (metaError) {
            console.warn("[API] Rank Math meta update error:", metaError);
            // Don't fail the entire operation, post is already created
        }

        return NextResponse.json({ success: true, link: result.link, postId });

    } catch (error: any) {
        console.error("[API] Publish Error:", error);
        return NextResponse.json({ error: error.message || "Unknown error" }, { status: 500 });
    }
}
