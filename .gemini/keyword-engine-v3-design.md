# 키워드 생성 엔진 v3.0 - 상세 설계 문서

> **목표**: 경쟁자가 놓친 콘텐츠 갭을 발견하고, AI가 차별화 전략을 수립하여, 지속적 트래픽을 가져오는 꿀 키워드를 발굴

---

## 📐 전체 아키텍처

```
[65개 시드] → [확장 & 수집] → [SERP 분석] → [AI 전략 생성] → [다중 소스 검증] → [스코어링] → [프롬프트 빌더]
    ↓              ↓              ↓              ↓                  ↓              ↓              ↓
  시드 회전    Autocomplete   상위 10개      차별화 각도        Reddit 댓글수    성공 가능성    롱테일 5개
  가중치 적용   PAA 수집      제목 분석      기회/위험 분석     Wiki 존재여부    경쟁도 역산    SEO 전략
  트렌드 주입   Related       패턴 추출      SEO 공략법        Stack 조회수     꿀키워드 플래그  콘텐츠 각도
```

---

## 🔹 Phase 1: 시드 확장 & 초기 수집

### 1.1 시드 선택 시스템 (기존 유지 + 강화)

**입력**: `seed.md`의 65개 시드 (weight 1-5)

**선택 로직**:
```typescript
interface SeedSelection {
  evergreen: Array<{ term: string; weight: number }>; // 3개
  trending: Array<{ term: string; source: 'google_trends' }>; // 2개
  total: 5; // 최종
}

// 1. Evergreen 시드 (Smart Rotation)
- 2개: weight >= 4 (높은 가중치)
- 1개: weight = 3 (중간 가중치)
- 로테이션: (dayOfMonth * 6 + hourSlot) % 65

// 2. Trending 시드
- Google Trends Daily RSS (US)
- 필터: ["health", "medicare", "insurance", "tax", "finance", "medical"]
- 2개 선택
```

**출력**: 5개 초기 시드

---

### 1.2 키워드 확장 (2-Level Deep Dive)

**Level 1: Google Autocomplete**
```typescript
async function expandKeywords(seed: string) {
  // 기본 제안
  const level1 = await fetchGoogleSuggest(seed);
  
  // 알파벳 확장 (a-z, 0-9 append)
  const expanded = await fetchGoogleSuggestExpanded(seed, 10);
  
  // 질문 키워드 타겟
  const questions = await fetchQuestionKeywords(seed);
  
  return { level1, expanded, questions };
}
```

**Level 2: Recursive Deep Dive**
```typescript
// Level 1 중간 결과를 다시 확장
const deepSeed = level1[Math.floor(level1.length / 2)];
const level2 = await fetchGoogleSuggest(deepSeed);

// 병합 & 중복 제거
const allCandidates = [...new Set([...level1, ...expanded, ...questions, ...level2])];
```

**필터링**:
- ✅ 시드보다 2단어 이상 (Evergreen) 또는 1단어 이상 (Trend)
- ✅ 60자 이하
- ❌ Banned 키워드: `["pdf", "login", "phone number", "near me", "download"]`

**출력**: 각 시드당 20-50개 후보 키워드

---

### 1.3 People Also Ask & Related Searches

**데이터 소스**:
```typescript
interface PAAData {
  paaQuestions: string[];      // fetchPeopleAlsoAsk()
  relatedSearches: string[];   // Google Autocomplete 변형
  redditQuestions: string[];   // fetchRedditRelevant() 질문 필터
}

async function collectPAA(seed: string): Promise<PAAData> {
  const [paa, reddit] = await Promise.all([
    fetchPeopleAlsoAsk(seed),           // 최대 6개
    fetchRedditRelevant(seed, 5)        // 댓글 5+ 필터
  ]);
  
  // 질문 형식만 추출
  const redditQuestions = reddit.filter(title => 
    title.includes("?") || 
    /^(how|what|can|should|why|when|who|where|which)/i.test(title)
  );
  
  return {
    paaQuestions: paa.map(p => p.question),
    relatedSearches: await fetchGoogleSuggest(`${seed} vs`), // 비교 키워드
    redditQuestions
  };
}
```

**출력**: 각 시드당 PAA 10-15개

---

## 🔹 Phase 2: SERP 경쟁 분석 (신규)

### 2.1 상위 10개 검색 결과 수집

**우회 방법** (클라이언트 ID 불필요):
```typescript
// Option A: SerpAPI (유료지만 무료 티어 100회/월)
const serpApiKey = process.env.SERPAPI_KEY; // 선택사항

// Option B: Google Custom Search JSON API (무료 100회/일)
const googleSearchKey = process.env.GOOGLE_SEARCH_API_KEY;
const googleSearchCx = process.env.GOOGLE_SEARCH_CX;

// Option C: Scraping Fallback (BeautifulSoup 스타일, 브라우저 없이)
async function fetchSERPFallback(keyword: string) {
  const url = `https://www.google.com/search?q=${encodeURIComponent(keyword)}&hl=en&gl=us`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });
  
  const html = await res.text();
  
  // 정규식으로 제목 추출 (간단 파싱)
  const titleRegex = /<h3[^>]*>(.*?)<\/h3>/gi;
  const titles = [];
  let match;
  
  while ((match = titleRegex.exec(html)) !== null) {
    const cleanTitle = match[1].replace(/<[^>]*>/g, '').trim();
    if (cleanTitle && cleanTitle.length > 5) {
      titles.push(cleanTitle);
    }
  }
  
  return titles.slice(0, 10);
}
```

**우선순위**:
1. SerpAPI (있으면)
2. Google Custom Search (있으면)
3. HTML Scraping Fallback (항상 작동)

---

### 2.2 제목 패턴 분석

**분석 항목**:
```typescript
interface HeadlinePattern {
  // 구조 분석
  avgLength: number;              // 평균 글자 수
  wordCount: number;              // 평균 단어 수
  
  // 패턴 분석
  commonPrefixes: string[];       // ["How to", "Best", "Top 10"]
  commonSuffixes: string[];       // ["2026", "Guide", "Explained"]
  
  // 키워드 분석
  mostUsedWords: Array<{ word: string; count: number }>;
  
  // 포맷 분석
  hasNumbers: boolean;            // "10 Ways", "5 Steps"
  hasYear: boolean;               // "2026", "2025"
  hasQuestionMark: boolean;       // "How to...?"
  
  // 경쟁 강도
  brandDomination: number;        // 브랜드 도메인 비율 (0-1)
  diversityScore: number;         // 제목 다양성 (0-1)
}

function analyzeHeadlines(titles: string[]): HeadlinePattern {
  const words = titles.flatMap(t => t.toLowerCase().split(/\s+/));
  const wordFreq = words.reduce((acc, w) => {
    acc[w] = (acc[w] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  return {
    avgLength: avg(titles.map(t => t.length)),
    wordCount: avg(titles.map(t => t.split(/\s+/).length)),
    commonPrefixes: findCommonPrefixes(titles),
    commonSuffixes: findCommonSuffixes(titles),
    mostUsedWords: Object.entries(wordFreq)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([word, count]) => ({ word, count })),
    hasNumbers: titles.some(t => /\d+/.test(t)),
    hasYear: titles.some(t => /202[4-7]/.test(t)),
    hasQuestionMark: titles.some(t => t.includes("?")),
    brandDomination: calculateBrandRatio(titles),
    diversityScore: calculateDiversity(titles)
  };
}
```

---

### 2.3 콘텐츠 갭 발견

**갭 탐지 로직**:
```typescript
interface ContentGap {
  missingAngles: string[];        // 경쟁자가 다루지 않은 각도
  underservedQuestions: string[]; // PAA에 있지만 상위 10개에 없는 질문
  opportunityKeywords: string[];  // 제목에 없는 롱테일
  differentiationIdeas: string[]; // AI 생성 차별화 아이디어
}

async function findContentGaps(
  keyword: string,
  serpTitles: string[],
  paaData: PAAData
): Promise<ContentGap> {
  // 1. PAA 질문 중 제목에 없는 것 찾기
  const underserved = paaData.paaQuestions.filter(q => 
    !serpTitles.some(title => 
      title.toLowerCase().includes(q.toLowerCase().slice(0, 20))
    )
  );
  
  // 2. 경쟁자 제목에 없는 각도
  const allTitlesText = serpTitles.join(" ").toLowerCase();
  const missingAngles = [];
  
  const angleChecks = [
    { angle: "비용 비교", keywords: ["cost", "price", "cheap", "expensive"] },
    { angle: "초보자 가이드", keywords: ["beginner", "start", "basic", "simple"] },
    { angle: "실수 방지", keywords: ["mistake", "avoid", "error", "wrong"] },
    { angle: "케이스 스터디", keywords: ["example", "case study", "real", "story"] },
    { angle: "체크리스트", keywords: ["checklist", "steps", "process", "how to"] },
    { angle: "최신 업데이트", keywords: ["2026", "2027", "new", "latest", "update"] },
  ];
  
  angleChecks.forEach(({ angle, keywords }) => {
    if (!keywords.some(kw => allTitlesText.includes(kw))) {
      missingAngles.push(angle);
    }
  });
  
  return {
    missingAngles,
    underservedQuestions: underserved.slice(0, 5),
    opportunityKeywords: [], // 다음 단계에서 AI가 생성
    differentiationIdeas: [] // AI가 생성
  };
}
```

---

## 🔹 Phase 3: AI 전략 생성 (신규)

### 3.1 Gemini API를 통한 콘텐츠 전략 수립

**입력 데이터**:
```typescript
interface StrategyInput {
  focusKeyword: string;
  serpTitles: string[];
  headlinePattern: HeadlinePattern;
  contentGaps: ContentGap;
  paaQuestions: string[];
  redditInsights: string[];
}
```

**AI 프롬프트 구조**:
```typescript
async function generateContentStrategy(input: StrategyInput) {
  const prompt = `
당신은 SEO 전략가입니다. 다음 데이터를 분석하여 구체적인 콘텐츠 전략을 수립하세요.

# 타겟 키워드
${input.focusKeyword}

# 현재 검색 상위 10개 제목
${input.serpTitles.map((t, i) => `${i + 1}. ${t}`).join('\n')}

# 제목 패턴 분석
- 평균 길이: ${input.headlinePattern.avgLength}자
- 자주 사용되는 단어: ${input.headlinePattern.mostUsedWords.map(w => w.word).join(', ')}
- 공통 접두사: ${input.headlinePattern.commonPrefixes.join(', ')}
- 숫자 사용: ${input.headlinePattern.hasNumbers ? '있음' : '없음'}
- 연도 포함: ${input.headlinePattern.hasYear ? '있음' : '없음'}

# 콘텐츠 갭 (경쟁자가 놓친 영역)
${input.contentGaps.missingAngles.map(a => `- ${a}`).join('\n')}

# People Also Ask
${input.paaQuestions.slice(0, 5).map(q => `- ${q}`).join('\n')}

# Reddit 실제 사용자 질문
${input.redditInsights.slice(0, 3).map(r => `- ${r}`).join('\n')}

---

다음 형식으로 JSON 응답을 생성하세요:

{
  "differentiationAngles": [
    "각도 1: 구체적 설명",
    "각도 2: 구체적 설명",
    "각도 3: 구체적 설명"
  ],
  "opportunities": [
    "기회요인 1",
    "기회요인 2",
    "기회요인 3"
  ],
  "risks": [
    "위험요인 1",
    "위험요인 2"
  ],
  "successProbability": 85,
  "reasoning": "성공 가능성 점수 산정 근거",
  "seoTactics": [
    "전술 1: 구체적 실행 방법",
    "전술 2: 구체적 실행 방법",
    "전술 3: 구체적 실행 방법"
  ],
  "recommendedTitle": "차별화된 제목 제안",
  "targetWordCount": 2500,
  "keyH2Sections": [
    "섹션 1 제목",
    "섹션 2 제목",
    "섹션 3 제목"
  ]
}
`;

  const response = await callGoogleGenAI('google/gemini-2.5-flash:free', prompt, {
    temperature: 0.4, // 창의성과 일관성 균형
    maxOutputTokens: 2048
  });
  
  return JSON.parse(response);
}
```

**출력 구조**:
```typescript
interface ContentStrategy {
  differentiationAngles: string[];     // 차별화 각도 3가지
  opportunities: string[];             // 기회요인 3가지
  risks: string[];                     // 위험요인 2가지
  successProbability: number;          // 0-100 점수
  reasoning: string;                   // 점수 산정 근거
  seoTactics: string[];                // 구체적 SEO 공략법 3가지
  recommendedTitle: string;            // AI 추천 제목
  targetWordCount: number;             // 권장 글자 수
  keyH2Sections: string[];             // 주요 섹션 구조
}
```

---

## 🔹 Phase 4: 다중 소스 실시간 검증

### 4.1 소스별 메트릭 수집

**Reddit 검증** (이미 구현됨):
```typescript
async function verifyOnReddit(keyword: string) {
  const posts = await fetchRedditRelevant(keyword, 10);
  
  // JSON API에서 메타데이터 추출
  const url = `https://www.reddit.com/search.json?q=${encodeURIComponent(keyword)}&sort=relevance&limit=10`;
  const res = await fetch(url, { headers: { 'User-Agent': '...' } });
  const data = await res.json();
  
  const metrics = data.data.children.map((post: any) => ({
    title: post.data.title,
    score: post.data.score,
    comments: post.data.num_comments,
    created: new Date(post.data.created_utc * 1000),
    subreddit: post.data.subreddit
  }));
  
  return {
    totalPosts: metrics.length,
    avgScore: avg(metrics.map(m => m.score)),
    avgComments: avg(metrics.map(m => m.comments)),
    latestPostDate: max(metrics.map(m => m.created)),
    freshnessScore: calculateFreshness(metrics), // 최근 7일 이내 게시물 비율
    engagementScore: calculateEngagement(metrics) // 댓글+점수 기준
  };
}
```

**Wikipedia 검증** (이미 구현됨):
```typescript
async function verifyOnWikipedia(keyword: string) {
  const results = await fetchWikipedia(keyword);
  
  return {
    exists: results.length > 0,
    exactMatch: results.some(r => r.toLowerCase() === keyword.toLowerCase()),
    relatedTopics: results.length,
    authorityScore: results.length > 0 ? (results.some(r => r.includes(keyword)) ? 100 : 50) : 0
  };
}
```

**StackExchange 검증** (이미 구현됨):
```typescript
async function verifyOnStackExchange(keyword: string) {
  const results = await fetchStackExchange(keyword, 'medicalsciences');
  
  return {
    totalQuestions: results.length,
    avgScore: avg(results.map(r => r.score)),
    avgAnswers: avg(results.map(r => r.answerCount)),
    topQuestion: results[0]?.title || null,
    viewsEstimate: sum(results.map(r => r.score * 10)), // 간접 추정
    expertInterest: results.length > 0 ? (results[0].answerCount > 0 ? 100 : 50) : 0
  };
}
```

**Google Trends 검증** (이미 구현됨):
```typescript
async function verifyOnTrends(keyword: string) {
  // Google Trends RSS는 daily만 제공하므로, 키워드 포함 여부만 체크
  const dailyTrends = await fetchGoogleTrendsDaily('US');
  
  return {
    isTrendingToday: dailyTrends.some(t => t.toLowerCase().includes(keyword.toLowerCase())),
    trendingRelevance: dailyTrends.filter(t => 
      keyword.split(' ').some(kw => t.toLowerCase().includes(kw.toLowerCase()))
    ).length
  };
}
```

---

### 4.2 통합 검증 스코어

```typescript
interface MultiSourceVerification {
  reddit: {
    posts: number;
    avgComments: number;
    freshnessScore: number;    // 0-100
    engagementScore: number;   // 0-100
  };
  wikipedia: {
    exists: boolean;
    authorityScore: number;    // 0-100
  };
  stackExchange: {
    questions: number;
    expertInterest: number;    // 0-100
  };
  trends: {
    isTrending: boolean;
    relevance: number;         // 0-10
  };
  
  // 종합 점수
  overallVerification: number; // 0-100
  honeyKeywordFlag: boolean;   // 경쟁 거의 없음
}

function calculateOverallVerification(data: MultiSourceVerification) {
  const weights = {
    redditFreshness: 0.25,
    redditEngagement: 0.20,
    wikiAuthority: 0.15,
    stackExpert: 0.15,
    trending: 0.25
  };
  
  const score = 
    (data.reddit.freshnessScore * weights.redditFreshness) +
    (data.reddit.engagementScore * weights.redditEngagement) +
    (data.wikipedia.authorityScore * weights.wikiAuthority) +
    (data.stackExchange.expertInterest * weights.stackExpert) +
    ((data.trends.isTrending ? 100 : data.trends.relevance * 10) * weights.trending);
  
  // 꿀 키워드 판정: Reddit 활발하지만 경쟁 낮음
  const honeyFlag = 
    data.reddit.avgComments > 10 &&
    data.reddit.freshnessScore > 70 &&
    !data.wikipedia.exists; // Wikipedia 없음 = 아직 경쟁 적음
  
  return {
    overallVerification: Math.round(score),
    honeyKeywordFlag: honeyFlag
  };
}
```

---

## 🔹 Phase 5: 최종 스코어링

### 5.1 가중치 체계 (사용자 요청 기준)

```typescript
// 총 28점 만점 → 100점 환산
const SCORING_WEIGHTS = {
  freshness: 5,        // 최신성 (Reddit 최근 게시물, Trends)
  views: 5,            // 조회수 (StackExchange views, Reddit score)
  exposure: 5,         // 노출도 (Autocomplete 순위, SERP 포지션)
  persistence: 4,      // 지속성 (에버그린 vs 시즌)
  repeatability: 4,    // 반복성 (연간 반복 주제 여부)
  engagement: 3,       // 댓글/이슈성 (Reddit comments, Stack answers)
  intent: 1,           // 수익의도 (최소화)
  structure: 1         // 키워드 구조 (최소화)
};
```

### 5.2 최종 점수 계산

```typescript
interface FinalScore {
  rawScore: number;              // 0-100
  normalizedScore: number;       // 20-99
  difficulty: string;            // "경쟁 높음" | "경쟁 중간" | "경쟁 낮음"
  successProbability: number;    // AI 생성 점수 (0-100)
  combinedScore: number;         // (rawScore + successProbability) / 2
  honeyKeyword: boolean;         // 꿀 키워드 플래그
}

function calculateFinalScore(
  keywordMetrics: KeywordMetrics,
  multiSource: MultiSourceVerification,
  aiStrategy: ContentStrategy
): FinalScore {
  const factors = {
    freshness: multiSource.reddit.freshnessScore,
    views: Math.min(100, (multiSource.stackExchange.questions * 10 + multiSource.reddit.posts * 5)),
    exposure: keywordMetrics.documentExposure,
    persistence: keywordMetrics.persistence,
    repeatability: keywordMetrics.repeatability,
    engagement: multiSource.reddit.engagementScore,
    intent: keywordMetrics.intentValue,
    structure: keywordMetrics.keywordStructure
  };
  
  const totalWeight = Object.values(SCORING_WEIGHTS).reduce((a, b) => a + b, 0); // 28
  
  const rawScore = Object.entries(SCORING_WEIGHTS).reduce((sum, [key, weight]) => {
    return sum + (factors[key as keyof typeof factors] * weight / totalWeight);
  }, 0);
  
  const normalized = Math.min(99, Math.max(20, Math.round(rawScore)));
  
  const combinedScore = Math.round((normalized + aiStrategy.successProbability) / 2);
  
  return {
    rawScore,
    normalizedScore: normalized,
    difficulty: normalized > 72 ? "경쟁 낮음" : normalized > 50 ? "경쟁 중간" : "경쟁 높음",
    successProbability: aiStrategy.successProbability,
    combinedScore,
    honeyKeyword: multiSource.honeyKeywordFlag && combinedScore > 75
  };
}
```

---

## 🔹 Phase 6: 프롬프트 빌더 통합

### 6.1 최종 출력 구조

```typescript
interface EnhancedKeywordResult {
  // 기본 정보
  focusKeyword: string;
  longTails: Array<{
    keyword: string;
    score: number;
    difficulty: string;
    intent: string;
    volume: string;
    freshness: string;
  }>;
  
  // ⭐ SERP 분석 (신규)
  competitorAnalysis: {
    topHeadlines: string[];
    headlinePattern: HeadlinePattern;
    contentGaps: ContentGap;
  };
  
  // ⭐ AI 전략 (신규)
  contentStrategy: ContentStrategy;
  
  // ⭐ 다중 소스 검증 (강화)
  verification: MultiSourceVerification;
  
  // ⭐ 최종 점수 (통합)
  finalScore: FinalScore;
  
  // PAA
  peopleAlsoAsk: string[];
  
  // 프롬프트 빌더용 데이터
  promptPayload: {
    focusKeyword: string;
    targetLongTail: string;
    contentAngle: string;           // AI 추천 각도
    differentiationPoints: string[]; // 차별화 포인트
    seoTactics: string[];           // SEO 공략법
    recommendedStructure: string[]; // H2 섹션 구조
    targetWordCount: number;
    competitorBenchmark: string;    // "상위 10개 평균 길이: 2,300단어"
  };
}
```

### 6.2 프롬프트 빌더 전달 포맷

```typescript
function buildPromptPayload(result: EnhancedKeywordResult) {
  return {
    focusKeyword: result.focusKeyword,
    targetLongTail: result.longTails[0].keyword, // 최고 점수
    
    contentAngle: result.contentStrategy.differentiationAngles[0],
    
    differentiationPoints: result.contentStrategy.differentiationAngles,
    
    seoTactics: result.contentStrategy.seoTactics,
    
    recommendedStructure: result.contentStrategy.keyH2Sections,
    
    targetWordCount: result.contentStrategy.targetWordCount,
    
    competitorBenchmark: `상위 10개 평균 제목 길이: ${result.competitorAnalysis.headlinePattern.avgLength}자`,
    
    // 추가 컨텍스트
    contentGaps: result.competitorAnalysis.contentGaps.missingAngles,
    paaQuestions: result.peopleAlsoAsk.slice(0, 5),
    
    // 메타 정보
    honeyKeyword: result.finalScore.honeyKeyword,
    successProbability: result.finalScore.successProbability,
    
    // 프롬프트 템플릿에 주입될 전체 컨텍스트
    fullContext: `
[SEO 전략 브리핑]

📌 타겟 키워드: ${result.focusKeyword}
🎯 롱테일 타겟: ${result.longTails[0].keyword}
⭐ 성공 가능성: ${result.finalScore.successProbability}점 / 100점
${result.finalScore.honeyKeyword ? '🍯 꿀 키워드 (경쟁 거의 없음!)' : ''}

[경쟁 현황]
${result.competitorAnalysis.topHeadlines.slice(0, 5).map((t, i) => `${i + 1}. ${t}`).join('\n')}

[콘텐츠 갭 (경쟁자가 놓친 영역)]
${result.competitorAnalysis.contentGaps.missingAngles.map(a => `- ${a}`).join('\n')}

[차별화 전략]
${result.contentStrategy.differentiationAngles.map((a, i) => `${i + 1}. ${a}`).join('\n')}

[SEO 공략법]
${result.contentStrategy.seoTactics.map((t, i) => `${i + 1}. ${t}`).join('\n')}

[추천 콘텐츠 구조]
${result.contentStrategy.keyH2Sections.map((s, i) => `H2-${i + 1}: ${s}`).join('\n')}

[People Also Ask]
${result.peopleAlsoAsk.slice(0, 5).map(q => `- ${q}`).join('\n')}

[기대 효과]
- 기회요인: ${result.contentStrategy.opportunities.join(', ')}
- 주의사항: ${result.contentStrategy.risks.join(', ')}
    `.trim()
  };
}
```

---

## 🔧 구현 단계별 계획

### **Step 1: SERP 분석 모듈 구축** (1-2시간)
- [ ] `lib/serp/analyzer.ts` 생성
- [ ] HTML Scraping Fallback 구현
- [ ] 제목 패턴 분석 함수
- [ ] 콘텐츠 갭 탐지 로직

### **Step 2: AI 전략 생성 통합** (30분-1시간)
- [ ] `services/ai-strategy.ts` 생성
- [ ] Gemini API 호출 프롬프트 작성
- [ ] JSON 파싱 & 검증

### **Step 3: 다중 소스 통합 검증** (30분)
- [ ] 기존 fetcher 함수 활용
- [ ] `calculateOverallVerification` 구현
- [ ] 꿀 키워드 플래그 로직

### **Step 4: 스코어링 업데이트** (30분)
- [ ] `app/api/keywords/generate/route.ts` 수정
- [ ] AI 점수 + 기존 점수 통합
- [ ] 최종 출력 구조 변경

### **Step 5: 프롬프트 빌더 통합** (30분)
- [ ] `buildPromptPayload` 함수 구현
- [ ] `SemiAutoBlogger` 컴포넌트에 전달
- [ ] UI에서 전략 표시

### **Step 6: 테스트 & 검증** (1시간)
- [ ] 실제 키워드로 E2E 테스트
- [ ] 성능 최적화 (병렬 처리)
- [ ] 에러 핸들링 강화

---

## 📊 예상 결과물 예시

**입력**: `"medicare part b premium"`

**출력**:
```json
{
  "focusKeyword": "medicare part b premium",
  "longTails": [
    {
      "keyword": "medicare part b premium 2026 income limits",
      "score": 94,
      "difficulty": "경쟁 낮음",
      "honeyKeyword": true
    }
  ],
  "competitorAnalysis": {
    "topHeadlines": [
      "Medicare Part B Premium 2026: What You Need to Know",
      "2026 Medicare Costs: Part B Premium Increases Explained",
      ...
    ],
    "contentGaps": {
      "missingAngles": ["소득 구간별 시뮬레이션", "절약 전략", "항소 방법"],
      "underservedQuestions": [
        "Can I lower my Part B premium if my income drops?",
        "What happens if I can't afford Part B premium?"
      ]
    }
  },
  "contentStrategy": {
    "differentiationAngles": [
      "소득 구간별 프리미엄 계산기 제공 (경쟁자 없음)",
      "실제 절약 케이스 스터디 3가지",
      "IRMAA 항소 단계별 가이드"
    ],
    "successProbability": 88,
    "seoTactics": [
      "H1에 '2026 + income limits' 명시",
      "계산기 인터액티브 요소 추가",
      "Featured Snippet 타겟: PAA 질문 5개 각각 Q&A 형식"
    ]
  },
  "verification": {
    "reddit": { "avgComments": 23, "freshnessScore": 92 },
    "honeyKeywordFlag": true
  },
  "finalScore": {
    "combinedScore": 91,
    "honeyKeyword": true
  }
}
```

---

## ✅ 다음 단계

이 설계서를 기반으로 단계별 구현을 시작합니다. 우선순위는:

1. **먼저**: AI 전략 생성 (가장 임팩트 큼)
2. **그다음**: 다중 소스 검증 강화
3. **마지막**: SERP 분석 (시간 걸림)

진행 방법을 선택해주세요:
- A: AI 전략 생성부터 바로 구현
- B: 설계서 검토 후 수정사항 반영
- C: 전체 구현 일괄 진행 (2-3시간)
