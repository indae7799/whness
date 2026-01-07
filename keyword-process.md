# Keyword Discovery & Selection Process

This document defines the final logic for keyword discovery and seed selection in the Auto-Blogging pipeline.
**Last Updated:** 2026-01-06 (Refined for User Experience)

---

## 1. Core Philosophy
The goal is to provide **fresh, non-repetitive, and high-value** keyword suggestions every time the user triggers the generation process.
- **Randomness over Rotation:** We prioritize random discovery to prevent "stale" results.
- **Weighted Value:** We favor high-value seeds (defined by weight) but ensure variety.
- **Trend Integration:** Real-time trends are always mixed in to capture current interest.

---

## 2. Seed Selection Logic (Auto Mode)

### A. The Pool
- **Source:** `DEFAULT_SEEDS` list in `lib/research/defaultSeeds.ts`.
- **Structure:** Each seed has a `term` and a `weight` (1-5).

### B. Selection Algorithm (True Random Shuffle)
Instead of a predictable time-based rotation, we use a **Weighted Random Shuffle**:

1.  **Categorization:**
    - **High Value Group:** Seeds with weight >= 4 (Critical/High-paying topics).
    - **Medium Value Group:** Seeds with weight < 4 (General topics).

2.  **Shuffling:**
    - Both groups are shuffled using a **Fisher-Yates Shuffle** algorithm on every request.
    - This guarantees a different order and selection index every time.

3.  **Extraction:**
    - **High Value:** Top 3 seeds are picked from the shuffled High Value Group.
    - **Medium Value:** Top 3 seeds are picked from the shuffled Medium Value Group.

4.  **Final Pool Construction:**
    - These 6 candidates are combined and shuffled *again*.
    - The system iterates through this mixed pool and selects the **first 3 unique seeds**.
    - **Result:** 3 finalized Auto Seeds (High-Quality & Random).

---

## 3. Google Trends Integration

To ensure the blog stays relevant to *today's* news:
1.  **Fetching:** The system queries Google Trends for "US" daily trends.
2.  **Filtering:** It filters for keywords related to our niche (Medicare, Health, Insurance, Finance).
3.  **Selection:** The top 2 matching trend keywords are selected.
4.  **Weight:** Trend keywords are assigned the highest weight (5).

---

## 4. Final Seed Combination

The engine begins the deep research phase with exactly **5 Seeds**:
- **3 Auto Seeds** (From the Random Shuffle process)
- **2 Trend Seeds** (From Real-time Google Trends)

> **Formula:** `[Auto Seed 1, Auto Seed 2, Auto Seed 3] + [Trend 1, Trend 2]`

---

## 5. Usage in Research Pipeline

These 5 seeds are then sent to:
1.  **Reddit Search:** Finding real user questions and discussions.
2.  **People Also Ask:** Extracting typical user queries.
3.  **Related Searches:** finding semantic variations.
4.  **Keyword Analysis:** Scoring and filtering for difficulty/volume.

**Outcome:** A final list of ~15-20 highly relevant, diverse, and actionable keywords presented to the user.
