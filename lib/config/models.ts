// Model configuration for text and image generation
// Priority: Free models first for cost-effective testing

export interface TextModel {
    id: string
    name: string
    provider: 'openrouter' | 'openai' | 'deepseek'
    inputCost: number  // per million tokens
    outputCost: number // per million tokens
    contextWindow: number
    tier: 'free' | 'budget' | 'balanced' | 'premium'
    description: string
}

export interface ImageModel {
    id: string
    name: string
    provider: 'unsplash' | 'openai'
    costPerImage: number
    tier: 'free' | 'budget' | 'balanced' | 'premium'
    description: string
}

export const TEXT_MODELS: TextModel[] = [
    {
        id: 'google/gemini-2.5-flash:free',
        name: 'Gemini 2.5 Flash (Free)',
        provider: 'openrouter',
        inputCost: 0,
        outputCost: 0,
        contextWindow: 1000000,
        tier: 'free',
        description: 'Free - Fast & High Efficiency (2026)'
    },
    {
        id: 'google/gemini-3.0-flash:free',
        name: 'Gemini 3.0 Flash (Free)',
        provider: 'openrouter',
        inputCost: 0,
        outputCost: 0,
        contextWindow: 1000000,
        tier: 'free',
        description: 'Free - Logical & Robust (2026)'
    },
    {
        id: 'google/gemini-2.0-flash-exp:free',
        name: 'Gemini 2.0 Flash Exp (Free)',
        provider: 'openrouter',
        inputCost: 0,
        outputCost: 0,
        contextWindow: 1000000,
        tier: 'free',
        description: 'Free - Google Premium Model'
    },
    {
        id: 'meta-llama/llama-3.3-70b-instruct:free',
        name: 'Llama 3.3 70B Instruct (Free)',
        provider: 'openrouter',
        inputCost: 0,
        outputCost: 0,
        contextWindow: 131072,
        tier: 'free',
        description: 'Free - Meta Strongest Open Model'
    },
    {
        id: 'google/gemma-3-27b-it:free',
        name: 'Gemma 3 27B IT (Free)',
        provider: 'openrouter',
        inputCost: 0,
        outputCost: 0,
        contextWindow: 131072,
        tier: 'free',
        description: 'Free - High Performance'
    },
    {
        id: 'qwen/qwen3-coder:free',
        name: 'Qwen 3 Coder 480B (Free)',
        provider: 'openrouter',
        inputCost: 0,
        outputCost: 0,
        contextWindow: 262000,
        tier: 'free',
        description: 'Free - Best for Coding (480B)'
    },
    {
        id: 'tngtech/deepseek-r1t-chimera:free',
        name: 'DeepSeek R1T Chimera (Free)',
        provider: 'openrouter',
        inputCost: 0,
        outputCost: 0,
        contextWindow: 163840,
        tier: 'free',
        description: 'Free - Strong Reasoning'
    },
    {
        id: 'mistralai/mistral-small-3.1-24b-instruct:free',
        name: 'Mistral Small 3.1 24B (Free)',
        provider: 'openrouter',
        inputCost: 0,
        outputCost: 0,
        contextWindow: 128000,
        tier: 'free',
        description: 'Free - Efficient & Fast'
    },
    {
        id: 'gpt-4o',
        name: 'GPT-4o (Paid)',
        provider: 'openai',
        inputCost: 2.50,
        outputCost: 10.00,
        contextWindow: 128000,
        tier: 'premium',
        description: 'Premium - OpenAI Best'
    }
]

export const IMAGE_MODELS: ImageModel[] = [
    {
        id: 'unsplash',
        name: 'Pollinations.ai (Free)', // Renamed for clarity, logic handles it
        provider: 'unsplash',
        costPerImage: 0,
        tier: 'free',
        description: 'Free - High Quality AI Images'
    },
    {
        id: 'pixabay',
        name: 'Pixabay (Free)',
        provider: 'unsplash', // Same logic, different source
        costPerImage: 0,
        tier: 'free',
        description: 'Free - Royalty Free Images'
    },
    {
        id: 'dall-e-2',
        name: 'DALL-E 2 (Paid)',
        provider: 'openai',
        costPerImage: 0.02,
        tier: 'budget',
        description: 'Budget - AI Generated $0.02'
    },
    {
        id: 'dall-e-3-standard',
        name: 'DALL-E 3 Standard (Paid)',
        provider: 'openai',
        costPerImage: 0.04,
        tier: 'balanced',
        description: 'Balanced - AI HD $0.04'
    },
    {
        id: 'dall-e-3-hd',
        name: 'DALL-E 3 HD (Paid)',
        provider: 'openai',
        costPerImage: 0.08,
        tier: 'premium',
        description: 'Premium - AI Ultra HD $0.08'
    }
]

// Get default free models
export const DEFAULT_TEXT_MODEL = TEXT_MODELS.find(m => m.id === 'google/gemini-3.0-flash:free') || TEXT_MODELS[0]
export const DEFAULT_IMAGE_MODEL = IMAGE_MODELS[0] // Pollinations.ai

// Helper functions
export function getTextModelById(id: string): TextModel | undefined {
    return TEXT_MODELS.find(m => m.id === id)
}

export function getImageModelById(id: string): ImageModel | undefined {
    return IMAGE_MODELS.find(m => m.id === id)
}
