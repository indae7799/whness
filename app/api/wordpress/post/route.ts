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
            // Upload Featured Image
            const mediaData = await uploadImage(finalFeatured);
            featuredMediaId = mediaData.id;
        }

        if (finalBody) {
            console.log("[API] Uploading Body Image...");
            // Upload Body Image
            // Even if same file, uploading again ensures distinct attachment ID/URL usage if needed, 
            // but realistically we could optimize. For safety and distinct alt text potential, upload separately.
            const mediaData = await uploadImage(finalBody);
            bodyImageUrl = mediaData.source_url;
        }

        // 3. Parse Content
        let title = "Untitled Blog Post";
        const h1Match = htmlContent.match(/<h1[^>]*>(.*?)<\/h1>/i);
        if (h1Match && h1Match[1]) {
            title = h1Match[1].replace(/<[^>]*>/g, "");
        }

        // 4. Inject Body Image (if exists)
        let finalContent = htmlContent;
        if (bodyImageUrl) {
            const imageHtml = `
                <figure class="wp-block-image size-full">
                    <img src="${bodyImageUrl}" alt="${title}" style="width:100%; height:auto; border-radius:8px; margin-bottom: 32px;" />
                </figure>
            `;

            if (finalContent.includes("[INSERT_IMAGE_HERE]")) {
                finalContent = finalContent.replace("[INSERT_IMAGE_HERE]", imageHtml);
            } else if (h1Match) {
                finalContent = finalContent.replace("</h1>", "</h1>" + imageHtml);
            } else {
                finalContent = imageHtml + finalContent; // Prepend
            }
        }

        if (h1Match) {
            finalContent = finalContent.replace(h1Match[0], "");
        }

        // 5. Create Post
        console.log("[API] Creating Post...");
        const postData = {
            title: title,
            content: finalContent,
            status: 'publish',
            featured_media: featuredMediaId
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
