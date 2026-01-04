
// Basic implementation of WordPress publishing via REST API
// Note: Requires Application Password to be set in WordPress

interface PublishParams {
    siteUrl: string
    username: string
    appPassword: string // Application Password
    title: string
    content: string // HTML content
    status?: 'publish' | 'draft' | 'future'
    slug?: string
    categories?: number[] // Category IDs
    featuredMediaId?: number
    date?: string // ISO 8601 date string for scheduling
}

interface WPPostResponse {
    id: number
    link: string
    date: string
}

export async function publishToWordPress({
    siteUrl,
    username,
    appPassword,
    title,
    content,
    status = 'draft',
    slug,
    categories,
    featuredMediaId,
    date
}: PublishParams): Promise<WPPostResponse> {

    // Ensure URL doesn't end with slash
    const baseUrl = siteUrl.replace(/\/$/, '')
    const endpoint = `${baseUrl}/wp-json/wp/v2/posts`

    // Basic Auth
    const auth = Buffer.from(`${username}:${appPassword}`).toString('base64')

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${auth}`
        },
        body: JSON.stringify({
            title: title,
            content: content,
            status: status,
            slug: slug,
            categories: categories,
            featured_media: featuredMediaId,
            date: date
        })
    })

    if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`WordPress Publish Failed: ${response.status} ${response.statusText} - ${errorText}`)
    }

    const data = await response.json()
    return {
        id: data.id,
        link: data.link,
        date: data.date
    }
}

// Helper to upload image to WordPress Media Library
interface UploadImageParams {
    siteUrl: string
    username: string
    appPassword: string
    imageUrl: string
    altText: string
}

export async function uploadImageToWordPress({
    siteUrl,
    username,
    appPassword,
    imageUrl,
    altText
}: UploadImageParams): Promise<number> {
    const baseUrl = siteUrl.replace(/\/$/, '')
    const endpoint = `${baseUrl}/wp-json/wp/v2/media`
    const auth = Buffer.from(`${username}:${appPassword}`).toString('base64')

    // 1. Fetch image data
    const imageRes = await fetch(imageUrl)
    if (!imageRes.ok) throw new Error("Failed to download image for upload")
    const imageBuffer = await imageRes.arrayBuffer()
    const buffer = Buffer.from(imageBuffer)

    // 2. Upload
    const filename = `image-${Date.now()}.png`

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Disposition': `attachment; filename="${filename}"`,
            'Content-Type': 'image/png' // Assuming PNG usage or generic
        },
        body: buffer
    })

    if (!response.ok) {
        const err = await response.text()
        throw new Error(`Media Upload Failed: ${err}`)
    }

    const data = await response.json()

    // 3. Update Alt Text (Optional but recommended)
    // The initial upload might not allow setting alt_text directly in body if sending binary
    if (data.id) {
        await fetch(`${endpoint}/${data.id}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${auth}`
            },
            body: JSON.stringify({
                alt_text: altText
            })
        })
    }

    return data.id
}
