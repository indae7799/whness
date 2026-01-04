# Research Sources and Seeds

This document lists where auto research pulls data from and the default seed list.

---

## Auto Research Entry Points

- UI trigger: `app/_lib/actions.ts` → `startAutoPipelineAction`
- Core pipeline: `src/services/research/autoCollect.ts` → `runDefaultResearch`
- Source ingestion: `src/services/research/ingestSources.ts`
- Seed list + subreddits: `src/services/research/defaultSeeds.ts`

---

## Research Sources (by channel)

### Seed Expansion (local)
- Seed list expanded via Google autocomplete + Trends
- Ads Keyword Planner (optional, controlled by `ADS_KEYWORD_PLANNER_ENABLED`)

### Remote Sources
- Reddit
- StackExchange
- Google Trends
- Wikipedia (OpenSearch API)
- CMS RSS feeds (if configured)

---

## Source Request Parameters and Timeouts

### Reddit (read-only JSON)
- Endpoint: `https://www.reddit.com/search.json` or `https://www.reddit.com/r/{subreddits}/search.json`
- Params:
  - `q` = query
  - `limit` = options.limit
  - `sort` = `new`
  - `raw_json` = `1`
  - `restrict_sr` = `on` (when subreddits provided)
- Headers: `User-Agent`, `Accept: application/json`, `Accept-Language: en-US,en;q=0.8`
- Timeout: `options.timeoutMs` (default 10000ms)
- Fallback: RSS search (`search.rss`)

### Reddit Approval Fallbacks (when OAuth is not available)
- Read-only mode is enabled when `REDDIT_READONLY_ENABLED=true`.
- If JSON search fails, the pipeline falls back to RSS:
  - `https://www.reddit.com/search.rss`
  - or `https://www.reddit.com/r/{subreddits}/search.rss`
- Throttling:
  - `REDDIT_REQUEST_DELAY_MS` adds delay between requests.
  - `REDDIT_USER_AGENT` is always applied to reduce blocking.
- Hard-fail condition:
  - If OAuth is missing **and** read-only is disabled, the source is skipped with `REDDIT_ENV_MISSING`.

### Reddit (OAuth)
- Endpoint: `https://oauth.reddit.com/search` or `/r/{subreddits}/search`
- Params:
  - `q` = query
  - `limit` = options.limit
  - `sort` = `new`
  - `restrict_sr` = `on/off`
- Headers: `Authorization: Bearer`, `User-Agent`
- Timeout: `options.timeoutMs` (default 10000ms)

### StackExchange
- Endpoint: `https://api.stackexchange.com/2.3/search/advanced`
- Params:
  - `site` = `STACKEXCHANGE_SITE` (default `medicalsciences`)
  - `q` = query
  - `pagesize` = options.limit
  - `sort` = `activity`
  - `order` = `desc`
  - `key` = `STACKEXCHANGE_KEY` (if set)
- Timeout: `options.timeoutMs` (default 10000ms)

### Google Trends (related queries)
- Library: `google-trends-api`
- Inputs:
  - `keyword` = query + modifiers
  - `geo` = `US`
  - `startTime` = now - 12 months
  - `hl` = `en-US`
- Timeout: `options.timeoutMs` (default 10000ms)

### Google Trends (details by flow)
- Ingest flow (`ingestGoogleTrends`):
  - Modifiers: `medical`, `health`, `wellness`, `insurance`
  - Queries: seed + modifiers
  - Source: related queries ranked list
- Seed expansion flow (`expandSeedTerms`):
  - `geo` = `RESEARCH_TRENDS_GEO`
  - `hl` = `RESEARCH_TRENDS_HL`
  - Limit: `RESEARCH_TRENDS_LIMIT`
  - Uses related queries for each seed

### Wikipedia (OpenSearch)
- Endpoint: `https://en.wikipedia.org/w/api.php`
- Params:
  - `action` = `opensearch`
  - `search` = query
  - `limit` = options.limit
  - `namespace` = `0`
  - `format` = `json`
- Headers: `User-Agent`, `Accept: application/json`
- Timeout: max(20000ms, options.timeoutMs)

### CMS RSS
- Endpoint(s): `CMS_RSS_FEEDS` (comma-separated)
- Parsing: RSS/Atom `title`, `link`, `pubDate`/`updated`
- Timeout: `options.timeoutMs` (default 10000ms)

### Google Autocomplete (seed expansion)
- Endpoint: `https://suggestqueries.google.com/complete/search`
- Params:
  - `client` = `firefox`
  - `hl` = `RESEARCH_AUTOCOMPLETE_HL`
  - `q` = seed
- Timeout: `options.timeoutMs` (default 10000ms)

### Google Trends (seed expansion)
- Library: `google-trends-api`
- Inputs:
  - `keyword` = seed
  - `geo` = `RESEARCH_TRENDS_GEO`
  - `hl` = `RESEARCH_TRENDS_HL`
- Timeout: `options.timeoutMs` (default 10000ms)

### Ads Keyword Planner (optional)
- Controlled by: `ADS_KEYWORD_PLANNER_ENABLED`
- Inputs:
  - `seeds` = seed list
  - `limit` = `GOOGLE_ADS_IDEAS_LIMIT`
- Notes: requires Ads API credentials and enabled access.

---

## Default Seed List (term + weight)

1. medicare basics (2)
2. medicare eligibility age (2)
3. medicare enrollment (3)
4. medicare special enrollment period (3)
5. medicare open enrollment (3)
6. medicare annual enrollment (2)
7. medicare part a coverage (2)
8. medicare part b coverage (2)
9. medicare part d coverage (2)
10. medicare advantage vs medigap (4)
11. medigap plan g (3)
12. medigap plan n (3)
13. medicare part a deductible (3)
14. medicare part b deductible (3)
15. medicare part b premium (3)
16. medicare part b excess charges (3)
17. medicare part d donut hole (3)
18. medicare part d coverage gap (3)
19. medicare part d late enrollment penalty (3)
20. medicare advantage open enrollment period (4)
21. medicare initial enrollment period (3)
22. medicare special enrollment period rules (4)
23. medicare annual notice of change (2)
24. medicare plan compare checklist (2)
25. medicare enrollment documents needed (3)
26. medicare coverage after retirement (2)
27. medicare coverage while traveling (2)
28. medicare advantage network restrictions (3)
29. medicare out of network costs (3)
30. medicare skilled nursing facility coverage (4)
31. medicare home health eligibility (3)
32. medicare physical therapy coverage (3)
33. medicare durable medical equipment (3)
34. medicare prior authorization (3)
35. medicare appeal timeline (3)
36. medicare billing dispute (4)
37. medicare claim denial reasons (4)
38. medicare claim status check (3)
39. medicare savings program eligibility (3)
40. extra help prescription drug plan (3)
41. dual eligible medicare medicaid (3)
42. medicare penalties (3)
43. late enrollment penalty (3)
44. medicare premium increase (2)
45. irmaa medicare (3)
46. medicare prescription drug coverage (2)
47. medicare and dental vision hearing (2)
48. medicare and home health care (2)
49. medicare and nursing home (2)
50. medicare billing errors (4)
51. medicare claims denied (5)
52. medicare claim denial (4)
53. medicare appeal process (3)
54. medicare claim status (3)
55. medicare billing codes (4)
56. medicare explanation of benefits (4)
57. medicare appeals (3)
58. medicare for caregivers (2)
59. medicare after moving states (2)
60. medicare advantage plan costs (4)
61. medicare supplement enrollment (2)
62. medicare and hospital stays (2)
63. medicare and doctor visits (2)
64. medicare coverage for seniors (2)
65. medicare out of pocket costs (3)

---

## Default Subreddits

- medicare
- healthinsurance
- insurance
- eldercare
- caregiver
- retirement
- aging
- socialsecurity
