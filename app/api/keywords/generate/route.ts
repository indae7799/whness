import { NextResponse } from "next/server"
import { DEFAULT_SEEDS } from "@/lib/research/defaultSeeds"
import { fetchGoogleSuggest, fetchGoogleTrendsDaily } from "@/lib/research/fetcher"

export async function POST(req: Request) {
    console.log("[API] Generating Index-Based Keyword Analysis with Trends...");

    try {
        const currentDate = new Date();
        const nextYear = currentDate.getFullYear() + 1;

        // --- 1. Seed Selection (Hybrid: Evergreen + Real-Time Trends) ---

        // A. Evergreen Seeds (From our safe list) - Pick 3
        const evergreenSeeds = [...DEFAULT_SEEDS]
            .map(s => ({ term: s.term, source: 'evergreen' as const }))
            .sort(() => 0.5 - Math.random())
            .slice(0, 3);

        // B. Real-Time Trends (Google RSS) - Pick 2 relevant ones or top ones
        let trendSeeds: { term: string, source: 'trend' }[] = [];
        try {
            const rawTrends = await fetchGoogleTrendsDaily("US"); // Geo US
            // Filter trends that might be relevant to our niche (broadly)
            // Or just take top 2 to spark "News Jacking" ideas
            // For now, we take top 2 regardless, to show "What's Hot".
            // Ideally, we filter by keywords like "health", "money", "tax", "law".

            const insuranceKeywords = ["health", "medicare", "insurance", "tax", "finance", "medical", "drug", "benefit", "cost", "new", "law"];

            const relevantTrends = rawTrends.filter(t =>
                insuranceKeywords.some(k => t.toLowerCase().includes(k))
            ).slice(0, 2);

            // If no relevant trends found, just take the top 2 absolute hottest topics (News Jacking strategy)
            const backupTrends = rawTrends.slice(0, 2);

            const finalTrends = relevantTrends.length > 0 ? relevantTrends : backupTrends;

            trendSeeds = finalTrends.map(t => ({ term: t, source: 'trend' as const }));

        } catch (e) {
            console.warn("Failed to fetch trends, falling back to evergreen only");
        }

        // Combine: 3 Evergreen + 2 Trends = 5 Seeds to Analyze
        let combinedSeeds = [...evergreenSeeds, ...trendSeeds];

        const keywords = await Promise.all(combinedSeeds.map(async (seedObj) => {
            const term = seedObj.term;
            let finalSuggestions: any[] = [];
            const isTrend = seedObj.source === 'trend'; // Correctly detect trend seeds

            try {
                // LEVEL 1: Direct Suggest
                const level1Suggestions = await fetchGoogleSuggest(term);

                // If Level 1 provided good candidates, use them.
                // BUT, to get deeper insights, let's pick one "Juicy" candidate and dive deeper (Level 2).

                let candidates = level1Suggestions;

                // LEVEL 2: Deep Dive (Recursive Fetch)
                // If we found some suggestions, pick a random long one and fetch IT'S suggestions
                if (level1Suggestions.length > 3) {
                    // Pick a random suggestion from the middle (usually best mix of volume/specific)
                    const deepSeed = level1Suggestions[Math.floor(level1Suggestions.length / 2)];
                    const level2Suggestions = await fetchGoogleSuggest(deepSeed);

                    // Merge unique suggestions
                    candidates = [...new Set([...level1Suggestions, ...level2Suggestions])];
                }

                if (candidates && candidates.length > 0) {
                    candidates.forEach((realTerm, index) => {
                        // Strict Filtering
                        const seedWords = term.split(" ").length;
                        const realWords = realTerm.split(" ").length;

                        // Trend seeds can be loose (1 word diff ok), Evergreen needs strict (2 words)
                        const diffThreshold = isTrend ? 1 : 2;

                        if (realWords - seedWords < diffThreshold) return;
                        if (realTerm === term || realTerm === term + "s") return;
                        if (realTerm.length > 60) return; // Too long

                        // Negative Filter: Un-actionable or Misleading intents
                        // We strictly filter out things the user cannot provide (files, tech support, government actions)
                        const bannedTerms = [
                            "pdf", "download", "ebook", "free printable", // File expectations
                            "login", "sign in", "log in", "portal", "account", // Tech support expectations (USER CANNOT FIX LOGIN ISSUES)
                            "phone number", "customer service", "contact number", "call", // Directory expectations
                            "near me", "locations", "office address" // Local map expectations
                        ];

                        if (bannedTerms.some(ban => realTerm.includes(ban))) return;

                        const metrics = analyzeKeywordMetrics(realTerm, term, "Google", index, isTrend);
                        // Bonus for Level 2 results (longer usually)
                        if (realTerm.length > term.length + 10) metrics.score += 5;

                        finalSuggestions.push(metrics);
                    });
                }

            } catch (err) {
                console.warn(`[API] Fetch failed for ${term}`);
            }

            // Fallback: If no suggestions found, return null
            if (finalSuggestions.length < 1) return null;

            // 4. Final Selection mechanism:
            // SORT by Score (Highest First)
            const sorted = finalSuggestions.sort((a, b) => b.score - a.score);

            // Deduplicate (content diversity)
            const uniqueCandidates: any[] = [];
            const seenWords = new Set();

            for (const item of sorted) {
                const core = item.keyword.replace(/s$/, '');
                if (!seenWords.has(core)) {
                    uniqueCandidates.push(item);
                    seenWords.add(core);
                }
            }

            // STRICT QUALITY FILTER
            // User wants "Strong Competition Analysis". 
            // We only show keywords that generate a high score (>72) or are explicitly 'Easy'.
            // providing meaningful choices rather than filling space.
            let highQualityPicks = uniqueCandidates.filter(item =>
                item.score >= 72 || item.difficulty === "Easy"
            );

            // Safety: If nothing meets high standards, just take the absolute best one.
            if (highQualityPicks.length === 0 && uniqueCandidates.length > 0) {
                highQualityPicks = [uniqueCandidates[0]];
            }

            // Cap at 5, but don't force fill. Can be 1, 2, 3, 4, or 5.
            const finalPicks = highQualityPicks.slice(0, 5);

            return {
                term: term,
                category: isTrend ? "Trending 🔥" : (finalPicks[0]?.intent || "General"),
                suggestions: finalPicks
            };
        }));

        // Filter out nulls and empty keywords
        let validKeywords = keywords.filter(k => k !== null && k.suggestions.length > 0);

        // SORT COMPLETED CARDS:
        // Bubble up the Focus Keywords that produced the HIGHEST SCORING suggestions.
        // We want the "strongest" ones first.
        validKeywords.sort((a, b) => {
            const bestA = a!.suggestions[0]?.score || 0;
            const bestB = b!.suggestions[0]?.score || 0;
            return bestB - bestA;
        });

        // Limit to Top 3 as requested (User wants "Killer Quality" over Quantity)
        validKeywords = validKeywords.slice(0, 3);

        return NextResponse.json({ keywords: validKeywords });

    } catch (error) {
        console.error("[API] Keyword Generation Failed:", error);
        return NextResponse.json({ error: "Failed to generate keywords" }, { status: 500 });
    }
}

// --- Rank-Based Scoring System ---

function analyzeKeywordMetrics(keyword: string, seed: string, source: string, rankPosition: number, isTrending: boolean = false) {
    const wordCount = keyword.split(" ").length;

    // Base Values
    let score = 70;
    let difficulty = "Medium";
    let intent = "Informational";
    let volumeEstimate = 1000; // Base baseline

    // --- 1. Difficulty Calculation (Based on Source Rank) ---
    if (source === "Google") {
        if (rankPosition <= 2) {
            difficulty = "Hard";
            volumeEstimate = 5000 + (Math.random() * 5000);
            score -= 10;
        } else if (rankPosition <= 6) {
            difficulty = "Medium";
            volumeEstimate = 1500 + (Math.random() * 2000);
            score += 5;
        } else {
            difficulty = "Easy";
            volumeEstimate = 300 + (Math.random() * 800);
            score += 15;
        }
    }

    // --- 2. Trending Bonus (The "Secret Sauce") ---
    if (isTrending) {
        score += 15; // Huge bonus for being based on a current hot topic
        volumeEstimate *= 1.5; // Likely higher real volume than historical data shows
        // Determine intent based on "news" feel
        score = Math.min(score, 99);
    }

    // --- 3. Word Count Modifier (KGR Principle) ---
    if (wordCount >= 5) {
        score += 5;
        if (difficulty === "Hard") difficulty = "Medium";
    }
    if (wordCount >= 7) {
        score += 10;
        difficulty = "Easy";
    }

    // --- 4. Intent & Value Modifiers ---
    // --- 4. Intent & Value Modifiers (Korean Translation) ---
    const commercialWords = ["cost", "price", "fees", "premium", "rates", "cheap", "best"];
    const transactionalWords = ["buy", "enroll", "sign up", "get", "apply", "register"];
    const guideWords = ["how to", "guide", "steps", "checklist", "what is", "benefits", "deadline"];

    if (commercialWords.some(w => keyword.toLowerCase().includes(w))) {
        intent = "수익형 (홍보)";
        score += 5;
    } else if (transactionalWords.some(w => keyword.toLowerCase().includes(w))) {
        intent = "수익형 (전환)";
        score += 5;
    } else if (guideWords.some(w => keyword.toLowerCase().includes(w))) {
        intent = "정보형 (유입)";
        score += 8;
    } else {
        intent = "일반 정보";
    }

    // --- 5. Freshness Bonus (Year) ---
    let freshness = "보통";
    if (keyword.includes("2025") || keyword.includes("2026") || isTrending) {
        score += 10;
        volumeEstimate *= 1.2;
        freshness = "높음 (이슈)";
    }

    // Format Volume
    const volStr = volumeEstimate > 1000
        ? `${(volumeEstimate / 1000).toFixed(1)}k/mo`
        : `${Math.floor(volumeEstimate)}/mo`;

    // Translate Difficulty
    const difficultyKr = difficulty === "Hard" ? "경쟁 높음"
        : difficulty === "Medium" ? "경쟁 중간"
            : "경쟁 낮음 (추천)";

    return {
        keyword: keyword,
        score: Math.min(score, 99),
        difficulty: difficultyKr,
        intent: intent,
        volume: volStr,
        // Added details for UI
        freshness: freshness
    };
}
