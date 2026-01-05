
import { TEXT_MODELS } from "./config/models"

const MOCK_WAIT_MS = 2000

export async function callOpenRouter(
    modelId: string,
    messages: { role: string; content: string }[],
    options: {
        maxTokens?: number
        temperature?: number
    } = {}
): Promise<string> {
    const apiKey = process.env.OPENROUTER_API_KEY
    const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const siteName = "Whness Blog Automation"

    // Default to a known working model if empty
    const targetModel = modelId || "meta-llama/llama-3.3-70b-instruct:free"

    try {
        if (!apiKey) {
            console.warn("[OpenRouter] No API Key found, using Mock Fallback.")
            return await mockFallback(messages)
        }

        console.log(`[OpenRouter] 🚀 Calling Model: ${targetModel}`)
        console.log(`[OpenRouter] 📦 Payload: ${messages.length} messages`)
        if (messages.length > 0) {
            console.log(`[OpenRouter] 📝 System Prompt Length: ${messages[0].content.length}`)
            if (messages[1]) console.log(`[OpenRouter] 👤 User Prompt Length: ${messages[1].content.length}`)
        }

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "HTTP-Referer": siteUrl,
                "X-Title": siteName,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: targetModel,
                messages: messages,
                max_tokens: options.maxTokens || 8192,
                temperature: options.temperature || 0.7,
            })
        })

        if (!response.ok) {
            const rawError = await response.text()
            console.error(`[OpenRouter API Error] ❌ Status: ${response.status}`)
            console.error(`[OpenRouter API Error] 📄 Body: ${rawError}`)

            // 429 Rate Limit -> Use Mock
            if (response.status === 429) {
                console.warn("[OpenRouter] ⚠️ Rate Limit Exceeded (429). Switching to Mock Fallback.")
                return await mockFallback(messages)
            }
            if (response.status === 503 || response.status === 502) {
                console.warn("[OpenRouter] ⚠️ Service Unavailable. Switching to Mock Fallback.")
                return await mockFallback(messages)
            }

            throw new Error(`OpenRouter Error ${response.status}: ${rawError}`)
        }

        const data = await response.json()
        const content = data.choices[0]?.message?.content || ""

        if (!content) {
            throw new Error("Empty response from OpenRouter")
        }

        console.log(`[OpenRouter] ✅ Success! Received ${content.length} chars.`)
        return content

    } catch (error: any) {
        console.error("[OpenRouter] 💥 Request Failed:", error.message)
        // Fallback for any failure
        return await mockFallback(messages)
    }
}

async function mockFallback(messages: { role: string; content: string }[]): Promise<string> {
    console.log("[OpenRouter] 🎭 Using Mock Fallback (System Stabilizer)...")
    await new Promise(resolve => setTimeout(resolve, MOCK_WAIT_MS))

    // Extract prompt to understand intent
    let lastMessage = ""
    if (messages && messages.length > 0) {
        lastMessage = messages[messages.length - 1].content || ""
    }

    return generateMockContent(lastMessage)
}

// Fallback Mock Content Generator (High Quality)
function generateMockContent(prompt: string): string {
    // 1. JSON Request for Keyword Analyzer
    if (prompt.includes("JSON")) {
        // Extract seed if possible
        const seedMatch = prompt.match(/seed keyword: "(.*?)"/)
        const seed = seedMatch ? seedMatch[1] : "medicare"

        return JSON.stringify({
            bestKeyword: `${seed} coverage options 2025`,
            reasoning: "Selected based on high specificity and user intent for current year guide.",
            candidates: [
                { keyword: `${seed} coverage options 2025`, score: 95, intent: "informational" },
                { keyword: `how to apply for ${seed} online`, score: 88, intent: "guide" },
                { keyword: `${seed} eligibility requirements ny`, score: 82, intent: "informational" }
            ]
        })
    }

    // 2. Markdown Article Request
    // Extract topic estimate from prompt or default
    const topicMatch = prompt.match(/about "(.*?)"/)
    const topic = topicMatch ? topicMatch[1] : "Guide"

    // Extract focus keyword
    const keywordMatch = prompt.match(/focus keyword: "(.*?)"/) || prompt.match(/keyword: "(.*?)"/)
    const seed = keywordMatch ? keywordMatch[1] : (topicMatch ? topicMatch[1] : "Medicare Coverage")

    return `
<!-- 
META TITLE (50-60 chars): ${topic} Guide: ${seed} Costs & Coverage 2025
META DESCRIPTION (160 chars): Complete guide to ${topic} and ${seed}. Learn from my real experience in NYC to save money and avoid common mistakes.
URL SLUG: /${seed.replace(/\s+/g, '-')}-guide-2025/
FOCUS KEYWORD: ${seed}
-->

# ${topic}: My Honest 2025 Guide (Coverage & Costs)

**[SYSTEM NOTICE: This is a fallback mock article because the AI service is currently unavailable.]**

You know that feeling when you're staring at a problem and have zero idea where to start? Yeah, that was me last month with **${seed}**.

I'm a 34-year-old living in **Brooklyn, NY**, and I thought I had things figured out. But this threw me for a loop. After days of research and way too much coffee, I finally cracked the code.

Here is everything I learned—so you don't have to make the same mistakes I did.

[Image: A stressed person looking at insurance papers at a kitchen table in Brooklyn, high quality photo]

## Why This Matters (Real Talk)

First off, let's talk numbers. **I almost lost $1,200** because I didn't understand the details about ${seed}.

If you're reading this, you're probably stressed. I get it. My mom called me in a panic about this exact issue last year. We sat down at her kitchen table in Queens and went through it together.

### My "Aha!" Moment

I realized that **${seed}** isn't actually complicated—it's just explained poorly. Once you break it down, it's actually manageable.

## 3 Big Mistakes I Made

### 1. Ignoring the Fine Print
I skimmed the documents. Bad move. I missed a crucial deadline that cost me a week of stress.

### 2. Assuming Standard Rules
Every situation is different, especially in **New York**. What works in Jersey might not work here.

| Strategy | Cost | Effort | Savings |
| :--- | :--- | :--- | :--- |
| DIY Approach | $0 | High | Low |
| Professional Help | $150 | Low | High |
| **My Method** | **$0** | **Medium** | **Max** |

### 3. Not Asking for Help
I tried to do it all myself. A quick 15-minute call would have saved me 3 hours.

## Detailed Timeline & Costs

Here is exactly what you need to do, right now.

> "The best time to plant a tree was 20 years ago. The second best time is now."

### Step 1: Gather Information (Day 1)
Don't start without your facts. You'll need:
- Current status documents
- Financial records
- A clear timeline

### Step 2: Take Action (Day 2-3)
Do it on a **Tuesday morning**. Trust me, statistics show it's the best time to reach support centers.

[Image: A calendar with important dates circled, close up shot]

## Frequently Asked Questions

### Is this worth the effort?
Absolutely. The savings alone are worth it. I saved over **$2,500** annually.

### Can I do this online?
Most of it, yes. But sometimes a phone call is faster.

### How long does it take?
Give yourself about **2 hours total**. It's shorter than watching a movie.

### What if I miss the deadline?
You might face penalties. Act now.

## Quick Action Checklist

☐ Download the forms
☐ Check your eligibility status
☐ Schedule a reminder
☐ Submit before Friday

## Final Thoughts

Look, dealing with **${seed}** isn't fun. It's like finding a parking spot in Manhattan—stressful, but necessary.

But now that I'm on the other side, I feel so much lighter. You've got this. If I can do it, you definitely can.

Next Step: Go start Step 1 right now. You're ready.
`
}
