// Default seed list and subreddits for auto research
// Based on seed.md specification

export interface Seed {
    term: string
    weight: number
    category?: string
}

export const DEFAULT_SEEDS: Seed[] = [
    { term: "medicare basics", weight: 2, category: "basics" },
    { term: "medicare eligibility age", weight: 2, category: "eligibility" },
    { term: "medicare enrollment", weight: 3, category: "enrollment" },
    { term: "medicare special enrollment period", weight: 3, category: "enrollment" },
    { term: "medicare open enrollment", weight: 3, category: "enrollment" },
    { term: "medicare annual enrollment", weight: 2, category: "enrollment" },
    { term: "medicare part a coverage", weight: 2, category: "coverage" },
    { term: "medicare part b coverage", weight: 2, category: "coverage" },
    { term: "medicare part d coverage", weight: 2, category: "coverage" },
    { term: "medicare advantage vs medigap", weight: 4, category: "comparison" },
    { term: "medigap plan g", weight: 3, category: "medigap" },
    { term: "medigap plan n", weight: 3, category: "medigap" },
    { term: "medicare part a deductible", weight: 3, category: "costs" },
    { term: "medicare part b deductible", weight: 3, category: "costs" },
    { term: "medicare part b premium", weight: 3, category: "costs" },
    { term: "medicare part b excess charges", weight: 3, category: "costs" },
    { term: "medicare part d donut hole", weight: 3, category: "prescription" },
    { term: "medicare part d coverage gap", weight: 3, category: "prescription" },
    { term: "medicare part d late enrollment penalty", weight: 3, category: "penalties" },
    { term: "medicare advantage open enrollment period", weight: 4, category: "enrollment" },
    { term: "medicare initial enrollment period", weight: 3, category: "enrollment" },
    { term: "medicare special enrollment period rules", weight: 4, category: "enrollment" },
    { term: "medicare annual notice of change", weight: 2, category: "documents" },
    { term: "medicare plan compare checklist", weight: 2, category: "comparison" },
    { term: "medicare enrollment documents needed", weight: 3, category: "documents" },
    { term: "medicare coverage after retirement", weight: 2, category: "retirement" },
    { term: "medicare coverage while traveling", weight: 2, category: "coverage" },
    { term: "medicare advantage network restrictions", weight: 3, category: "advantage" },
    { term: "medicare out of network costs", weight: 3, category: "costs" },
    { term: "medicare skilled nursing facility coverage", weight: 4, category: "coverage" },
    { term: "medicare home health eligibility", weight: 3, category: "eligibility" },
    { term: "medicare physical therapy coverage", weight: 3, category: "coverage" },
    { term: "medicare durable medical equipment", weight: 3, category: "coverage" },
    { term: "medicare prior authorization", weight: 3, category: "claims" },
    { term: "medicare appeal timeline", weight: 3, category: "appeals" },
    { term: "medicare billing dispute", weight: 4, category: "billing" },
    { term: "medicare claim denial reasons", weight: 4, category: "claims" },
    { term: "medicare claim status check", weight: 3, category: "claims" },
    { term: "medicare savings program eligibility", weight: 3, category: "savings" },
    { term: "extra help prescription drug plan", weight: 3, category: "prescription" },
    { term: "dual eligible medicare medicaid", weight: 3, category: "eligibility" },
    { term: "medicare penalties", weight: 3, category: "penalties" },
    { term: "late enrollment penalty", weight: 3, category: "penalties" },
    { term: "medicare premium increase", weight: 2, category: "costs" },
    { term: "irmaa medicare", weight: 3, category: "costs" },
    { term: "medicare prescription drug coverage", weight: 2, category: "prescription" },
    { term: "medicare and dental vision hearing", weight: 2, category: "coverage" },
    { term: "medicare and home health care", weight: 2, category: "coverage" },
    { term: "medicare and nursing home", weight: 2, category: "coverage" },
    { term: "medicare billing errors", weight: 4, category: "billing" },
    { term: "medicare claims denied", weight: 5, category: "claims" },
    { term: "medicare claim denial", weight: 4, category: "claims" },
    { term: "medicare appeal process", weight: 3, category: "appeals" },
    { term: "medicare claim status", weight: 3, category: "claims" },
    { term: "medicare billing codes", weight: 4, category: "billing" },
    { term: "medicare explanation of benefits", weight: 4, category: "documents" },
    { term: "medicare appeals", weight: 3, category: "appeals" },
    { term: "medicare for caregivers", weight: 2, category: "caregivers" },
    { term: "medicare after moving states", weight: 2, category: "enrollment" },
    { term: "medicare advantage plan costs", weight: 4, category: "advantage" },
    { term: "medicare supplement enrollment", weight: 2, category: "medigap" },
    { term: "medicare and hospital stays", weight: 2, category: "coverage" },
    { term: "medicare and doctor visits", weight: 2, category: "coverage" },
    { term: "medicare coverage for seniors", weight: 2, category: "coverage" },
    { term: "medicare out of pocket costs", weight: 3, category: "costs" },
]

export const DEFAULT_SUBREDDITS = [
    "medicare",
    "healthinsurance",
    "insurance",
    "eldercare",
    "caregiver",
    "retirement",
    "aging",
    "socialsecurity",
]

// Categories derived from seeds
export const SEED_CATEGORIES = [
    "basics",
    "eligibility",
    "enrollment",
    "coverage",
    "comparison",
    "medigap",
    "costs",
    "prescription",
    "penalties",
    "documents",
    "retirement",
    "advantage",
    "claims",
    "appeals",
    "billing",
    "savings",
    "caregivers",
]

// Helper functions
export function getSeedsByCategory(category: string): Seed[] {
    return DEFAULT_SEEDS.filter(s => s.category === category)
}

export function getRandomSeeds(count: number): Seed[] {
    const shuffled = [...DEFAULT_SEEDS].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, count)
}

export function getHighPrioritySeeds(minWeight: number = 3): Seed[] {
    return DEFAULT_SEEDS.filter(s => s.weight >= minWeight)
}
