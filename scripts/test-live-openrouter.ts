
import { callOpenRouter } from "../lib/openrouter";
import * as dotenv from "dotenv";

dotenv.config();

async function testLiveGeneration() {
    console.log("🚀 Starting LIVE Generation Test (OpenRouter)...");
    console.log("------------------------------------------------");

    // Test Variables
    const modelId = "meta-llama/llama-3.3-70b-instruct:free";
    const topic = "Medicare Enrollment Periods 2025";
    const systemPrompt = "You are a helpful SEO blog writer. Write in Markdown.";
    const userPrompt = `Write a short blog post about "${topic}". Include H2 headers and a list.`;

    try {
        console.log(`📡 Calling Model: ${modelId}`);
        const start = Date.now();

        // Simulate what services/content.ts does
        const result = await callOpenRouter(modelId, [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
        ]);

        const duration = (Date.now() - start) / 1000;
        console.log(`\n✅ Response Received in ${duration.toFixed(2)}s`);
        console.log("------------------------------------------------");
        console.log(result.substring(0, 500) + "..."); // Show first 500 chars
        console.log("------------------------------------------------");

        // Check if it's Mock
        if (result.includes("SYSTEM NOTICE: This is a fallback mock")) {
            console.error("❌ FAILURE: Received MOCK CONTENT instead of real AI generation.");
            console.error("👉 This means the API call failed (429/400/500). Check logs above.");
            process.exit(1);
        } else {
            console.log("✨ SUCCESS: Received REAL content from AI!");
            console.log("👉 If this works here but not on Web, RESTART your Next.js server.");
        }

    } catch (error) {
        console.error("❌ CRITICAL ERROR:", error);
    }
}

testLiveGeneration();
