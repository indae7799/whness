
require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function test() {
    const key = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_STUDIO_API_KEY;
    console.log("Checking Gemini API Key...");

    if (!key) {
        console.error("❌ No Google/Gemini API Key found in env");
        console.log("Available Keys:", Object.keys(process.env).filter(k => k.includes("API")));
        return;
    }

    console.log(`✅ Key found: ${key.substring(0, 5)}...`);

    try {
        const genAI = new GoogleGenerativeAI(key);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

        console.log("Calling Gemini 2.0 Flash Exp...");
        const result = await model.generateContent("Hello.");
        console.log("Response:", result.response.text());
        console.log("✅ Google API works!");
    } catch (e) {
        console.error("❌ Google API Error:", e.message);
        if (e.message.includes("429")) console.log("👉 Rate Limit Hit.");
        if (e.message.includes("403")) console.log("👉 Key is invalid or has no permissions.");
        if (e.message.includes("404")) console.log("👉 Model not found (check model name).");
    }
}

test();
