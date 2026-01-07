import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;

if (!API_KEY) {
    console.warn("Missing GOOGLE_API_KEY or GEMINI_API_KEY. AI Strategy will be disabled.");
}

const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

export interface ContentStrategy {
    differentiationAngle: string;
    opportunities: string[];
    risks: string[];
    successProbability: number;
    tactics: string[];
    recommendedTitle: string;
    targetPersona: string;
}

export async function generateAIStrategy(
    keyword: string,
    serpData: any,
    paa: string[],
    suggestions: string[] = []
): Promise<ContentStrategy | null> {
    if (!genAI) return null;

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

        const prompt = `
        You are a World-Class SEO Strategist & Content Editor planning for 2026 Google Algorithms.
        
        Analyze the following keyword data and develop a winning content strategy.
        
        KEYWORD: "${keyword}"
        
        CONTEXT:
        - SERP Gaps: ${serpData?.contentGaps?.join(", ") || "Unknown"}
        - People Also Ask: ${paa.join(", ")}
        
        YOUR TASK:
        Devise a strategy to rank #1. Focus on Information Gain, User Experience, and **Google SGE (AI Overview)** optimization.
        
        CRITICAL GOAL 1: LENGTH & DEPTH
        - The final article MUST be over 2,200 words.
        - Guide the writer to expand each section to 400+ words by adding specific statistics, case studies, and new perspectives (NO REPETITION/FLUFF).
        
        CRITICAL GOAL 2: 2026 SEO TACTICS (MANDATORY)
        1. **Snippet Bait (AI Overview)**: You MUST include a "Key Takeaways" summary or "Comparison Table" in the content. Place clear definitions (40-60 words) at section starts.
        2. **E-E-A-T Authority**: Use specific phrases like "Based on our analysis of 100+ cases" or "In our experience with [Topic]..." to prove legitimacy.
        3. **Structure**: Comparison Tables and Bullet Lists are MANDATORY for higher information gain.
        
        SUGGESTIONS TO TRANSLATE:
        ${(suggestions || []).slice(0, 10).join(", ")}

        OUTPUT JSON FORMAT ONLY:
        {
            "differentiationAngle": "Main unique angle (e.g. 'Personal failure story', '100+ Case Data Analysis')",
            "opportunities": ["Opp 1", "Opp 2", "Opp 3"],
            "risks": ["Risk 1", "Risk 2"],
            "successProbability": 85,
            "tactics": [
                "Expand each section to 400+ words using deep model knowledge",
                "Insert 'Snippet Bait' definitions (40-60 words) at section starts",
                "Include a 'Cost Comparison Table' for AI Overview capture",
                "Use 'In summary' or 'Key Takeaways' sections"
            ],
            "recommendedTitle": "Click-worthy H1 Title",
            "targetPersona": "Expert with real-world Medicare experience",
            "translatedSuggestions": {
                "Original English Title 1": "자연스러운 한국어 번역 1",
                "Original English Title 2": "자연스러운 한국어 번역 2"
            }
        }
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Parse JSON safely
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }

        return null;
    } catch (error) {
        console.error("AI Strategy Generation Failed:", error);
        return null;
    }
}
