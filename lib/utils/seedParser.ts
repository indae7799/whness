
import fs from 'fs'
import path from 'path'

export interface ParsedSeed {
    term: string
    weight: number
}

/**
 * Parses the seed.md file to extract seeds and their weights.
 * Expected format: "1. keyword term (weight)"
 */
export function parseSeedFile(filePath?: string): ParsedSeed[] {
    // Default to the seed.md in the project root if not specified
    const targetPath = filePath || path.join(process.cwd(), 'seed.md')

    try {
        if (!fs.existsSync(targetPath)) {
            console.warn(`Seed file not found at ${targetPath}`)
            return []
        }

        const content = fs.readFileSync(targetPath, 'utf-8')
        const lines = content.split('\n')
        const seeds: ParsedSeed[] = []

        // Regex explanation:
        // ^\d+\.      -> Starts with number and dot (e.g., "1.")
        // \s+         -> One or more spaces
        // (.+?)       -> Capture group 1: The keyword term (non-greedy)
        // \s+         -> Spaces before the weight
        // \((\d+)\)   -> Capture group 2: The weight inside parentheses (e.g., "(2)")
        const seedRegex = /^\d+\.\s+(.+?)\s+\((\d+)\)/

        for (const line of lines) {
            const trimmed = line.trim()
            const match = trimmed.match(seedRegex)
            if (match) {
                seeds.push({
                    term: match[1].trim(), // The keyword
                    weight: parseInt(match[2], 10) // The weight
                })
            }
        }

        console.log(`Parsed ${seeds.length} seeds from ${targetPath}`)
        return seeds
    } catch (error) {
        console.error("Failed to parse seed file:", error)
        return []
    }
}
