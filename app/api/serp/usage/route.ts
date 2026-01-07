import { NextRequest, NextResponse } from "next/server";
import { getSerpUsageFromDB } from "@/lib/serp/analyzer";

export async function GET(req: NextRequest) {
    const usage = await getSerpUsageFromDB();

    return NextResponse.json({
        serpApi: {
            used: usage.serpApiUsed,
            limit: 100,  // Monthly limit
            remaining: 100 - usage.serpApiUsed
        },
        serper: {
            used: usage.serperUsed,
            limit: 2500,  // Total lifetime
            remaining: 2500 - usage.serperUsed
        }
    });
}
