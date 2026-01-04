
const path = require('path')
require('dotenv').config({ path: path.resolve(process.cwd(), '.env') }) // Try .env first
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') }) // Override with local

import { KeywordAnalyzer } from "../services/keyword-analyzer"
import { generateBlogImage } from "../services/image"
import { DEFAULT_TEXT_MODEL, DEFAULT_IMAGE_MODEL } from "../lib/config/models"

async function testModules() {
    console.log("=== TESTING KEYWORD ANALYZER ===")
    try {
        const analyzer = new KeywordAnalyzer(DEFAULT_TEXT_MODEL.id)
        const seed = "medicare"
        console.log(`Analyzing seed: ${seed}...`)
        const result = await analyzer.analyzeKeywords(seed)

        console.log("✅ Golden Keyword:", result.bestKeyword)
        console.log("💡 Reasoning:", result.reasoning)

        if (result.bestKeyword === seed) {
            console.warn("⚠️ Fallback to seed occurred (LLM might have failed or decided seed is best)")
        }

        console.log("\n=== TESTING IMAGE GENERATION (Pollinations) ===")
        // Force pollinations via 'unsplash' model ID which we mapped to pollinations logic or fallback
        // Actually we modified generateWithUnsplash logic in services/image.ts
        const imageResult = await generateBlogImage({
            prompt: result.bestKeyword + " professional guide",
            imageModelId: "unsplash"
        })

        console.log("✅ Image URL:", imageResult.url)
        console.log("Generated with model:", imageResult.model)

        if (imageResult.url.includes("pollinations")) {
            console.log("✅ Verified: Using Pollinations.ai")
        } else if (imageResult.url.includes("picsum")) {
            console.log("⚠️ Using Picsum Fallback")
        } else {
            console.log("❓ Using unknown source:", imageResult.url)
        }

    } catch (error) {
        console.error("❌ Test Failed:", error)
    }
}

testModules()
