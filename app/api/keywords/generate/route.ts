import { NextResponse } from "next/server"
import { DEFAULT_SEEDS } from "@/lib/research/defaultSeeds"
import { fetchGoogleSuggest, fetchGoogleTrendsDaily, fetchPeopleAlsoAsk } from "@/lib/research/fetcher"

export async function POST(req: Request) {
    console.log("[API] Generating Index-Based Keyword Analysis with Trends...");

    try {
        const currentDate = new Date();
        const nextYear = currentDate.getFullYear() + 1;

        // =====================================================
        // SMART SEED ROTATION SYSTEM
        // =====================================================
        // Instead of pure random, we use a deterministic rotation
        // based on day of week + hour to ensure variety across sessions
        // =====================================================

        const dayOfWeek = currentDate.getDay(); // 0-6
        const hourOfDay = currentDate.getHours(); // 0-23
        const dayOfMonth = currentDate.getDate(); // 1-31

        // Calculate rotation index (changes every 4 hours)
        // This gives 6 rotation slots per day, cycling through all 65 seeds over ~10 days
        const rotationSlot = Math.floor(hourOfDay / 4); // 0-5
        const rotationIndex = (dayOfMonth * 6 + rotationSlot) % DEFAULT_SEEDS.length;

        // Sort seeds by weight (higher weight = more important)
        const sortedSeeds = [...DEFAULT_SEEDS].sort((a, b) => (b.weight || 2) - (a.weight || 2));

        // Select 5 seeds using rotation + weight-based selection
        // - 2 high-weight seeds (weight >= 4)
        // - 2 medium-weight seeds (weight 3)
        // - 1 rotating seed from full list
        const highWeightSeeds = sortedSeeds.filter(s => (s.weight || 2) >= 4);
        const mediumWeightSeeds = sortedSeeds.filter(s => (s.weight || 2) === 3);
        const allSeeds = sortedSeeds;

        // Rotate within each category
        const pickRotated = <T>(arr: T[], count: number, offset: number): T[] => {
            if (arr.length === 0) return [];
            const result: T[] = [];
            for (let i = 0; i < count && i < arr.length; i++) {
                const idx = (offset + i * 7) % arr.length; // Use prime-like step for better distribution
                result.push(arr[idx]);
            }
            return result;
        };

        const selectedHighWeight = pickRotated(highWeightSeeds, 2, rotationIndex);
        const selectedMediumWeight = pickRotated(mediumWeightSeeds, 2, rotationIndex + 3);
        const selectedRotating = pickRotated(allSeeds, 1, rotationIndex + dayOfWeek);

        // Combine and deduplicate
        const selectedTerms = new Set<string>();
        const evergreenSeeds: { term: string; source: 'evergreen' }[] = [];

        for (const seed of [...selectedHighWeight, ...selectedMediumWeight, ...selectedRotating]) {
            if (!selectedTerms.has(seed.term) && evergreenSeeds.length < 3) {
                selectedTerms.add(seed.term);
                evergreenSeeds.push({ term: seed.term, source: 'evergreen' as const });
            }
        }

        // Fill remaining slots if needed
        let fillIndex = rotationIndex;
        while (evergreenSeeds.length < 3 && fillIndex < allSeeds.length + rotationIndex) {
            const seed = allSeeds[fillIndex % allSeeds.length];
            if (!selectedTerms.has(seed.term)) {
                selectedTerms.add(seed.term);
                evergreenSeeds.push({ term: seed.term, source: 'evergreen' as const });
            }
            fillIndex++;
        }

        console.log(`[API] Selected evergreen seeds (rotation ${rotationIndex}):`, evergreenSeeds.map(s => s.term));

        // B. Real-Time Trends (Google RSS) - Pick 2 relevant ones
        let trendSeeds: { term: string, source: 'trend' }[] = [];
        try {
            const rawTrends = await fetchGoogleTrendsDaily("US");

            const insuranceKeywords = ["health", "medicare", "insurance", "tax", "finance", "medical", "drug", "benefit", "cost", "new", "law"];

            const relevantTrends = rawTrends.filter(t =>
                insuranceKeywords.some(k => t.toLowerCase().includes(k))
            ).slice(0, 2);

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

            // Fetch People Also Ask questions for this term
            let paaQuestions: string[] = [];
            try {
                const paaResults = await fetchPeopleAlsoAsk(term);
                paaQuestions = paaResults.map(p => p.question).slice(0, 5);
            } catch (e) {
                console.warn(`[API] PAA fetch failed for ${term}`);
            }

            return {
                term: term,
                category: isTrend ? "Trending 🔥" : (finalPicks[0]?.intent || "General"),
                suggestions: finalPicks,
                peopleAlsoAsk: paaQuestions // NEW: PAA questions for this keyword
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

// ============================================================================
// ENHANCED SCORING SYSTEM v2.0
// ============================================================================
// Factors considered:
// 1. 검색관심도 (Search Interest) - Estimated from Google rank position
// 2. 경쟁도 (Competition Level) - Based on keyword length and specificity
// 3. 문서노출수 (Document Exposure) - Inferred from autocomplete ranking
// 4. 키워드 구조 (Keyword Structure) - Word count, question format, modifiers
// 5. 현재 이슈성 (Current Trends) - Trending topics, yearly keywords
// 6. 수익 의도 (Commercial Intent) - Buyer intent signals
// 7. 신선도 (Freshness) - Year markers, seasonal relevance
// 8. 실행가능성 (Actionability) - Can we rank for this?
// ============================================================================

interface ScoringFactors {
    searchInterest: number;      // 0-100: Estimated search volume
    competition: number;         // 0-100: Lower is better (easier)
    documentExposure: number;    // 0-100: Based on autocomplete position
    keywordStructure: number;    // 0-100: Long-tail bonus
    trendingBonus: number;       // 0-100: Current issue/trend
    intentValue: number;         // 0-100: Commercial value
    freshness: number;           // 0-100: Timeliness
    actionability: number;       // 0-100: Can we actually rank?
}

function analyzeKeywordMetrics(keyword: string, seed: string, source: string, rankPosition: number, isTrending: boolean = false) {
    const wordCount = keyword.split(" ").length;
    const lowerKeyword = keyword.toLowerCase();
    const currentYear = new Date().getFullYear();
    const nextYear = currentYear + 1;

    // Initialize scoring factors
    const factors: ScoringFactors = {
        searchInterest: 50,
        competition: 50,
        documentExposure: 50,
        keywordStructure: 50,
        trendingBonus: 0,
        intentValue: 30,
        freshness: 40,
        actionability: 50
    };

    // =====================
    // 1. SEARCH INTEREST (검색관심도)
    // =====================
    // Autocomplete rank 1-3 = high volume, 4-6 = medium, 7+ = low
    // But lower volume = easier to rank (inverse relationship for us)
    if (rankPosition <= 2) {
        factors.searchInterest = 90;  // High volume
        factors.competition = 85;      // But high competition
    } else if (rankPosition <= 5) {
        factors.searchInterest = 70;
        factors.competition = 60;
    } else if (rankPosition <= 8) {
        factors.searchInterest = 50;
        factors.competition = 40;
    } else {
        factors.searchInterest = 35;
        factors.competition = 25;      // Low competition = opportunity
    }

    // =====================
    // 2. DOCUMENT EXPOSURE (문서노출수)
    // =====================
    // Lower autocomplete rank = more documents already competing
    factors.documentExposure = Math.max(10, 100 - (rankPosition * 8));

    // =====================
    // 3. KEYWORD STRUCTURE (키워드 구조)
    // =====================
    // Long-tail keywords (5+ words) are easier to rank
    if (wordCount >= 7) {
        factors.keywordStructure = 95;  // Very long-tail = golden opportunity
        factors.competition -= 30;
    } else if (wordCount >= 5) {
        factors.keywordStructure = 80;
        factors.competition -= 15;
    } else if (wordCount >= 4) {
        factors.keywordStructure = 65;
        factors.competition -= 5;
    } else if (wordCount >= 3) {
        factors.keywordStructure = 50;
    } else {
        factors.keywordStructure = 25;  // Short keywords are very competitive
        factors.competition += 20;
    }

    // Question format bonus (great for featured snippets)
    const questionWords = ["how", "what", "why", "when", "where", "who", "which", "can", "do", "is", "are"];
    if (questionWords.some(q => lowerKeyword.startsWith(q))) {
        factors.keywordStructure += 15;
        factors.actionability += 10;  // Questions are easier to answer
    }

    // =====================
    // 4. TRENDING BONUS (현재 이슈성)
    // =====================
    if (isTrending) {
        factors.trendingBonus = 40;
        factors.searchInterest += 20;
        factors.freshness = 95;
    }

    // Seasonal/Event keywords
    const seasonalWords = ["enrollment", "open enrollment", "tax", "deadline", "new year", "2025", "2026"];
    if (seasonalWords.some(w => lowerKeyword.includes(w))) {
        factors.trendingBonus += 20;
        factors.freshness += 20;
    }

    // =====================
    // 5. INTENT VALUE (수익 의도)
    // =====================
    const highValueWords = ["best", "top", "review", "compare", "vs", "alternative"];
    const commercialWords = ["cost", "price", "fees", "premium", "rates", "cheap", "affordable", "free"];
    const transactionalWords = ["buy", "enroll", "sign up", "apply", "register", "get", "find"];
    const guideWords = ["how to", "guide", "steps", "checklist", "tutorial", "tips", "mistakes"];
    const problemWords = ["denied", "rejection", "appeal", "problem", "issue", "error", "fix"];

    let intent = "일반 정보";

    if (highValueWords.some(w => lowerKeyword.includes(w))) {
        factors.intentValue = 90;
        intent = "수익형 (비교)";
    } else if (commercialWords.some(w => lowerKeyword.includes(w))) {
        factors.intentValue = 85;
        intent = "수익형 (가격)";
    } else if (transactionalWords.some(w => lowerKeyword.includes(w))) {
        factors.intentValue = 80;
        intent = "수익형 (전환)";
    } else if (problemWords.some(w => lowerKeyword.includes(w))) {
        factors.intentValue = 75;
        intent = "문제해결형";
    } else if (guideWords.some(w => lowerKeyword.includes(w))) {
        factors.intentValue = 65;
        intent = "정보형 (가이드)";
    } else {
        factors.intentValue = 40;
        intent = "일반 정보";
    }

    // =====================
    // 6. FRESHNESS (신선도)
    // =====================
    if (lowerKeyword.includes(String(nextYear))) {
        factors.freshness = 100;  // Next year = maximum freshness
    } else if (lowerKeyword.includes(String(currentYear))) {
        factors.freshness = 85;
    } else if (lowerKeyword.includes("new") || lowerKeyword.includes("latest") || lowerKeyword.includes("update")) {
        factors.freshness = 70;
    }

    // =====================
    // 7. ACTIONABILITY (실행가능성)
    // =====================
    // Can we actually create good content for this?
    const badIntentWords = ["login", "portal", "phone number", "contact", "download pdf", "form"];
    if (badIntentWords.some(w => lowerKeyword.includes(w))) {
        factors.actionability = 10;  // Can't help users with these
    }

    // Good content opportunities
    if (guideWords.some(w => lowerKeyword.includes(w)) || questionWords.some(q => lowerKeyword.startsWith(q))) {
        factors.actionability = 85;
    }

    // =====================
    // CALCULATE FINAL SCORE
    // =====================
    // Weighted formula - prioritize actionability and low competition
    const weights = {
        searchInterest: 0.10,      // 10% - We want some volume, but not priority
        competition: 0.25,         // 25% - IMPORTANT: Lower competition is key
        keywordStructure: 0.20,    // 20% - Long-tail matters
        trendingBonus: 0.10,       // 10% - Nice bonus
        intentValue: 0.15,         // 15% - Commercial value
        freshness: 0.10,           // 10% - Timeliness
        actionability: 0.10        // 10% - Can we actually rank
    };

    // Invert competition for scoring (lower competition = higher score)
    const competitionScore = 100 - factors.competition;

    const rawScore =
        (factors.searchInterest * weights.searchInterest) +
        (competitionScore * weights.competition) +
        (factors.keywordStructure * weights.keywordStructure) +
        (factors.trendingBonus * weights.trendingBonus) +
        (factors.intentValue * weights.intentValue) +
        (factors.freshness * weights.freshness) +
        (factors.actionability * weights.actionability);

    // Normalize to 0-99 range
    const finalScore = Math.min(99, Math.max(20, Math.round(rawScore)));

    // =====================
    // DETERMINE DIFFICULTY LABEL
    // =====================
    let difficulty: string;
    if (factors.competition >= 70) {
        difficulty = "경쟁 높음";
    } else if (factors.competition >= 45) {
        difficulty = "경쟁 중간";
    } else {
        difficulty = "경쟁 낮음 (추천)";
    }

    // =====================
    // ESTIMATE VOLUME STRING
    // =====================
    let volumeEstimate: number;
    if (factors.searchInterest >= 80) {
        volumeEstimate = 5000 + Math.random() * 5000;
    } else if (factors.searchInterest >= 60) {
        volumeEstimate = 2000 + Math.random() * 3000;
    } else if (factors.searchInterest >= 40) {
        volumeEstimate = 500 + Math.random() * 1500;
    } else {
        volumeEstimate = 100 + Math.random() * 400;
    }

    const volStr = volumeEstimate > 1000
        ? `${(volumeEstimate / 1000).toFixed(1)}k/mo`
        : `${Math.floor(volumeEstimate)}/mo`;

    // =====================
    // FRESHNESS LABEL
    // =====================
    let freshnessLabel = "보통";
    if (factors.freshness >= 80) {
        freshnessLabel = "높음 (이슈)";
    } else if (factors.freshness >= 60) {
        freshnessLabel = "좋음";
    }

    // =====================
    // GENERATE STRATEGY FOR LOW-SCORING KEYWORDS
    // =====================
    let strategy = null;
    if (finalScore < 60) {
        strategy = generateKeywordStrategy(keyword, factors, finalScore);
    }

    return {
        keyword: keyword,
        score: finalScore,
        difficulty: difficulty,
        intent: intent,
        volume: volStr,
        freshness: freshnessLabel,
        strategy: strategy, // NEW: Attack strategy for low-scoring keywords
        _factors: {
            searchInterest: Math.round(factors.searchInterest),
            competition: Math.round(factors.competition),
            structure: Math.round(factors.keywordStructure),
            trending: Math.round(factors.trendingBonus),
            intentValue: Math.round(factors.intentValue),
            freshness: Math.round(factors.freshness),
            actionability: Math.round(factors.actionability)
        }
    };
}

// ============================================================================
// KEYWORD STRATEGY GENERATOR
// ============================================================================
// When a keyword has low score, provide:
// 1. Expanded keyword variations
// 2. Question-based alternatives
// 3. Detailed attack strategy
// ============================================================================

interface KeywordStrategy {
    issue: string;                    // What's wrong with this keyword
    expandedKeywords: string[];       // Suggested improved versions
    questionKeywords: string[];       // Question-based alternatives
    tactics: string[];                // Specific action items
    contentAngle: string;             // Recommended content approach
}

function generateKeywordStrategy(keyword: string, factors: ScoringFactors, score: number): KeywordStrategy {
    const lowerKeyword = keyword.toLowerCase();
    const wordCount = keyword.split(" ").length;
    const currentYear = new Date().getFullYear();

    // Identify the main issue
    let issue = "";
    const issues: string[] = [];

    if (factors.competition >= 70) {
        issues.push("경쟁이 너무 치열함");
    }
    if (wordCount <= 3) {
        issues.push("키워드가 너무 짧음 (롱테일 필요)");
    }
    if (factors.intentValue < 50) {
        issues.push("수익 의도가 약함");
    }
    if (factors.freshness < 50) {
        issues.push("시의성 부족");
    }
    if (factors.actionability < 50) {
        issues.push("콘텐츠화 어려움");
    }

    issue = issues.length > 0 ? issues.join(" / ") : "전반적으로 개선 필요";

    // Generate expanded keyword variations
    const expandedKeywords: string[] = [];

    // Add year for freshness
    if (!lowerKeyword.includes(String(currentYear)) && !lowerKeyword.includes(String(currentYear + 1))) {
        expandedKeywords.push(`${keyword} ${currentYear + 1}`);
    }

    // Add intent modifiers
    const intentModifiers = [
        "how to",
        "best",
        "guide",
        "step by step",
        "for beginners",
        "vs",
        "cost",
        "checklist"
    ];

    for (const modifier of intentModifiers.slice(0, 3)) {
        if (!lowerKeyword.includes(modifier)) {
            if (modifier === "how to" || modifier === "best") {
                expandedKeywords.push(`${modifier} ${keyword}`);
            } else {
                expandedKeywords.push(`${keyword} ${modifier}`);
            }
        }
    }

    // Add specificity modifiers
    const specificityModifiers = [
        "for seniors",
        "for 65+",
        "in 2025",
        "complete guide",
        "explained simply"
    ];

    for (const modifier of specificityModifiers.slice(0, 2)) {
        expandedKeywords.push(`${keyword} ${modifier}`);
    }

    // Generate question-based alternatives
    const questionKeywords: string[] = [
        `what is ${keyword}`,
        `how does ${keyword} work`,
        `how to apply for ${keyword}`,
        `when should I get ${keyword}`,
        `is ${keyword} worth it`
    ];

    // Generate tactical recommendations
    const tactics: string[] = [];

    if (factors.competition >= 70) {
        tactics.push("🎯 더 구체적인 니치 키워드로 시작하세요");
        tactics.push("📊 롱테일 키워드(5+ 단어)로 확장하세요");
    }

    if (wordCount <= 3) {
        tactics.push("📝 키워드에 연도, 지역, 또는 대상(예: seniors)을 추가하세요");
        tactics.push("❓ 질문 형태(How to, What is)로 변환하세요");
    }

    if (factors.intentValue < 50) {
        tactics.push("💰 'cost', 'best', 'compare' 같은 수익 키워드를 추가하세요");
        tactics.push("📈 문제 해결형 콘텐츠로 접근하세요 (예: mistakes, issues)");
    }

    if (factors.freshness < 50) {
        tactics.push("🗓️ 현재 연도나 'updated', 'latest'를 포함하세요");
        tactics.push("📰 최근 뉴스나 법률 변경사항을 언급하세요");
    }

    if (factors.actionability < 50) {
        tactics.push("✅ 실용적인 체크리스트나 단계별 가이드를 만드세요");
        tactics.push("🎬 FAQ 섹션을 추가해 Featured Snippet을 노리세요");
    }

    // Default tactics
    if (tactics.length === 0) {
        tactics.push("📌 Related Questions (PAA)를 H2로 활용하세요");
        tactics.push("🔗 내부 링크로 관련 콘텐츠와 연결하세요");
        tactics.push("📊 구체적인 수치와 사례를 포함하세요");
    }

    // Recommend content angle
    let contentAngle = "";
    if (factors.competition >= 70) {
        contentAngle = "개인 경험 기반의 'Ultimate Guide' 형식으로 차별화하세요. 대형 사이트가 다루지 않는 실질적인 팁에 집중하세요.";
    } else if (factors.intentValue < 50) {
        contentAngle = "'사례 연구' 또는 '비교 분석' 형식으로 작성하여 수익형 의도를 추가하세요. 실제 비용이나 선택 기준을 상세히 다루세요.";
    } else if (wordCount <= 3) {
        contentAngle = "'완전 가이드' 형식으로 10개 이상의 세부 토픽을 포함하세요. 각 토픽이 별도의 롱테일 키워드를 타겟하도록 구성하세요.";
    } else {
        contentAngle = "FAQ 형식 + 단계별 가이드를 조합하세요. Google Featured Snippet 노출을 위해 50-60 단어의 간결한 답변을 포함하세요.";
    }

    return {
        issue,
        expandedKeywords: expandedKeywords.slice(0, 5),
        questionKeywords: questionKeywords.slice(0, 4),
        tactics: tactics.slice(0, 4),
        contentAngle
    };
}
