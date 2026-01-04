
require('dotenv').config();

const KEY = process.env.OPENROUTER_API_KEY;
// Updated list from models.md analysis
const MODELS = [
    "google/gemini-2.0-flash-exp:free",
    "meta-llama/llama-3.3-70b-instruct:free",
    "google/gemma-3-27b-it:free",
    "qwen/qwen3-coder:free",
    "tngtech/deepseek-r1t-chimera:free",
    "mistralai/mistral-small-3.1-24b-instruct:free",
    "deepseek/deepseek-r1-distill-llama-70b:free", // trying this too
    "microsoft/phi-3-mini-128k-instruct:free"
];

async function check() {
    console.log("🔍 Checking NEW Free Models Availability...");

    if (!KEY) {
        console.error("❌ OPENROUTER_API_KEY is missing!");
        return;
    }

    let workingModel = null;

    for (const model of MODELS) {
        process.stdout.write(`Testing ${model}... `);
        try {
            const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${KEY}`,
                    "Content-Type": "application/json",
                    "HTTP-Referer": "http://localhost:3000",
                },
                body: JSON.stringify({
                    model: model,
                    messages: [{ role: "user", content: "Say OK." }],
                    max_tokens: 5
                })
            });

            if (res.ok) {
                const data = await res.json();
                console.log(`✅ WORKS! Response: ${data.choices[0]?.message?.content?.trim()}`);
                workingModel = model;
                // Don't break immediately, try to find more options
            } else {
                console.log(`❌ FAILED (${res.status})`);
            }
        } catch (e) {
            console.log(`❌ ERROR: ${e.message}`);
        }
    }

    console.log("\n--- TEST SUMMARY ---");
    if (workingModel) {
        console.log(`🎉 There are working models! Please select one of the successful models in Autopilot settings.`);
    } else {
        console.log("😭 All tested models are down. It is an OpenRouter outage for free tier.");
    }
}

check();
