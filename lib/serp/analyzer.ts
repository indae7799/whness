import { fetchGoogleSuggest } from "@/lib/research/fetcher";

// ============================================
// SERP API KEYS (The Constitution)
// ============================================
// SERP API KEYS (From Environment Variables)
// ============================================
const SERPER_API_KEY = process.env.SERPER_API_KEY || "";
const SERP_API_KEY = process.env.SERP_API_KEY || "";

import prisma from "@/lib/prisma";

// ============================================
// USAGE TRACKING (Supabase Persistence)
// ============================================

async function incrementApiUsage(type: 'serpApi' | 'serper') {
    try {
        await (prisma as any).systemUsage.upsert({
            where: { id: 'system' },
            create: {
                id: 'system',
                serpApiUsed: type === 'serpApi' ? 1 : 0,
                serperUsed: type === 'serper' ? 1 : 0,
                lastResetAt: new Date(),
            },
            update: {
                serpApiUsed: type === 'serpApi' ? { increment: 1 } : undefined,
                serperUsed: type === 'serper' ? { increment: 1 } : undefined,
            }
        });
    } catch (e) {
        console.error(`[SERP] Failed to increment ${type} usage:`, e);
    }
}

export async function getSerpUsageFromDB() {
    try {
        const usage = await (prisma as any).systemUsage.findUnique({
            where: { id: 'system' }
        });
        return {
            serpApiUsed: usage?.serpApiUsed || 0,
            serperUsed: usage?.serperUsed || 0
        };
    } catch (e) {
        return { serpApiUsed: 0, serperUsed: 0 };
    }
}

// Keep aliases for compatibility but mark as deprecated if needed
export function getSerpApiUsage() { return 0; } // Will use DB instead
export function getSerperUsage() { return 0; }
export function resetUsageCounters() { /* Handled via DB */ }

export interface SerpAnalysisResult {
    headlinePatterns: string[];
    contentGaps: string[];
    topDomains: string[];
    averageTitleLength: number;
    source: 'Serper' | 'SerpAPI' | 'Heuristic';
}

// ============================================
// 1. Primary Strategy: Serper.dev
// ============================================
async function fetchSerper(keyword: string) {
    try {
        const res = await fetch("https://google.serper.dev/search", {
            method: "POST",
            headers: {
                "X-API-KEY": SERPER_API_KEY,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ q: keyword, gl: "us", hl: "en", num: 10 })
        });
        if (!res.ok) return null;

        const data = await res.json();
        if (!data.organic || data.organic.length === 0) return null;

        // Track successful Serper usage
        await incrementApiUsage('serper');
        console.log(`[SERP] Serper API used.`);

        return {
            results: data.organic, // Uniform format
            source: 'Serper' as const
        };
    } catch (e) {
        return null; // Fail silently to trigger fallback
    }
}

// ============================================
// 2. Secondary Strategy: SerpAPI (Backup)
// ============================================
async function fetchSerpApi(keyword: string) {
    try {
        const url = `https://serpapi.com/search.json?q=${encodeURIComponent(keyword)}&api_key=${SERP_API_KEY}&num=10&hl=en&gl=us`;
        const res = await fetch(url);
        if (!res.ok) return null;

        const data = await res.json();
        if (!data.organic_results || data.organic_results.length === 0) return null;

        // Track successful SerpAPI usage
        await incrementApiUsage('serpApi');
        console.log(`[SERP] SerpAPI used.`);

        return {
            results: data.organic_results, // Uniform format
            source: 'SerpAPI' as const
        };
    } catch (e) {
        return null;
    }
}

// ============================================
// 3. Fallback Strategy: Heuristic (Last Resort)
// ============================================
function heuristicAnalysis(keyword: string): SerpAnalysisResult {
    const patterns = [];
    const gaps = [];
    const lower = keyword.toLowerCase();
    const currentYear = new Date().getFullYear();

    // Heuristic Logic Pattern Matching
    if (lower.includes("best") || lower.includes("top")) {
        patterns.push(`Listicle format (Top 10, Best 5)`);
        patterns.push(`Year included (${currentYear})`);
    } else if (lower.includes("how to") || lower.includes("guide")) {
        patterns.push("Step-by-step Guides");
    } else if (lower.includes("compare") || lower.includes("vs")) {
        patterns.push("Direct Comparison");
    } else {
        patterns.push("General Information / Definition");
    }

    // Heuristic Gaps
    if (!lower.includes("cost")) gaps.push("Detailed Cost Breakdown");
    if (!lower.includes("problem")) gaps.push("Common Mistakes");
    gaps.push("Personal Experience / Case Study");

    return {
        headlinePatterns: patterns,
        contentGaps: gaps,
        topDomains: ["investopedia.com", "medicare.gov", "nerdwallet.com"],
        averageTitleLength: 55,
        source: 'Heuristic'
    };
}

// ============================================
// MAIN ANALYZER FUNCTION
// ============================================
export async function analyzeSERP(keyword: string): Promise<SerpAnalysisResult> {
    // Stage 1: Try SerpApi First (Monthly Reset Credentials) - Cost Optimization
    // "1순위: SerpApi (매월 리셋되는 100~250회 활용)"
    let rawData: { results: any[], source: 'Serper' | 'SerpAPI' } | null = await fetchSerpApi(keyword);

    // Stage 2: If SerpApi fails, Switch to Serper.dev (Emergency Fund)
    // "2순위: Serper.dev (2,500회 비상금 활용)"
    if (!rawData) {
        // console.log(`[SERP] SerpApi failed, switching to Serper.dev for ${keyword}`);
        rawData = await fetchSerper(keyword);
    }

    // Stage 3: If both fail, use Heuristic
    if (!rawData) {
        console.warn(`[SERP] Both APIs failed. Using Heuristic for ${keyword}`);
        const suggestions = await fetchGoogleSuggest(keyword); // Enhance heuristic with suggestions
        return heuristicAnalysis(keyword);
    }

    // ============================================
    // DATA PROCESSING (Common Logic)
    // ============================================
    const { results, source } = rawData;
    const titles: string[] = results.map((r: any) => r.title || "");
    const snippets: string[] = results.map((r: any) => r.snippet || "");
    const links: string[] = results.map((r: any) => r.link || "");
    const allText = [...titles, ...snippets].join(" ").toLowerCase();

    const patterns: string[] = [];
    const gaps: string[] = [];
    const lowerKeyword = keyword.toLowerCase();
    const currentYear = new Date().getFullYear();

    // A. Headline Patterns
    const yearsFound = titles.filter(t => t.includes(String(currentYear)) || t.includes(String(currentYear + 1))).length;
    if (yearsFound > 3) patterns.push(`${currentYear}년 최신 정보 강조`);

    const listicles = titles.filter(t => /^\d+|Top \d+|Best \d+/i.test(t)).length;
    if (listicles > 2) patterns.push("리스트형/숫자 제목 (예: Top 10)");

    const guides = titles.filter(t => /Guide|How to|Tutorial/i.test(t)).length;
    if (guides > 3) patterns.push("가이드/튜토리얼 형식");

    // B. Content Gaps (Enhanced with Snippet Analysis)
    // 1. Cost/Price Analysis
    const hasCostInfo = /cost|price|fee|premium|rates|\$|\d+(k|m)/i.test(allText);
    if (!hasCostInfo && !lowerKeyword.includes("free") && !lowerKeyword.includes("login")) {
        gaps.push("실질적인 비용/가격 분석(구체적 수치) 및 표(Table) 부족");
    }

    // 2. Personal Experience (E-E-A-T)
    const hasExperience = /i tried|my experience|we tested|review|case study|mistakes/i.test(allText);
    if (!hasExperience) {
        gaps.push("직접 겪은 경험담이나 솔직한 테스트 후기 부족");
    }

    // 3. Visuals / Video
    if (!/video|watch|youtube|infographic|diagram/i.test(allText)) {
        gaps.push("설명을 돕는 시각 자료(영상/인포그래픽) 부재");
    }

    // 4. Tools / Calculators
    if (!/calculator|tool|estimator/i.test(allText) && /insurance|tax|loan|payment|mortgage/i.test(keyword)) {
        gaps.push("예상 비용 계산기나 견적 시뮬레이션 도구 부재");
    }

    // 5. [New] SGE Optimization: Check for Tables
    // Check if "table" is mentioned or structurally implied
    const hasTable = /table|chart|comparison|vs|breakdown/i.test(allText);

    if (!hasTable) {
        gaps.push("한눈에 보는 비교 분석 표(Table)가 없음 (SGE 필수)");
    }

    // 6. Downloadable Assets
    if (!/pdf|checklist|template|download/i.test(allText) && /guide|how to|process/i.test(keyword)) {
        gaps.push("다운로드 가능한 PDF 체크리스트나 요약 자료 없음");
    }

    if (gaps.length === 0) {
        gaps.push("최신 정보(2025/2026) 업데이트 부족");
        gaps.push("초보자도 이해하기 쉬운 설명 부족");
    }

    // C. Top Domains
    const topDomains = links.slice(0, 5).map(link => {
        try {
            return new URL(link).hostname.replace('www.', '');
        } catch { return link; }
    });

    const avgLen = Math.round(titles.reduce((acc: number, t: string) => acc + t.length, 0) / titles.length) || 55;

    return {
        headlinePatterns: patterns.length > 0 ? patterns : ["Mixed intent"],
        contentGaps: gaps,
        topDomains,
        averageTitleLength: avgLen,
        source
    };
}
