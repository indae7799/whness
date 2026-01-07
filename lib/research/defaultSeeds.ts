// Default seed list and subreddits for auto research
// Based on seed.md specification

export interface Seed {
    term: string
    weight: number
    category: string
}

export const SUPER_CATEGORIES = [
    { id: "fundamentals", label: "Fundamentals", ko: "기초 & 자격", sub: ["basics", "eligibility", "documents", "retirement", "mental-health", "telehealth", "preventive"] },
    { id: "enrollment", label: "Enrollment & Sign-up", ko: "가입 & 등록", sub: ["enrollment", "penalties", "decision"] },
    { id: "costs", label: "Costs & Savings", ko: "비용 & 절약", sub: ["costs", "savings", "billing"] },
    { id: "coverage", label: "Coverage & Benefits", ko: "보장 & 혜택", sub: ["coverage", "prescription", "advantage", "caregivers"] },
    { id: "medigap", label: "Medigap & Supplements", ko: "메디갭 & 추가보험", sub: ["medigap", "comparison"] },
    { id: "claims", label: "Claims & Disputes", ko: "청구 & 문제해결", sub: ["claims", "appeals", "troubleshooting"] },
]

export const DEFAULT_SEEDS: Seed[] = [
    // 1. Fundamentals (기초 & 자격) + New: Mental-Health, Telehealth, Preventive
    { term: "medicare basics", weight: 2, category: "basics" },
    { term: "how does medicare work", weight: 3, category: "basics" },
    { term: "medicare explained for beginners", weight: 2, category: "basics" },
    { term: "medicare parts a b c d explained", weight: 3, category: "basics" },
    { term: "medicare eligibility age", weight: 2, category: "eligibility" },
    { term: "dual eligible medicare medicaid", weight: 3, category: "eligibility" },
    { term: "medicare annual notice of change", weight: 2, category: "documents" },
    { term: "medicare enrollment documents needed", weight: 3, category: "documents" },
    { term: "medicare coverage after retirement", weight: 2, category: "retirement" },
    { term: "medicare at 62 vs 65", weight: 3, category: "retirement" },
    { term: "medicare when retiring abroad", weight: 2, category: "retirement" },
    { term: "medicare mental health coverage", weight: 3, category: "mental-health" },
    { term: "medicare therapy sessions", weight: 2, category: "mental-health" },
    { term: "medicare telehealth coverage", weight: 3, category: "telehealth" },
    { term: "medicare virtual visits", weight: 2, category: "telehealth" },
    { term: "medicare preventive care", weight: 3, category: "preventive" },
    { term: "medicare annual wellness visit", weight: 3, category: "preventive" },

    // 2. Enrollment & Sign-up (가입 & 등록) + New: Decision
    { term: "medicare enrollment", weight: 3, category: "enrollment" },
    { term: "medicare special enrollment period", weight: 3, category: "enrollment" },
    { term: "medicare open enrollment", weight: 3, category: "enrollment" },
    { term: "medicare annual enrollment", weight: 2, category: "enrollment" },
    { term: "medicare advantage open enrollment period", weight: 4, category: "enrollment" },
    { term: "medicare initial enrollment period", weight: 3, category: "enrollment" },
    { term: "medicare special enrollment period rules", weight: 4, category: "enrollment" },
    { term: "medicare after moving states", weight: 2, category: "enrollment" },
    { term: "medicare penalties", weight: 3, category: "penalties" },
    { term: "late enrollment penalty", weight: 3, category: "penalties" },
    { term: "medicare part d late enrollment penalty", weight: 3, category: "penalties" },
    { term: "is medicare advantage worth it", weight: 4, category: "decision" },
    { term: "should I drop medicare part b", weight: 3, category: "decision" },
    { term: "best medicare plan for diabetics", weight: 3, category: "decision" },

    // 3. Costs & Savings (비용 & 절약)
    { term: "medicare part a deductible", weight: 3, category: "costs" },
    { term: "medicare part b deductible", weight: 3, category: "costs" },
    { term: "medicare part b premium", weight: 3, category: "costs" },
    { term: "medicare part b excess charges", weight: 3, category: "costs" },
    { term: "medicare out of network costs", weight: 3, category: "costs" },
    { term: "medicare premium increase", weight: 2, category: "costs" },
    { term: "irmaa medicare", weight: 3, category: "costs" },
    { term: "medicare out of pocket costs", weight: 3, category: "costs" },
    { term: "medicare savings program eligibility", weight: 3, category: "savings" },
    { term: "medicare billing disputes", weight: 4, category: "billing" },
    { term: "medicare billing errors", weight: 4, category: "billing" },
    { term: "medicare billing codes", weight: 4, category: "billing" },

    // 4. Coverage & Benefits (보장 & 혜택)
    { term: "medicare part a coverage", weight: 2, category: "coverage" },
    { term: "medicare part b coverage", weight: 2, category: "coverage" },
    { term: "medicare part d coverage", weight: 2, category: "coverage" },
    { term: "medicare coverage while traveling", weight: 2, category: "coverage" },
    { term: "medicare skilled nursing facility coverage", weight: 4, category: "coverage" },
    { term: "medicare physical therapy coverage", weight: 3, category: "coverage" },
    { term: "medicare durable medical equipment", weight: 3, category: "coverage" },
    { term: "medicare and dental vision hearing", weight: 2, category: "coverage" },
    { term: "medicare and home health care", weight: 2, category: "coverage" },
    { term: "medicare and nursing home", weight: 2, category: "coverage" },
    { term: "medicare and hospital stays", weight: 2, category: "coverage" },
    { term: "medicare and doctor visits", weight: 2, category: "coverage" },
    { term: "medicare coverage for seniors", weight: 2, category: "coverage" },
    { term: "medicare part d donut hole", weight: 3, category: "prescription" },
    { term: "medicare part d coverage gap", weight: 3, category: "prescription" },
    { term: "extra help prescription drug plan", weight: 3, category: "prescription" },
    { term: "medicare prescription drug coverage", weight: 2, category: "prescription" },
    { term: "medicare advantage network restrictions", weight: 3, category: "advantage" },
    { term: "medicare advantage plan costs", weight: 4, category: "advantage" },
    { term: "medicare for caregivers", weight: 2, category: "caregivers" },
    { term: "medicare respite care coverage", weight: 3, category: "caregivers" },
    { term: "medicare home care benefits", weight: 2, category: "caregivers" },

    // 5. Medigap & Supplements (메디갭 & 추가보험)
    { term: "medigap plan g", weight: 3, category: "medigap" },
    { term: "medigap plan n", weight: 3, category: "medigap" },
    { term: "medicare supplement enrollment", weight: 2, category: "medigap" },
    { term: "medicare advantage vs medigap", weight: 4, category: "comparison" },
    { term: "medicare plan compare checklist", weight: 2, category: "comparison" },
    { term: "medicare vs medicaid differences", weight: 4, category: "comparison" },
    { term: "original medicare vs medicare advantage", weight: 4, category: "comparison" },

    // 6. Claims & Disputes (청구 & 문제해결) + New: Troubleshooting
    { term: "medicare prior authorization", weight: 3, category: "claims" },
    { term: "medicare claim denial reasons", weight: 4, category: "claims" },
    { term: "medicare claim status check", weight: 3, category: "claims" },
    { term: "medicare claims denied", weight: 5, category: "claims" },
    { term: "medicare claim denial", weight: 4, category: "claims" },
    { term: "medicare claim status", weight: 3, category: "claims" },
    { term: "medicare appeal timeline", weight: 3, category: "appeals" },
    { term: "medicare appeal process", weight: 3, category: "appeals" },
    { term: "medicare appeals", weight: 3, category: "appeals" },
    { term: "what to do if medicare denies claim", weight: 4, category: "troubleshooting" },
    { term: "how to fix medicare coverage gap", weight: 3, category: "troubleshooting" },
    { term: "medicare not covering procedure", weight: 3, category: "troubleshooting" },
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

// Helper functions
export function getSeedsByCategory(category: string): Seed[] {
    return DEFAULT_SEEDS.filter(s => s.category === category)
}

export function getSeedsBySuperCategory(superId: string): Seed[] {
    const superCat = SUPER_CATEGORIES.find(c => c.id === superId);
    if (!superCat) return [];

    return DEFAULT_SEEDS.filter(s => superCat.sub.includes(s.category));
}

export function getRandomSeeds(count: number): Seed[] {
    const shuffled = [...DEFAULT_SEEDS].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, count)
}

export function getHighPrioritySeeds(minWeight: number = 3): Seed[] {
    return DEFAULT_SEEDS.filter(s => s.weight >= minWeight)
}
