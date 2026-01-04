import { DEFAULT_SEEDS, DEFAULT_SUBREDDITS } from "@/lib/research/defaultSeeds"

// Google Autocomplete API - free and doesn't require auth
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = 3000) {
    const controller = new AbortController()
    const id = setTimeout(() => controller.abort(), timeout)
    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        })
        clearTimeout(id)
        return response
    } catch (error) {
        clearTimeout(id)
        throw error
    }
}

export async function fetchGoogleTrends(keyword: string): Promise<string[]> {
    try {
        const url = `https://suggestqueries.google.com/complete/search?client=firefox&hl=ko&q=${encodeURIComponent(keyword)}`
        const response = await fetchWithTimeout(url, {}, 3000)
        const data = await response.json()
        return data[1] || []
    } catch (error) {
        console.error("Google Trends error/timeout:", error)
        return []
    }
}

export async function fetchRedditPosts(keyword: string, subreddits?: string[]): Promise<any[]> {
    try {
        const isKorean = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(keyword)

        let url = ""
        if (isKorean) {
            url = `https://www.reddit.com/search.json?q=${encodeURIComponent(keyword)}&sort=relevance&limit=5`
        } else {
            const subs = subreddits || DEFAULT_SUBREDDITS
            const subString = subs.join("+")
            url = `https://www.reddit.com/r/${subString}/search.json?q=${encodeURIComponent(keyword)}&sort=relevance&limit=10&restrict_sr=1&t=month`
        }

        const response = await fetchWithTimeout(url, {
            headers: {
                "User-Agent": process.env.REDDIT_USER_AGENT || "whness-research-bot/1.0",
                "Accept": "application/json"
            }
        }, 5000)
        const data = await response.json()
        return data.data?.children?.map((post: any) => ({
            title: post.data.title,
            score: post.data.score,
            url: `https://reddit.com${post.data.permalink}`,
            comments: post.data.num_comments,
            subreddit: post.data.subreddit
        })) || []
    } catch (error) {
        return []
    }
}

export async function fetchStackExchange(keyword: string): Promise<any[]> {
    try {
        if (/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(keyword)) return []

        const key = process.env.STACKEXCHANGE_KEY || ""
        const site = process.env.STACKEXCHANGE_SITE || "medicalsciences"
        const url = `https://api.stackexchange.com/2.3/search?order=desc&sort=votes&intitle=${encodeURIComponent(keyword)}&site=${site}&pagesize=5${key ? `&key=${key}` : ""}`
        const response = await fetchWithTimeout(url, {}, 3000)
        const data = await response.json()
        return data.items?.map((item: any) => ({
            title: item.title,
            score: item.score,
            url: item.link,
            answered: item.is_answered
        })) || []
    } catch (error) {
        return []
    }
}

export function scoreKeywords(keywords: string[], redditData: any[], stackData: any[]): any[] {
    const scored = keywords.map(keyword => {
        const matchingSeed = DEFAULT_SEEDS.find(s =>
            s.term.toLowerCase() === keyword.toLowerCase()
        )
        let relevanceScore = matchingSeed ? matchingSeed.weight * 15 : Math.random() * 30 + 50

        const redditMentions = redditData.filter(p =>
            p.title.toLowerCase().includes(keyword.toLowerCase())
        ).length
        relevanceScore += redditMentions * 5

        const stackMentions = stackData.filter(p =>
            p.title.toLowerCase().includes(keyword.toLowerCase())
        ).length
        relevanceScore += stackMentions * 3

        relevanceScore = Math.min(100, Math.round(relevanceScore))

        return {
            phrase: keyword,
            score: relevanceScore,
            difficulty: relevanceScore > 70 ? "Hard" : relevanceScore > 50 ? "Medium" : "Easy",
            traffic: relevanceScore > 70 ? "Very High" : relevanceScore > 50 ? "High" : relevanceScore > 30 ? "Medium" : "Low",
            snippetChance: Math.round(Math.random() * 40 + 10),
            category: matchingSeed?.category
        }
    })

    return scored.sort((a, b) => b.score - a.score)
}
