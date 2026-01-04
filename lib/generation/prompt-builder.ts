import fs from "fs/promises"
import path from "path"

export interface PromptData {
    topic: string
    focusKeyword: string
    persona?: Record<string, any>
    referenceInfo?: Record<string, any>
    comparisonOptions?: any[]
    tone?: string
    sectionsToInclude?: string[]
}

export async function buildMasterPrompt(data: PromptData): Promise<string> {
    try {
        const promptPath = path.join(process.cwd(), "blog-prompt.md")
        let masterPromptTemplate = ""

        try {
            masterPromptTemplate = await fs.readFile(promptPath, "utf-8")
        } catch (error) {
            console.warn("Could not read blog-prompt.md, using embedded template.")
        }

        // Determine realistic persona based on topic type
        const isMedicareRelated = data.focusKeyword.toLowerCase().includes('medicare') ||
            data.focusKeyword.toLowerCase().includes('medigap')

        const personaContext = isMedicareRelated
            ? `You're a 30-something NYC professional who recently helped your aging PARENTS navigate Medicare. 
               You did all the research because they were confused by the system.
               Write from the perspective of someone who learned about "${data.focusKeyword}" 
               while helping mom/dad, NOT as someone personally on Medicare.
               Include phrases like: "When I was helping my mom enroll...", "My father's doctor recommended...",
               "I spent hours researching for my parents..."`
            : `You are a 30-something NYC professional who personally experienced dealing with "${data.focusKeyword}".
               Write from genuine FIRST-PERSON experience.`

        // CRITICAL: Human-like writing rules
        const humanWritingRules = `
## ⚠️ CRITICAL: WRITE LIKE A REAL HUMAN, NOT AI

### PERSONA & PERSPECTIVE
${personaContext}

### THE #1 RULE: FLOW LIKE A CONVERSATION
- Write like you're telling a friend about your experience over coffee
- DON'T write like a checklist or instruction manual
- DON'T number every single thing (Step 1, Step 2...)
- USE natural transitions: "Here's the thing...", "What I didn't expect was...", "Looking back..."

### STORYTELLING REQUIREMENTS
1. **Open with a HOOK**: Start with the moment of crisis/confusion
   - ✅ "The letter from Medicare arrived on a Tuesday. My mom was in tears."
   - ❌ "Medicare is an important healthcare program..."

2. **Show EMOTIONS throughout**:
   - ✅ "I was terrified I'd mess this up for my parents"
   - ✅ "The relief when it finally worked out..."
   - ❌ Generic facts without feelings

3. **Include MISTAKES you made**:
   - ✅ "My first mistake? I assumed all plans were the same."
   - ✅ "I wasted 3 weeks before realizing..."
   - ❌ Perfect advice without struggle

4. **Use CONVERSATIONAL language**:
   - ✅ "Here's the deal...", "Trust me on this one...", "Don't make my mistake..."
   - ❌ "It is important to note that...", "One should consider..."

### FORMATTING THAT FEELS NATURAL (NOT RIGID)
- Use H2s as natural story breaks, NOT numbered steps
- Bullets for lists, but NOT for every paragraph
- ONE comparison table where it makes sense (don't force it)
- FAQ should answer questions people ACTUALLY ask
- Skip the checklist if it doesn't fit naturally

### SPECIFIC DETAILS (REQUIRED)
- REAL dates: "Last November", "Two weeks before Christmas"
- REAL places: "CVS on 5th Ave", "Healthcare.gov at 2am"
- REAL money: "$189/month", "saved $1,247 total"
- REAL names: "Dr. Kim at NYU Langone", "Aetna Medicare Advantage"

### ABSOLUTELY FORBIDDEN
❌ Starting with generic definitions ("Medicare is a federal program...")
❌ Numbered steps for everything (Step 1, Step 2, Step 3...)
❌ Phrases like "In conclusion", "To summarize", "It's important to note"
❌ Perfect knowledge without learning curve
❌ Korean text anywhere
❌ AI-sounding phrases: "comprehensive guide", "essential tips", "everything you need to know"
`

        const userInput = `
---

**TOPIC**: "${data.topic || data.focusKeyword}"
**FOCUS KEYWORD**: "${data.focusKeyword}"

**YOUR MISSION**: 
Write a 2,200-2,500 word blog post that feels like a REAL person sharing their experience, NOT an AI article.
The reader should think "this person really went through this" - not "this is AI-generated SEO content."

**KEYWORD STRATEGY**:
- **Focus Keyword**: "${data.focusKeyword}"
- **Density**: Use natural language. Do NOT stuff keywords. Target ~1.5-1.8% density.
- **Placement**: H1, first paragraph, one H2, and conclusion. No more.
- **Long-tail**: Use variations like "${data.focusKeyword} options", "how to ${data.focusKeyword}", etc.

**OUTPUT FORMAT**: 
WordPress-ready Markdown. Start with a hook, not meta data.
`

        // Combine: Human writing rules + blog-prompt template (shortened) + user input
        return `${humanWritingRules}\n\n${masterPromptTemplate.substring(0, 2000)}\n\n${userInput}`
    } catch (error) {
        console.error("Error building prompt:", error)
        throw error
    }
}
