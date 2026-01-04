import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
    console.log("[API] Starting Draft Save...");

    try {
        const formData = await req.formData();
        const title = formData.get("title") as string || "Untitled Draft";
        const htmlContent = formData.get("htmlContent") as string;
        const thumbnailFile = formData.get("thumbnailImage") as File;
        const bodyImageFile = formData.get("bodyImage") as File;

        // 1. User Validation
        let user = await prisma.user.findFirst();
        if (!user) {
            user = await prisma.user.create({
                data: {
                    email: "admin@whness.com",
                    passwordHash: "admin_only_local",
                    name: "Admin",
                }
            });
        }

        // 2. Extract SEO Metadata from HTML (Ensuring variables exist)
        let focusKeyword = "Draft";
        let metaDescription = "Draft auto-save";

        if (htmlContent) {
            const kwMatch = htmlContent.match(/FOCUS KEYWORD:\s*(.*)/i);
            if (kwMatch) focusKeyword = kwMatch[1].trim();

            const descMatch = htmlContent.match(/META DESCRIPTION:\s*(.*)/i);
            if (descMatch) metaDescription = descMatch[1].trim();
        }

        // 3. Supabase Storage Setup (Safe Client)
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        const bucketName = process.env.SUPABASE_STORAGE_BUCKET || "whness-blog";
        const timestamp = Date.now();

        const uploadFile = async (file: File, subDir: string) => {
            if (!file || file.size === 0) return null;

            const fileName = `${timestamp}-${file.name.replace(/\s/g, '_') || "image.png"}`;
            const path = `${subDir}/${user!.id}/${fileName}`;
            const buffer = await file.arrayBuffer();

            const { error: uploadError } = await supabase.storage.from(bucketName).upload(path, buffer, {
                contentType: file.type || "image/png",
                upsert: false
            });

            if (uploadError) {
                console.error(`[API] Storage Error (${path}):`, uploadError.message);
                throw new Error(`Supabase Storage Error: ${uploadError.message}. Check Bucket RLS/Policies.`);
            }

            const { data: publicUrlData } = supabase.storage.from(bucketName).getPublicUrl(path);
            return publicUrlData.publicUrl;
        };

        // Upload and handle failures
        let thumbnailUrl = null;
        let bodyImageUrl = null;

        try {
            thumbnailUrl = await uploadFile(thumbnailFile, "thumbnails");
            bodyImageUrl = await uploadFile(bodyImageFile, "raw");
        } catch (e: any) {
            return NextResponse.json({ error: e.message }, { status: 500 });
        }

        // 4. Database Transaction (Atomic)
        const article = await prisma.article.create({
            data: {
                userId: user.id,
                title: title,
                slug: `draft-${timestamp}`,
                content: htmlContent || "",
                focusKeyword: focusKeyword,
                metaTitle: title,
                metaDesc: metaDescription,
                wordCount: 0,
                h2Count: 0,
                h3Count: 0,
                keywordDensity: 0,
                status: "draft",
                estimatedScore: 0,
                persona: {},
                images: {
                    create: [
                        ...(thumbnailUrl ? [{
                            type: "featured",
                            url: thumbnailUrl,
                            altText: title,
                            prompt: "Featured Image",
                            position: "featured"
                        }] : []),
                        ...(bodyImageUrl ? [{
                            type: "section",
                            url: bodyImageUrl,
                            altText: title,
                            prompt: "Body Image",
                            position: "body"
                        }] : [])
                    ]
                }
            } as any,
            include: { images: true }
        });

        return NextResponse.json({
            success: true,
            id: article.id,
            imagesStored: article.images.length
        });

    } catch (error: any) {
        console.error("[API] Save Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function GET() {
    try {
        const drafts = await prisma.article.findMany({
            where: { status: "draft" },
            include: { images: true },
            orderBy: { updatedAt: 'desc' }
        });
        return NextResponse.json({ drafts });
    } catch (error) {
        return NextResponse.json({ error: "Fetch failed" }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");
        const ids = searchParams.get("ids");

        console.log(`[API] Deleting: ${id || ids}`);

        if (ids) {
            const list = ids.split(",");
            await prisma.article.deleteMany({ where: { id: { in: list } } });
        } else if (id) {
            await prisma.article.delete({ where: { id } });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("[API] Delete Failed:", error.message);
        return NextResponse.json({ error: `Delete failed: ${error.message}` }, { status: 500 });
    }
}
