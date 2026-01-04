import { buildMasterPrompt } from "../lib/generation/prompt-builder";
import OpenAI from "openai";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

dotenv.config({ path: ".env.local" });

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

async function runTest() {
    console.log("🚀 Starting End-to-End Generation Validation...");

    const testKeyword = "Medicare Part A Costs 2024";

    try {
        const systemPrompt = await buildMasterPrompt({
            topic: testKeyword,
            focusKeyword: testKeyword,
        });

        console.log("📝 System Prompt Built. Requesting Completion...");

        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `Topic: "${testKeyword}". Write a comprehensive, SEO-optimized blog post in English. Remember to use 3 newlines before H2 headers.` }
            ],
            temperature: 0.7,
            max_tokens: 8192,
        });

        const content = response.choices[0]?.message?.content || "";

        // Save output for analysis
        const outputPath = path.join(process.cwd(), "test-output.md");
        fs.writeFileSync(outputPath, content);
        console.log(`✅ Generation Complete. Saved to ${outputPath}`);

        // --- AUTOMATED EVALUATION ---
        console.log("\n🔍 Analyzing Compliance...");
        const results = {
            languageIsEnglish: !/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(content), // Just check for NO Korean
            hasMetaBlock: content.includes("<!--") && content.includes("META TITLE"),
            hasH1: content.includes("# "),
            h2Count: (content.match(/^[ \t]*## /gm) || []).length,
            hasTable: content.includes("|") && content.includes("---"),
            hasChecklist: content.includes("☐") || content.includes("[ ]"),
            hasFAQ: content.toLowerCase().includes("frequently asked questions") || content.toLowerCase().includes("faq"),
            wordCount: content.split(/\s+/).length,
            hasPersonaTouch: content.includes("$") && (content.includes("I ") || content.includes("my ")),
            hasExtraWhitespace: content.includes("\n\n\n## "), // Check for at least one H2 with triple breaks
        };

        console.table(results);

        const failures = [];
        if (!results.languageIsEnglish) failures.push("Language should be English but seems to contain Korean characters.");
        if (!results.hasMetaBlock) failures.push("Missing Meta Data block at the top.");
        if (results.h2Count < 8) failures.push(`Insufficient H2 sections: found ${results.h2Count}, need 8-12.`);
        if (!results.hasTable) failures.push("Missing comparison table.");
        if (!results.hasExtraWhitespace) failures.push("Missing extra vertical whitespace (3 newlines) before H2 headings.");
        if (results.wordCount < 1000) failures.push(`Content too short: ${results.wordCount} words (Target 2000+)`);

        if (failures.length > 0) {
            console.log("\n❌ FAILURES DETECTED:");
            failures.forEach(f => console.log(`- ${f}`));
            process.exit(1);
        } else {
            console.log("\n✨ ALL CORE CRITERIA MET!");
            process.exit(0);
        }

    } catch (error) {
        console.error("❌ Test Failed:", error);
        process.exit(1);
    }
}

runTest();
