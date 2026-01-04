import { NextResponse } from "next/server"
import { DEFAULT_SEEDS, DEFAULT_SUBREDDITS, getRandomSeeds, getHighPrioritySeeds, SEED_CATEGORIES } from "@/lib/research/defaultSeeds"
import { fetchGoogleTrends, fetchRedditPosts, fetchStackExchange, scoreKeywords } from "@/services/research"

export async function GET() {
    // Return available seeds and categories
    return NextResponse.json({
        seeds: DEFAULT_SEEDS,
        subreddits: DEFAULT_SUBREDDITS,
        categories: SEED_CATEGORIES,
        totalSeeds: DEFAULT_SEEDS.length
    })
}

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { seeds, sources, useDefaultSeeds, category } = body

        // Use provided seeds or get from defaults
        let seedList: string[] = []

        if (useDefaultSeeds) {
            // Get seeds based on category or random high-priority seeds
            const selectedSeeds = category
                ? DEFAULT_SEEDS.filter(s => s.category === category)
                : getHighPrioritySeeds(3)
            seedList = selectedSeeds.map(s => s.term)
        } else if (seeds && seeds.length > 0) {
            seedList = seeds
        } else {
            // Default: get 5 random high-priority seeds
            seedList = getRandomSeeds(5).map(s => s.term)
        }

        const seedKeyword = seedList[0]

        // Fetch data from enabled sources in parallel
        const enabledSources = sources || ["google", "reddit", "stackexchange"]

        const [trends, redditPosts, stackPosts] = await Promise.all([
            enabledSources.includes("google") ? fetchGoogleTrends(seedKeyword) : Promise.resolve([]),
            enabledSources.includes("reddit") ? fetchRedditPosts(seedKeyword) : Promise.resolve([]),
            enabledSources.includes("stackexchange") ? fetchStackExchange(seedKeyword) : Promise.resolve([])
        ])

        // Combine seeds with trends
        const allKeywords = [...new Set([
            ...seedList,
            ...trends.slice(0, 10)
        ])]

        // Score and rank keywords
        const scoredKeywords = scoreKeywords(allKeywords, redditPosts, stackPosts)

        return NextResponse.json({
            keywords: scoredKeywords.slice(0, 15),
            sources: {
                trends: trends.length,
                reddit: redditPosts.length,
                stackexchange: stackPosts.length,
                defaultSeeds: seedList.length
            },
            rawData: {
                redditPosts: redditPosts.slice(0, 3),
                stackPosts: stackPosts.slice(0, 3)
            },
            meta: {
                totalDefaultSeeds: DEFAULT_SEEDS.length,
                subredditsUsed: DEFAULT_SUBREDDITS
            }
        })

    } catch (error) {
        console.error("Research API Error:", error)
        return NextResponse.json(
            { error: "Research failed" },
            { status: 500 }
        )
    }
}

