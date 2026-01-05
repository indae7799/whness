
// Real-time Data Fetcher for Keyword Research

// Configuration
const WAIT_TIME_MS = 200; // Delay between requests to avoid rate limiting
const LANG = "en";

// Character list for alphabet expansion (space + a-z + 0-9)
const CHAR_LIST = [
    " ", "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m",
    "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z",
    "0", "1", "2", "3", "4", "5", "6", "7", "8", "9"
];

// Helper: Delay function
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// 1. Google Autocomplete - Basic (Single Query)
export async function fetchGoogleSuggest(term: string): Promise<string[]> {
    try {
        // Using www.google.com endpoint (more reliable than suggestqueries)
        const url = `https://www.google.com/complete/search?client=firefox&hl=${LANG}&q=${encodeURIComponent(term)}`;
        const res = await fetch(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            }
        });
        if (!res.ok) return [];

        const data = await res.json();
        // data[0] = original query, data[1] = suggestions array
        return data[1] || [];
    } catch (e) {
        console.warn(`[Fetcher] Google Suggest failed for ${term}:`, e);
        return [];
    }
}

// 1b. Google Autocomplete - Expanded (Alphabet + Number Expansion)
// This technique appends a-z and 0-9 to the query to extract more long-tail keywords
export async function fetchGoogleSuggestExpanded(term: string, maxChars: number = 10): Promise<string[]> {
    const allSuggestions = new Set<string>();

    // Limit characters to avoid too many requests
    const charsToUse = CHAR_LIST.slice(0, maxChars);

    for (const char of charsToUse) {
        const query = `${term} ${char}`.trim();
        try {
            const url = `https://www.google.com/complete/search?client=firefox&hl=${LANG}&q=${encodeURIComponent(query)}`;
            const res = await fetch(url, {
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
                }
            });

            if (res.ok) {
                const data = await res.json();
                const suggestions = data[1] || [];
                suggestions.forEach((s: string) => allSuggestions.add(s));
            }

            // Rate limiting to avoid blocks
            await delay(WAIT_TIME_MS);
        } catch (e) {
            // Continue on error
        }
    }

    return Array.from(allSuggestions).sort();
}

// 1c. Question Keywords - Specifically targets question-based long-tails
const QUESTION_PREFIXES = [
    "what is", "how to", "how does", "can I", "do I need",
    "when should", "why does", "is it", "what are the",
    "who can", "where to", "which is better"
];

export async function fetchQuestionKeywords(term: string): Promise<string[]> {
    const allQuestions = new Set<string>();

    // Only use first 5 prefixes to limit requests
    for (const prefix of QUESTION_PREFIXES.slice(0, 5)) {
        const query = `${prefix} ${term}`;
        try {
            const suggestions = await fetchGoogleSuggest(query);
            suggestions.forEach(s => {
                // Filter for actual question-like content
                if (
                    s.includes("?") ||
                    s.toLowerCase().startsWith("what") ||
                    s.toLowerCase().startsWith("how") ||
                    s.toLowerCase().startsWith("can") ||
                    s.toLowerCase().startsWith("do") ||
                    s.toLowerCase().startsWith("is") ||
                    s.toLowerCase().startsWith("why") ||
                    s.toLowerCase().startsWith("when") ||
                    s.toLowerCase().startsWith("who") ||
                    s.toLowerCase().startsWith("where") ||
                    s.toLowerCase().startsWith("which")
                ) {
                    allQuestions.add(s);
                }
            });
            await delay(WAIT_TIME_MS);
        } catch (e) {
            // Continue on error
        }
    }

    return Array.from(allQuestions);
}


// 2. Reddit Search (Trends & Questions)
export async function fetchReddit(term: string): Promise<string[]> {
    try {
        // Search in a relevant subreddit (e.g., Medicare, Insurance, PersonalFinance) or global
        const url = `https://www.reddit.com/search.json?q=${encodeURIComponent(term)}&sort=relevance&limit=5`;
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        if (!res.ok) return [];

        const data = await res.json();
        const posts = data.data.children;
        return posts.map((post: any) => post.data.title);
    } catch (e) {
        console.warn(`[Fetcher] Reddit fetch failed for ${term}:`, e);
        return [];
    }
}

// 3. Wikipedia OpenSearch (Definitions & Concepts)
export async function fetchWikipedia(term: string): Promise<string[]> {
    try {
        const url = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(term)}&limit=5&namespace=0&format=json`;
        const res = await fetch(url);

        if (!res.ok) return [];

        const data = await res.json();
        // data[1] contains titles
        return data[1] || [];
    } catch (e) {
        console.warn(`[Fetcher] Wikipedia fetch failed for ${term}:`, e);
        return [];
    }
}

// 4. Reddit Trending (For Fresh Seeds - engagement filtered)
export async function fetchRedditTrending(subreddit: string = "medicare", limit: number = 10): Promise<string[]> {
    try {
        // Fetch 'Hot' posts from the subreddit
        // Increased limit to allow for filtering
        const url = `https://www.reddit.com/r/${subreddit}/hot.json?limit=${limit}`;
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        if (!res.ok) return [];

        const data = await res.json();
        const posts = data.data.children;

        // Filter Logic:
        // 1. Must not be sticky (pinned posts are usually rules, not trends)
        // 2. Engagement: Score > 5 OR Comments > 2 (Active discussions)
        const activePosts = posts.filter((p: any) => {
            const d = p.data;
            return !d.stickied && (d.score > 5 || d.num_comments > 2);
        });

        return activePosts.map((post: any) => post.data.title);
    } catch (e) {
        console.warn(`[Fetcher] Reddit Trending fetch failed for r/${subreddit}:`, e);
        return [];
    }
}

// 5. Reddit Relevance Search (Connecting Seeds to Reality)
// Searches for a specific seed term in Reddit and returns HIGH ENGAGEMENT titles
export async function fetchRedditRelevant(query: string, limit: number = 5): Promise<string[]> {
    try {
        // Search globally or in specific subreddits (Global is better for broad reach)
        // sort=Relevance, t=month (Past Month = Freshness)
        const url = `https://www.reddit.com/search.json?q=${encodeURIComponent(query)}&sort=relevance&t=month&limit=${limit}`;

        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        if (!res.ok) return [];

        const data = await res.json();
        const posts = data.data.children;

        // Filter: High Engagement Only
        // We want topics that people are actually discussing related to your key
        const engagingPosts = posts.filter((p: any) => p.data.num_comments > 5 || p.data.score > 10);

        return engagingPosts.map((p: any) => p.data.title);
    } catch (e) {
        // console.warn(`[Fetcher] Reddit Relevant fetch failed for ${query}`);
        return [];
    }
}

// 6. Google Trends RSS (Real-Time Daily Trends)
// Fetches daily trending searches for US to inject "Hot Issues"
export async function fetchGoogleTrendsDaily(geo: string = "US"): Promise<string[]> {
    try {
        const url = `https://trends.google.com/trends/trendingsearches/daily/rss?geo=${geo}`;
        const res = await fetch(url);
        if (!res.ok) return [];

        const xmlText = await res.text();

        // Simple XML parsing to find <title> inside <item>
        // We avoid heavy XML parsers to keep it lightweight
        const items = xmlText.split("<item>");
        const trends: string[] = [];

        // Skip the first chunk (channel metadata)
        for (let i = 1; i < items.length; i++) {
            const item = items[i];
            const titleMatch = item.match(/<title>(.*?)<\/title>/);
            if (titleMatch && titleMatch[1]) {
                trends.push(titleMatch[1]);
            }
        }

        return trends;
    } catch (e) {
        console.warn(`[Fetcher] Google Trends RSS failed:`, e);
        return [];
    }
}

// 7. People Also Ask (PAA) - Uses SerpAPI or Fallback
export interface PAAResult {
    question: string;
    snippet?: string;
    source?: string;
}

export async function fetchPeopleAlsoAsk(query: string): Promise<PAAResult[]> {
    const serpApiKey = process.env.SERPAPI_KEY;

    // Method 1: SerpAPI (Best quality, requires API key)
    if (serpApiKey) {
        try {
            const url = `https://serpapi.com/search.json?q=${encodeURIComponent(query)}&api_key=${serpApiKey}&engine=google&hl=en&gl=us`;
            const res = await fetch(url);

            if (!res.ok) {
                console.warn(`[Fetcher] SerpAPI failed: ${res.status}`);
                return await fetchPAAFallback(query);
            }

            const data = await res.json();

            // Extract People Also Ask
            const paa = data.related_questions || [];
            return paa.map((item: any) => ({
                question: item.question,
                snippet: item.snippet,
                source: item.source?.name || "Google"
            }));
        } catch (e) {
            console.warn(`[Fetcher] SerpAPI error:`, e);
            return await fetchPAAFallback(query);
        }
    }

    // Method 2: Fallback - Use our enhanced question keywords fetcher
    return await fetchPAAFallback(query);
}

// Fallback PAA: Use the enhanced fetchQuestionKeywords function
async function fetchPAAFallback(query: string): Promise<PAAResult[]> {
    try {
        const questions = await fetchQuestionKeywords(query);

        if (questions.length > 0) {
            return questions.slice(0, 6).map(q => ({
                question: q,
                source: "Google Suggest"
            }));
        }
    } catch (e) {
        console.warn(`[Fetcher] PAA Fallback failed for ${query}:`, e);
    }

    // Ultimate fallback: Generate common patterns
    const commonQuestions = [
        `What is ${query}?`,
        `How does ${query} work?`,
        `How much does ${query} cost?`,
        `Who is eligible for ${query}?`,
        `When should I apply for ${query}?`
    ];
    return commonQuestions.map(q => ({ question: q, source: "Generated" }));
}

// 8. StackExchange Search (Expert Q&A)
export interface StackExchangeResult {
    title: string;
    link: string;
    score: number;
    answerCount: number;
    tags: string[];
}

export async function fetchStackExchange(
    query: string,
    site: string = "medicalsciences"
): Promise<StackExchangeResult[]> {
    try {
        const stackKey = process.env.STACKEXCHANGE_KEY || "";
        const keyParam = stackKey ? `&key=${stackKey}` : "";

        const url = `https://api.stackexchange.com/2.3/search/advanced?site=${site}&q=${encodeURIComponent(query)}&pagesize=5&sort=activity&order=desc&filter=withbody${keyParam}`;

        const res = await fetch(url);
        if (!res.ok) return [];

        const data = await res.json();
        const items = data.items || [];

        return items.map((item: any) => ({
            title: item.title,
            link: item.link,
            score: item.score || 0,
            answerCount: item.answer_count || 0,
            tags: item.tags || []
        }));
    } catch (e) {
        console.warn(`[Fetcher] StackExchange failed for ${query}:`, e);
        return [];
    }
}

// 9. Aggregate Related Questions (Combines PAA + Reddit Questions)
export async function fetchRelatedQuestions(query: string): Promise<string[]> {
    const [paaResults, redditResults] = await Promise.all([
        fetchPeopleAlsoAsk(query),
        fetchRedditRelevant(query + " question", 5)
    ]);

    // Extract questions from PAA
    const paaQuestions = paaResults.map(r => r.question);

    // Filter Reddit titles that look like questions
    const redditQuestions = redditResults.filter(title =>
        title.includes("?") ||
        title.toLowerCase().startsWith("how") ||
        title.toLowerCase().startsWith("what") ||
        title.toLowerCase().startsWith("can") ||
        title.toLowerCase().startsWith("should")
    );

    // Combine and deduplicate
    const allQuestions = [...new Set([...paaQuestions, ...redditQuestions])];

    return allQuestions.slice(0, 10);
}

