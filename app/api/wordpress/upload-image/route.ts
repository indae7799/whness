import { NextResponse } from "next/server";

// This endpoint handles individual image uploads to WordPress
// Keeping payloads small to avoid Vercel's 4.5MB limit

export const maxDuration = 30;
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    console.log("[API] Uploading single image to WordPress...");

    try {
        const formData = await req.formData();
        const imageFile = formData.get("image") as File;
        const imageType = formData.get("type") as string; // 'featured' or 'body'

        if (!imageFile || imageFile.size === 0) {
            return NextResponse.json({ error: "No image provided" }, { status: 400 });
        }

        // Check image size - if over 4MB, reject with helpful message
        const maxSize = 4 * 1024 * 1024; // 4MB
        if (imageFile.size > maxSize) {
            return NextResponse.json({
                error: "Image too large. Please use an image under 4MB.",
                size: imageFile.size,
                maxSize: maxSize
            }, { status: 413 });
        }

        const wpUrl = process.env.WORDPRESS_URL || process.env.WP_BASE_URL;
        const wpUser = process.env.WORDPRESS_USERNAME || process.env.WP_USERNAME;
        const wpPass = process.env.WORDPRESS_APP_PASSWORD || process.env.WP_APP_PASSWORD;

        if (!wpUrl || !wpUser || !wpPass) {
            return NextResponse.json({ error: "WP Credentials Missing" }, { status: 500 });
        }

        const authHeader = `Basic ${Buffer.from(`${wpUser}:${wpPass}`).toString("base64")}`;

        const res = await fetch(`${wpUrl}/wp-json/wp/v2/media`, {
            method: "POST",
            headers: {
                "Authorization": authHeader,
                "Content-Disposition": `attachment; filename="${imageFile.name}"`,
                "Content-Type": imageFile.type || "image/png",
            },
            body: Buffer.from(await imageFile.arrayBuffer())
        });

        if (!res.ok) {
            const errorText = await res.text();
            console.error("[API] WP Image Upload Error:", errorText);
            return NextResponse.json({ error: "Failed to upload to WordPress" }, { status: 500 });
        }

        const mediaData = await res.json();
        console.log(`[API] ${imageType} image uploaded:`, mediaData.source_url);

        return NextResponse.json({
            success: true,
            id: mediaData.id,
            url: mediaData.source_url,
            type: imageType
        });

    } catch (err: any) {
        console.error("[API] Image upload error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
