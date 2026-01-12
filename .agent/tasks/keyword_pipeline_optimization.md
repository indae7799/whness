# Task: Keyword Pipeline Refinement & Optimization

## Status
- [x] **Phase 3.5 Implementation**: Smart Loop for SERP Validation (Completed)
    - [x] Replace fixed 1-keyword validation with loop (up to 2 attempts) -> `app/api/keywords/generate/route.ts`
    - [x] Implement "Winner Promotion" logic (move valid keyword to top)
- [x] **Phase 4 Enhancement**: Deeper SERP Analysis
    - [x] Update `analyzeSERP` in `lib/serp/analyzer.ts`
    - [x] Include snippet/description analysis for content gap detection
- [x] **Phase 1 Enhancement**: Seed Quality Control
    - [x] Add filters in `app/api/keywords/generate/route.ts`
    - [x] Exclude generic/short seeds dynamically

## Context
The user wants to refine the keyword pipeline to find true niche opportunities while strictly adhering to a 3 SERP call limit per article. The current implementation needs to be smarter about how it uses those limited calls.

## Current Blockers
- Matching errors when updating `app/api/keywords/generate/route.ts`. Need to act carefully with file edits.
