import { NextResponse } from "next/server"

// WordPress REST API client
interface WordPressPostData {
    title: string
    content: string
    status: "publish" | "draft" | "pending"
    slug?: string
    excerpt?: string
    featured_media?: number
    categories?: number[]
    tags?: number[]
    meta?: Record<string, any>
}

async function getWordPressCredentials() {
    const baseUrl = process.env.WP_BASE_URL
    const username = process.env.WP_USERNAME
    const appPassword = process.env.WP_APP_PASSWORD

    if (!baseUrl || !username || !appPassword) {
        throw new Error("WordPress credentials not configured")
    }

    return { baseUrl, username, appPassword }
}

async function uploadFeaturedImage(
    baseUrl: string,
    auth: string,
    imageUrl: string,
    title: string
): Promise<number> {
    // Download image from URL
    const imageResponse = await fetch(imageUrl)
    const imageBlob = await imageResponse.blob()

    // Upload to WordPress media library
    const formData = new FormData()
    formData.append("file", imageBlob, `${title.replace(/[^a-z0-9]/gi, "-")}.png`)

    const uploadResponse = await fetch(`${baseUrl}/wp-json/wp/v2/media`, {
        method: "POST",
        headers: {
            Authorization: auth,
        },
        body: formData,
    })

    if (!uploadResponse.ok) {
        const error = await uploadResponse.text()
        console.error("Media upload failed:", error)
        throw new Error("Failed to upload featured image")
    }

    const mediaData = await uploadResponse.json()
    return mediaData.id
}

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { title, content, excerpt, slug, featuredImageUrl, status = "draft" } = body

        if (!title || !content) {
            return NextResponse.json({ error: "Title and content are required" }, { status: 400 })
        }

        const { baseUrl, username, appPassword } = await getWordPressCredentials()
        const auth = `Basic ${Buffer.from(`${username}:${appPassword}`).toString("base64")}`

        // Upload featured image if provided
        let featuredMediaId: number | undefined
        if (featuredImageUrl) {
            try {
                featuredMediaId = await uploadFeaturedImage(baseUrl, auth, featuredImageUrl, title)
            } catch (error) {
                console.error("Featured image upload failed, continuing without it:", error)
            }
        }

        // Create the post
        let finalContent = content

        // If we have a featured image, also inject it into the content for better visibility
        if (featuredImageUrl) {
            const h1Match = content.match(/^#\s+.+$/m)
            if (h1Match) {
                const h1End = content.indexOf(h1Match[0]) + h1Match[0].length
                // Find first paragraph or section break after H1
                const nextBreak = content.indexOf('\n\n', h1End)
                if (nextBreak !== -1) {
                    const insertionPoint = nextBreak + 2
                    finalContent = content.slice(0, insertionPoint) +
                        `<!-- Featured Image Injection -->\n![Featured Image](${featuredImageUrl})\n\n` +
                        content.slice(insertionPoint)
                } else {
                    finalContent = content + `\n\n![Featured Image](${featuredImageUrl})`
                }
            } else {
                finalContent = `![Featured Image](${featuredImageUrl})\n\n` + content
            }
        }

        const postData: WordPressPostData = {
            title,
            content: finalContent,
            status,
            excerpt,
            slug,
            featured_media: featuredMediaId,
        }

        const response = await fetch(`${baseUrl}/wp-json/wp/v2/posts`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: auth,
            },
            body: JSON.stringify(postData),
        })

        if (!response.ok) {
            const errorText = await response.text()
            console.error("WordPress API Error:", errorText)
            throw new Error(`WordPress publish failed: ${response.status}`)
        }

        const postResult = await response.json()

        return NextResponse.json({
            success: true,
            postId: postResult.id,
            postUrl: postResult.link,
            editUrl: `${baseUrl}/wp-admin/post.php?post=${postResult.id}&action=edit`,
            status: postResult.status,
        })

    } catch (error: any) {
        console.error("WordPress Publish Error:", error)

        if (error.message?.includes("credentials")) {
            return NextResponse.json(
                { error: "WordPress 인증 정보가 설정되지 않았습니다. .env.local 파일을 확인하세요." },
                { status: 500 }
            )
        }

        return NextResponse.json(
            { error: "WordPress 발행 중 오류가 발생했습니다." },
            { status: 500 }
        )
    }
}
