
require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function test() {
    const key = process.env.GOOGLE_API_KEY;
    console.log("Checking Google API Key...");

    if (!key) {
        console.error("❌ GOOGLE_API_KEY is missing in process.env");
        console.log("Current Env Keys:", Object.keys(process.env).filter(k => k.includes("API")));
        return;
    }

    console.log(`✅ Key found: ${key.substring(0, 5)}... (Length: ${key.length})`);

    try {
        const genAI = new GoogleGenerativeAI(key);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

        console.log("Calling Gemini 2.0 Flash Exp (Test)...");
        const result = await model.generateContent("Hello, just checking if you are online. Please reply with 'Online'.");
        const text = result.response.text();

        console.log("✅ Response received:", text);
        console.log("✅ Google API is WORKING.");
    } catch (e) {
        console.error("❌ Google API Failure:", e.toString());
        if (e.message.includes("429")) {
            console.error("Reason: Rate Limit Exceeded (Quota exhausted or too fast).");
        } else if (e.message.includes("403") || e.message.includes("API key")) {
            console.error("Reason: Invalid API Key or Permissions.");
        }
    }
}

test();
