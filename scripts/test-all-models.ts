
const path = require('path')
const fs = require('fs') // Added fs
require('dotenv').config({ path: path.resolve(process.cwd(), '.env') })
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') })

import { callOpenRouter } from "../lib/openrouter"
import { TEXT_MODELS } from "../lib/config/models"

async function testAllModels() {
    console.log("=== TESTING ALL FREE MODELS FOR RATE LIMITS ===")
    const logBatch = ["=== MODEL TEST LOG ==="]

    // Filter only free models
    const freeModels = TEXT_MODELS.filter(m => m.tier === 'free')
    let foundWorking = false

    for (const model of freeModels) {
        const startMsg = `\nTesting model: ${model.name} (${model.id})...`
        console.log(startMsg)
        logBatch.push(startMsg)

        try {
            const result = await callOpenRouter(
                model.id,
                "You are a test bot.",
                "Say 'Hello' only."
            )
            const successMsg = `✅ SUCCESS: ${model.name} - Response: ${result}`
            console.log(successMsg)
            logBatch.push(successMsg)
            foundWorking = true

            // Log success immediately
            fs.writeFileSync('test-results.txt', logBatch.join('\n'))
            return; // Exit on first success
        } catch (error) {
            let failMsg = `❌ FAILED: ${model.name}`
            if (String(error).includes("429")) {
                failMsg += " -> Rate Limit Hit"
            } else {
                failMsg += ` -> Error: ${error.message}`
            }
            console.log(failMsg)
            logBatch.push(failMsg)
        }
    }

    if (!foundWorking) {
        logBatch.push("\n❌ ALL MODELS FAILED (Likely Account-wide Limit)")
        console.log("ALL MODELS FAILED")
    }

    fs.writeFileSync('test-results.txt', logBatch.join('\n'))
}

testAllModels()
