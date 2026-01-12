import { NextResponse } from "next/server"
import { DEFAULT_SEEDS } from "@/lib/research/defaultSeeds"
import { fetchGoogleSuggest, fetchGoogleTrendsDaily, fetchPeopleAlsoAsk, fetchRelatedQuestions, fetchReddit, fetchWikipedia, fetchStackExchange } from "@/lib/research/fetcher"
import { analyzeSERP } from "@/lib/serp/analyzer"
import { generateAIStrategy } from "@/services/ai-strategy"

export async function POST(req: Request) {
    console.log("[API] Generating Index-Based Keyword Analysis with Trends...");

    let manualSeeds: any[] = [];
    try {
        const body = await req.json();
        if (body.manualSeeds && Array.isArray(body.manualSeeds)) {
            manualSeeds = body.manualSeeds;
        }
    } catch (e) {
        // Body parsing failed, ignore
    }

    try {
        const currentDate = new Date();
        const nextYear = currentDate.getFullYear() + 1;

        // 1. Fetch Google Trends (US) - Hot Topics (Phase 1.B)
        const trendSeedsRaw = await fetchGoogleTrendsDaily("US");

        // Quality filter for trending seeds (not forced 2, quality-based 0~2)
        const nicheKeywords = /health|medicare|insurance|tax|finance|medical|benefit|coverage|enrollment|premium|deductible/i;
        const trendSeeds = trendSeedsRaw
            .filter(t => {
                // Must match our niche
                if (!nicheKeywords.test(t)) return false;
                // Must have at least 2 words (not too generic)
                if (t.split(' ').length < 2) return false;
                // Exclude overly generic terms
                if (/^(health|insurance|tax|medicare)$/i.test(t)) return false;
                return true;
            })
            .slice(0, 2)  // Max 2, but could be 0 or 1 if quality not met
            .map(t => ({ term: t, source: 'trend' as const }));

        console.log(`[Phase 1] Trending seeds found: ${trendSeeds.length}`, trendSeeds.map(s => s.term));

        let evergreenSeeds: { term: string; source: 'evergreen' | 'manual' }[] = [];

        if (manualSeeds.length > 0) {
            // [MANUAL MODE]
            console.log(`[API] Manual Mode: Using ${manualSeeds.length} selected seeds`);
            evergreenSeeds = manualSeeds.slice(0, 3).map((s: any) => ({
                term: s.term,
                source: 'manual' as const
            }));
        } else {
            // [AUTO MODE] - Pure Random Selection with Category Diversity
            console.log("[API] Auto Mode: Pure Random Selection (No Weight Bias)");

            // Fisher-Yates shuffle with timestamp entropy
            const shuffle = <T>(array: T[]): T[] => {
                const arr = [...array];
                const seed = Date.now();
                for (let i = arr.length - 1; i > 0; i--) {
                    const j = Math.floor(((seed * (i + 1) * Math.random()) % 1) * (i + 1));
                    [arr[i], arr[j]] = [arr[j], arr[i]];
                }
                return arr;
            };

            // Get unique categories
            const categories = [...new Set(DEFAULT_SEEDS.map(s => s.category))];
            const shuffledCategories = shuffle(categories);

            // Select 1 seed from each of 3 different random categories (ensures diversity)
            const selectedTerms = new Set<string>();
            for (const category of shuffledCategories) {
                if (evergreenSeeds.length >= 3) break;

                const categorySeeds = shuffle(DEFAULT_SEEDS.filter(s => s.category === category));
                if (categorySeeds.length > 0 && !selectedTerms.has(categorySeeds[0].term)) {
                    selectedTerms.add(categorySeeds[0].term);
                    evergreenSeeds.push({ term: categorySeeds[0].term, source: 'evergreen' as const });
                }
            }

            // Fallback: if still need more, pick randomly from all
            if (evergreenSeeds.length < 3) {
                const allShuffled = shuffle(DEFAULT_SEEDS);
                for (const seed of allShuffled) {
                    if (!selectedTerms.has(seed.term) && evergreenSeeds.length < 3) {
                        selectedTerms.add(seed.term);
                        evergreenSeeds.push({ term: seed.term, source: 'evergreen' as const });
                    }
                }
            }

            console.log(`[API] Selected seeds (Random from ${DEFAULT_SEEDS.length} total):`, evergreenSeeds.map(s => s.term));
        }

        // Combine Seeds and Process
        let combinedSeeds = [...evergreenSeeds, ...trendSeeds];

        const keywords = await Promise.all(combinedSeeds.map(async (seedObj) => {
            const term = seedObj.term;
            const isTrend = seedObj.source === 'trend';
            const candidates: string[] = [];

            // 2. DISCOVER CANDIDATES (PHASE 2: Multi-Source Cross Analysis)
            try {
                // Parallel Fetching
                const [googleSuggestions, redditTitles, wikiTitles, stackResults] = await Promise.all([
                    fetchGoogleSuggest(term),
                    fetchReddit(term),
                    fetchWikipedia(term),
                    fetchStackExchange(term)
                ]);

                // Source 1: Google
                if (googleSuggestions) candidates.push(...googleSuggestions);

                // Source 2: Reddit
                if (redditTitles) {
                    redditTitles.forEach(title => {
                        const cleaned = title.replace(/[^\w\s]/gi, '').trim();
                        if (cleaned.split(' ').length <= 8) candidates.push(cleaned);
                    });
                }

                // Source 3: Wikipedia
                if (wikiTitles) candidates.push(...wikiTitles);

                // Source 4: StackExchange
                if (stackResults) {
                    stackResults.forEach((item: any) => {
                        const cleaned = item.title.replace(/[^\w\s]/gi, '').trim();
                        if (cleaned.split(' ').length <= 8) candidates.push(cleaned);
                    });
                }

            } catch (e) {
                console.error(`[Phase 2] Multi-source fetch failed for seed ${term}:`, e);
                // Fallback
                try {
                    const fallback = await fetchGoogleSuggest(term);
                    if (fallback) candidates.push(...fallback);
                } catch (err) { }
            }

            // Inject Real-time Trends into candidates (Phase 1.C)
            try {
                const dailyTrends = await fetchGoogleTrendsDaily("US");
                const relevantTrends = dailyTrends.filter(t =>
                    t.toLowerCase().includes("health") ||
                    t.toLowerCase().includes("medicare") ||
                    t.toLowerCase().includes("insurance")
                );
                candidates.push(...relevantTrends.slice(0, 5));
            } catch (e) { }

            // 3. SCORE & FILTER (PHASE 3)
            let finalSuggestions: any[] = [];

            if (candidates && candidates.length > 0) {
                candidates.forEach((realTerm, index) => {
                    const seedWords = term.split(" ").length;
                    const realWords = realTerm.split(" ").length;
                    const diffThreshold = isTrend ? 1 : 2;

                    if (realWords - seedWords < diffThreshold) return;
                    if (realTerm === term || realTerm === term + "s") return;
                    if (realTerm.length > 60) return;

                    const bannedTerms = [
                        "pdf", "download", "ebook", "free printable",
                        "login", "sign in", "log in", "portal", "account",
                        "phone number", "customer service", "contact number", "call",
                        "near me", "locations", "office address"
                    ];
                    if (bannedTerms.some(ban => realTerm.includes(ban))) return;

                    const metrics = analyzeKeywordMetrics(realTerm, term, "Google", index, isTrend);
                    if (realTerm.length > term.length + 10) metrics.score += 5;

                    finalSuggestions.push(metrics);
                });
            }

            // FALLBACK & SELECT
            if (finalSuggestions.length < 1) {
                // If totally empty, return generic fallback to prevent UI crash
                return {
                    term: term,
                    score: 0,
                    volume: "N/A",
                    difficulty: "Unknown",
                    highlights: [],
                    category: "General",
                    suggestions: [],
                    peopleAlsoAsk: []
                };
            }

            const sorted = finalSuggestions.sort((a, b) => b.score - a.score);
            const uniqueCandidates: any[] = [];
            const seenWords = new Set();

            for (const item of sorted) {
                const core = item.keyword.replace(/s$/, '');
                if (!seenWords.has(core)) {
                    uniqueCandidates.push(item);
                    seenWords.add(core);
                }
            }

            // STRICT QUALITY FILTER (60+)
            let highQualityPicks = uniqueCandidates.filter(item =>
                item.score >= 60 || item.difficulty === "Easy"
            );

            if (highQualityPicks.length === 0 && uniqueCandidates.length > 0) {
                highQualityPicks = [uniqueCandidates[0]];
            }

            const finalPicks = highQualityPicks.slice(0, 5);

            // 5. PREPARE SUGGESTIONS (NO SERP HERE - Phase 4 happens later)
            // SERP is called only for the FINAL selected keyword, not for all candidates
            const suggestionsWithStrategy = await Promise.all(finalPicks.slice(0, 3).map(async (pick, idx) => {
                // Only fetch PAA (free API)
                let relatedQuestions: string[] = [];
                try {
                    relatedQuestions = await fetchRelatedQuestions(pick.keyword);
                } catch (e) { }

                // NO SERP CALL HERE - will be done in Phase 4 for final selection only
                // This saves 12+ SERP calls per request

                return {
                    ...pick,
                    korean: pick.keyword,  // Will be translated later if needed
                    peopleAlsoAsk: relatedQuestions.slice(0, 5),
                    serpAnalysis: null,  // Placeholder - filled in Phase 4
                    strategy: null  // Placeholder - filled in Phase 5
                };
            }));

            // Get best suggestion for metadata
            const bestSuggestion = suggestionsWithStrategy[0];
            const safeScore = (bestSuggestion && bestSuggestion.score) || 0;
            const safeDifficulty = bestSuggestion?.difficulty || "Normal";
            const safeVolume = bestSuggestion?.volume || "N/A";
            const highlights: string[] = [];

            if (safeDifficulty === "Easy") highlights.push("🟢 경쟁 낮음");
            else if (safeDifficulty === "Hard") highlights.push("🔴 경쟁 높음");
            if (parseInt(safeVolume.replace(/,/g, '')) >= 1000) highlights.push("👁️ 조회수 높음");
            if (isTrend) highlights.push("🔥 급상승 트렌드");
            if (safeScore >= 80) highlights.push("👑 강력 추천");

            return {
                term: term,
                score: safeScore,
                volume: safeVolume,
                difficulty: safeDifficulty,
                highlights: highlights,
                category: isTrend ? "Trending 🔥" : (bestSuggestion?.intent || "General"),
                suggestions: suggestionsWithStrategy,
                peopleAlsoAsk: bestSuggestion?.peopleAlsoAsk || []
            };
        }));

        // Cleanup nulls
        let validKeywords = keywords.filter(k => k && k.suggestions && k.suggestions.length > 0);

        validKeywords.sort((a, b) => (b as any).score - (a as any).score);
        validKeywords = validKeywords.slice(0, 3);

        // ========== PHASE 3.5: SERP VALIDATION (Smart Loop) ==========
        // Try up to 2 candidates to find a REAL opportunity
        console.log(`[Phase 3.5] Smart Validation starting...`);

        let validatedCount = 0;
        let bestCandidateIndex = 0;

        for (let i = 0; i < Math.min(3, validKeywords.length); i++) {
            if (validatedCount >= 2) break; // Max 2 API calls here
            const keyword = validKeywords[i];
            const topSuggestion = keyword.suggestions[0];

            if (topSuggestion && topSuggestion.keyword) {
                try {
                    console.log(`[Phase 3.5] Analyzing SERP for: "${topSuggestion.keyword}"`);
                    const serpAnalysis = await analyzeSERP(topSuggestion.keyword);
                    validatedCount++;

                    // Add SERP analysis to the suggestion
                    topSuggestion.serpAnalysis = serpAnalysis;

                    // Check if this is a "Good Opportunity"
                    const gapCount = serpAnalysis?.contentGaps?.length || 0;
                    console.log(`[Phase 3.5] Gaps found: ${gapCount}`);

                    if (gapCount > 0) {
                        console.log(`[Phase 3.5] ✅ WINNER FOUND! Promoting Candidate #${i + 1}`);
                        bestCandidateIndex = i;
                        break; // Stop looking, we found a winner!
                    } else {
                        console.log(`[Phase 3.5] ❌ Weak opportunity. Trying next candidate...`);
                    }
                } catch (e) {
                    console.error(`[Phase 3.5] SERP analysis failed for ${topSuggestion.keyword}:`, e);
                }
            }
        }

        // Re-order keywords to put the winner first
        if (bestCandidateIndex > 0) {
            console.log(`[Phase 3.5] Promoting winner (Index ${bestCandidateIndex}) to top position`);
            const winner = validKeywords[bestCandidateIndex];
            validKeywords.splice(bestCandidateIndex, 1);
            validKeywords.unshift(winner);
        }

        return NextResponse.json({
            seeds: manualSeeds.length > 0 ? manualSeeds : [],
            results: validKeywords
        });

    } catch (error) {
        console.error("[API] Error generating keywords:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// ============================================================================
// ENHANCED SCORING SYSTEM v2.0
// ============================================================================

interface ScoringFactors {
    searchInterest: number;
    competition: number;
    documentExposure: number;
    keywordStructure: number;
    trendingBonus: number;
    intentValue: number;
    freshness: number;
    actionability: number;
}

function analyzeKeywordMetrics(keyword: string, seed: string, source: string, rankPosition: number, isTrending: boolean = false) {
    const wordCount = keyword.split(" ").length;
    const lowerKeyword = keyword.toLowerCase();
    const currentYear = new Date().getFullYear();
    const nextYear = currentYear + 1;

    const factors: ScoringFactors = {
        searchInterest: 65,
        competition: 60,
        documentExposure: 60,
        keywordStructure: 60,
        trendingBonus: 0,
        intentValue: 50,
        freshness: 60,
        actionability: 60
    };

    if (rankPosition <= 2) {
        factors.searchInterest = 95;
        factors.competition = 80;
    } else if (rankPosition <= 5) {
        factors.searchInterest = 85;
        factors.competition = 70;
    } else if (rankPosition <= 8) {
        factors.searchInterest = 70;
        factors.competition = 60;
    } else {
        factors.searchInterest = 55;
        factors.competition = 40;
    }

    factors.documentExposure = Math.max(30, 100 - (rankPosition * 5));

    if (wordCount >= 7) {
        factors.keywordStructure = 98;
        factors.competition -= 20;
    } else if (wordCount >= 5) {
        factors.keywordStructure = 90;
        factors.competition -= 10;
    } else if (wordCount >= 4) {
        factors.keywordStructure = 80;
    } else if (wordCount >= 3) {
        factors.keywordStructure = 70;
    } else {
        factors.keywordStructure = 40;
        factors.competition += 10;
    }

    const questionWords = ["how", "what", "why", "when", "where", "who", "which", "can", "do", "is", "are"];
    if (questionWords.some(q => lowerKeyword.startsWith(q))) {
        factors.keywordStructure += 10;
        factors.actionability += 15;
    }

    if (isTrending) {
        factors.trendingBonus = 50;
        factors.searchInterest += 10;
        factors.freshness = 95;
    }

    const seasonalWords = ["enrollment", "open enrollment", "tax", "deadline", "new year", "2025", "2026"];
    if (seasonalWords.some(w => lowerKeyword.includes(w))) {
        factors.trendingBonus += 20;
        factors.freshness += 20;
    }

    const highValueWords = ["best", "top", "review", "compare", "vs", "alternative"];
    const commercialWords = ["cost", "price", "fees", "premium", "rates", "cheap", "affordable", "free"];
    const transactionalWords = ["buy", "enroll", "sign up", "apply", "register", "get", "find"];
    const guideWords = ["how to", "guide", "steps", "checklist", "tutorial", "tips", "mistakes"];
    const problemWords = ["denied", "rejection", "appeal", "problem", "issue", "error", "fix"];

    let intent = "일반 정보";

    if (highValueWords.some(w => lowerKeyword.includes(w))) {
        factors.intentValue = 90;
        factors.competition -= 10;
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

    if (lowerKeyword.includes(String(nextYear))) {
        factors.freshness = 100;
    } else if (lowerKeyword.includes(String(currentYear))) {
        factors.freshness = 85;
    } else if (lowerKeyword.includes("new") || lowerKeyword.includes("latest") || lowerKeyword.includes("update")) {
        factors.freshness = 70;
    }

    const badIntentWords = ["login", "portal", "phone number", "contact", "download pdf", "form"];
    if (badIntentWords.some(w => lowerKeyword.includes(w))) {
        factors.actionability = 10;
    }

    if (guideWords.some(w => lowerKeyword.includes(w)) || questionWords.some(q => lowerKeyword.startsWith(q))) {
        factors.actionability = 85;
    }

    let persistence = 50;
    const evergreenWords = ["basics", "guide", "explained", "what is", "how to", "steps", "checklist", "eligibility", "coverage"];
    const seasonalOnlyWords = ["black friday", "cyber monday", "christmas", "thanksgiving", "new year"];

    if (evergreenWords.some(w => lowerKeyword.includes(w))) {
        persistence = 85;
    } else if (seasonalOnlyWords.some(w => lowerKeyword.includes(w))) {
        persistence = 25;
    } else if (lowerKeyword.includes("enrollment") || lowerKeyword.includes("deadline")) {
        persistence = 60;
    }

    let repeatability = 50;
    const repeatPatternWords = ["annual", "yearly", "monthly", "every year", "open enrollment", "tax season", "renewal"];
    const oneTimeWords = ["new law", "breaking", "announced", "just released"];

    if (repeatPatternWords.some(w => lowerKeyword.includes(w))) {
        repeatability = 90;
    } else if (oneTimeWords.some(w => lowerKeyword.includes(w))) {
        repeatability = 30;
    } else if (evergreenWords.some(w => lowerKeyword.includes(w))) {
        repeatability = 75;
    }

    const weights = {
        freshness: 0.18,
        searchInterest: 0.18,
        documentExposure: 0.18,
        persistence: 0.14,
        repeatability: 0.14,
        trendingBonus: 0.11,
        intentValue: 0.04,
        keywordStructure: 0.03
    };

    const rawScore =
        (factors.freshness * weights.freshness) +
        (factors.searchInterest * weights.searchInterest) +
        (factors.documentExposure * weights.documentExposure) +
        (persistence * weights.persistence) +
        (repeatability * weights.repeatability) +
        (factors.trendingBonus * weights.trendingBonus) +
        (factors.intentValue * weights.intentValue) +
        (factors.keywordStructure * weights.keywordStructure);

    const finalScore = Math.min(99, Math.max(20, Math.round(rawScore)));

    let difficulty: string;
    if (factors.competition >= 65) {
        difficulty = "경쟁 높음";
    } else if (factors.competition >= 50) {
        difficulty = "경쟁 보통";
    } else {
        difficulty = "경쟁 낮음";
    }

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

    let freshnessLabel = "보통";
    if (factors.freshness >= 80) {
        freshnessLabel = "높음 (이슈)";
    } else if (factors.freshness >= 60) {
        freshnessLabel = "좋음";
    }

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
        strategy: strategy,
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

interface KeywordStrategy {
    issue: string;
    expandedKeywords: string[];
    questionKeywords: string[];
    tactics: string[];
    contentAngle: string;
}

function generateKeywordStrategy(keyword: string, factors: ScoringFactors, score: number): KeywordStrategy {
    const lowerKeyword = keyword.toLowerCase();
    const wordCount = keyword.split(" ").length;
    const currentYear = new Date().getFullYear();

    let issue = "";
    const issues: string[] = [];

    if (factors.competition >= 70) issues.push("경쟁이 너무 치열함");
    if (wordCount <= 3) issues.push("키워드가 너무 짧음 (롱테일 필요)");
    if (factors.intentValue < 50) issues.push("수익 의도가 약함");
    if (factors.freshness < 50) issues.push("시의성 부족");
    if (factors.actionability < 50) issues.push("콘텐츠화 어려움");

    issue = issues.length > 0 ? issues.join(" / ") : "전반적으로 개선 필요";

    const expandedKeywords: string[] = [];
    if (!lowerKeyword.includes(String(currentYear)) && !lowerKeyword.includes(String(currentYear + 1))) {
        expandedKeywords.push(`${keyword} ${currentYear + 1}`);
    }

    const intentModifiers = ["how to", "best", "guide", "step by step", "for beginners", "vs", "cost", "checklist"];
    for (const modifier of intentModifiers.slice(0, 3)) {
        if (!lowerKeyword.includes(modifier)) {
            if (modifier === "how to" || modifier === "best") {
                expandedKeywords.push(`${modifier} ${keyword}`);
            } else {
                expandedKeywords.push(`${keyword} ${modifier}`);
            }
        }
    }

    const specificityModifiers = ["for seniors", "for 65+", "in 2025", "complete guide", "explained simply"];
    for (const modifier of specificityModifiers.slice(0, 2)) {
        expandedKeywords.push(`${keyword} ${modifier}`);
    }

    const questionKeywords: string[] = [
        `what is ${keyword}`,
        `how does ${keyword} work`,
        `how to apply for ${keyword}`,
        `when should I get ${keyword}`,
        `is ${keyword} worth it`
    ];

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

    if (tactics.length === 0) {
        tactics.push("📌 Related Questions (PAA)를 H2로 활용하세요");
        tactics.push("🔗 내부 링크로 관련 콘텐츠와 연결하세요");
        tactics.push("📊 구체적인 수치와 사례를 포함하세요");
    }

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
