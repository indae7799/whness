
import { callOpenRouter } from "../lib/openrouter";
import { buildMasterPrompt } from "../lib/generation/prompt-builder";
import * as dotenv from "dotenv";
import * as fs from "fs";

dotenv.config();

async function testFullQuality() {
    console.log("🚀 Starting FULL QUALITY Generation Test...");
    console.log("------------------------------------------------");

    // Scenario: Medicare Topic (User's interest)
    const topic = "Medicare Advantage Enrollment Periods 2025";
    const keyword = "medicare advantage enrollment periods";

    try {
        console.log("📝 Building Master Prompt from blog-prompt.md...");
        const fullPrompt = await buildMasterPrompt({
            topic: topic,
            focusKeyword: keyword,
            persona: { description: "34-year-old New Yorker, experienced but friendly tone" }
        });

        console.log(`📡 Calling Llama 3.3 70B (Prompt Length: ${fullPrompt.length} chars)...`);

        const modelId = "meta-llama/llama-3.3-70b-instruct:free";

        const start = Date.now();
        const content = await callOpenRouter(modelId, [
            { role: "system", content: "You are a professional SEO blog writer. Write in Markdown." },
            { role: "user", content: fullPrompt }
        ]);

        const duration = (Date.now() - start) / 1000;
        console.log(`\n✅ Generated in ${duration.toFixed(2)}s`);

        // Save to file for inspection
        fs.writeFileSync("final-quality-check.md", content);
        console.log("💾 Saved output to: final-quality-check.md");

        // Brief Quality Check
        console.log("------------------------------------------------");
        console.log("Title found:", content.match(/^# .+/m)?.[0] || "No H1");
        console.log("Word Count (approx):", content.split(/\s+/).length);
        console.log("Has Table:", content.includes("|") && content.includes("---"));
        console.log("Has Checklist:", content.includes("☐"));
        console.log("Is Mock?:", content.includes("SYSTEM NOTICE") ? "YES (FAIL)" : "NO (PASS)");
        console.log("------------------------------------------------");

    } catch (error) {
        console.error("❌ ERROR:", error);
    }
}

testFullQuality();
