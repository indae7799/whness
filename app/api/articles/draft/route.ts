import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
    console.log("[API] Saving Draft...");

    try {
        const formData = await req.formData();

        const title = formData.get("title") as string || "Untitled Draft";
        const htmlContent = formData.get("htmlContent") as string;
        const thumbnailFile = formData.get("thumbnailImage") as File; // The generated overlay image
        const bodyImageFile = formData.get("bodyImage") as File; // The raw clean image

        // 1. Get or Create Default User (Since this is a single-user tool mostly)
        let user = await prisma.user.findFirst();
        if (!user) {
            console.log("[API] No user found. Creating default admin user.");
            user = await prisma.user.create({
                data: {
                    email: "admin@whness.com",
                    passwordHash: "hashed_dummy_password",
                    name: "Admin",
                }
            });
        }

        // 2. Upload Images to Supabase Storage
        const supabase = await createClient();
        const bucketName = "blog-assets"; // User needs to create this bucket in Supabase Dashboard -> Storage

        // Helper to upload
        const uploadToSupabase = async (file: File, path: string) => {
            if (!file) return null;

            const buffer = await file.arrayBuffer();
            const { data, error } = await supabase
                .storage
                .from(bucketName)
                .upload(path, buffer, {
                    contentType: file.type,
                    upsert: true
                });

            if (error) {
                console.error(`[API] Storage Upload Error (${path}):`, error);
                // Return null or throw? If bucket doesn't exist, this fails.
                // We'll proceed without image if fails, but log it.
                return null;
            }

            // Get Public URL
            const { data: publicUrlData } = supabase
                .storage
                .from(bucketName)
                .getPublicUrl(path);

            return publicUrlData.publicUrl;
        };

        const timestamp = Date.now();
        let thumbnailUrl = "";
        let bodyImageUrl = "";

        if (thumbnailFile) {
            const path = `thumbnails/${user.id}/${timestamp}-${thumbnailFile.name || 'thumb.png'}`;
            const url = await uploadToSupabase(thumbnailFile, path);
            if (url) thumbnailUrl = url;
        }

        if (bodyImageFile) {
            const path = `raw/${user.id}/${timestamp}-${bodyImageFile.name || 'raw.png'}`;
            const url = await uploadToSupabase(bodyImageFile, path);
            if (url) bodyImageUrl = url;
        }

        // 3. Save Draft to Database (Prisma)
        // We use the Article model with status = 'draft'
        const article = await prisma.article.create({
            data: {
                userId: user.id,
                title: title,
                slug: `draft-${timestamp}`, // Temporary slug
                content: htmlContent || "",
                focusKeyword: "Draft", // Placeholder
                metaTitle: title,
                metaDesc: "Draft content",
                wordCount: 0,
                h2Count: 0,
                h3Count: 0,
                keywordDensity: 0,
                status: "draft",
                estimatedScore: 0,
                persona: {}, // Empty JSON

                // Create Image relations if we have URLs
                images: {
                    create: [
                        ...(thumbnailUrl ? [{
                            type: "featured",
                            url: thumbnailUrl,
                            altText: title,
                            prompt: "Draft Thumbnail",
                            position: "featured"
                        }] : []),
                        ...(bodyImageUrl ? [{
                            type: "section", // Body image
                            url: bodyImageUrl,
                            altText: title,
                            prompt: "Draft Body Image",
                            position: "body"
                        }] : [])
                    ]
                }
            } as any
        });

        console.log("[API] Draft Saved:", article.id);

        return NextResponse.json({
            success: true,
            id: article.id,
            message: "Draft saved successfully!"
        });

    } catch (error) {
        console.error("[API] Save Draft Error:", error);
        return NextResponse.json({ error: "Failed to save draft. Ensure Database and Storage are connected." }, { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        const drafts = await prisma.article.findMany({
            where: { status: "draft" },
            include: { images: true },
            orderBy: { updatedAt: 'desc' }
        });

        return NextResponse.json({ drafts });
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch drafts" }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");
        const ids = searchParams.get("ids"); // For bulk delete

        if (!id && !ids) {
            return NextResponse.json({ error: "ID or IDs required" }, { status: 400 });
        }

        if (ids) {
            const idList = ids.split(",");
            await prisma.article.deleteMany({
                where: { id: { in: idList } }
            });
            return NextResponse.json({ success: true, message: "Drafts deleted" });
        }

        await prisma.article.delete({
            where: { id: id as string }
        });

        return NextResponse.json({ success: true, message: "Draft deleted" });
    } catch (error) {
        console.error("[API] Delete Draft Error:", error);
        return NextResponse.json({ error: "Failed to delete draft" }, { status: 500 });
    }
}
