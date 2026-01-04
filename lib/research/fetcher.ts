
// Real-time Data Fetcher for Keyword Research

// 1. Google Autocomplete (The Goldmine for Long-tail)
export async function fetchGoogleSuggest(term: string): Promise<string[]> {
    try {
        const url = `http://suggestqueries.google.com/complete/search?client=chrome&q=${encodeURIComponent(term)}`;
        const res = await fetch(url);
        if (!res.ok) return [];

        const data = await res.json();
        // date[1] contains the suggestions array
        return data[1] || [];
    } catch (e) {
        console.warn(`[Fetcher] Google Suggest failed for ${term}:`, e);
        return [];
    }
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
