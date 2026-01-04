import { NextResponse } from "next/server"

// Article list API - fetches from database
export async function GET(req: Request) {
    try {
        // For now, return empty list
        // In production, this would query Prisma
        return NextResponse.json({
            articles: [],
            total: 0,
            page: 1
        })
    } catch (error) {
        console.error("Articles API Error:", error)
        return NextResponse.json(
            { error: "Failed to fetch articles" },
            { status: 500 }
        )
    }
}
