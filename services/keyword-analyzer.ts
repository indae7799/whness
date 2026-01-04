
import { callGoogleGenAI } from "@/lib/google"
import { callOpenRouter } from "@/lib/openrouter"

export interface KeywordAnalysis {
    bestKeyword: string
    reasoning: string
    candidates: {
        keyword: string
        score: number
        intent: string
    }[]
}

export class KeywordAnalyzer {

    // Strategy: Rule-based generation (No API required)
    // This allows the system to generate SEO keywords even when AI APIs are down/limited.
    async analyzeKeywords(seed: string): Promise<KeywordAnalysis> {
        console.log(`[KeywordAnalyzer] Generating Long-tail Keywords for: "${seed}" (Rule-based Mode)`)

        // 1. Define Patterns for SEO Long-tail
        const year = new Date().getFullYear();
        const nextYear = year + 1;

        // Clean seed
        const cleanSeed = seed.trim().toLowerCase();

        // SEO Templates
        const templates = [
            `complete guide to ${cleanSeed} ${year}`,
            `${cleanSeed} requirements and eligibility ${year}`,
            `how to apply for ${cleanSeed} online`,
            `${cleanSeed} cost breakdown ${year}`,
            `best ${cleanSeed} options for seniors`,
            `${cleanSeed} open enrollment period deadline`,
            `${cleanSeed} vs private insurance comparison`,
            `${cleanSeed} income limits and qualifications`,
            `common mistakes to avoid with ${cleanSeed}`,
            `${cleanSeed} coverage benefits 2025`,
            `${cleanSeed} application walkthrough step by step`,
            `is ${cleanSeed} worth it in ${year}?`
        ];

        // 2. Select a Random Pattern
        // Use a pseudo-random selection to vary the output slightly/randomly
        const randomIndex = Math.floor(Math.random() * templates.length);
        const bestKeyword = templates[randomIndex];
        console.log(`[KeywordAnalyzer] Selected Top Keyword: "${bestKeyword}"`);

        // 3. Generate Candidates (return a subset)
        const candidates = templates.slice(0, 5).map(p => ({
            keyword: p,
            score: 85 + Math.floor(Math.random() * 10), // Simulated score
            intent: "informational"
        }));

        return {
            bestKeyword: bestKeyword,
            reasoning: "Generated via Rule-based SEO Patterns (API Independent)",
            candidates: candidates
        }
    }
}
