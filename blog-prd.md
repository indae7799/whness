Product Requirements Document (PRD)
AI-Powered SEO Blog Auto-Publishing Platform
1. Executive Summary
Product Vision
Reddit, StackExchange, Google Trends 등 다양한 소스에서 자동으로 데이터를 수집하고, AI를 활용하여 SEO 최적화된 롱테일 키워드를 발굴한 후, Rank Math 80점 이상의 고품질 블로그 글을 자동 생성하여 WordPress에 발행하는 올인원 자동화 플랫폼.
Target Users

콘텐츠 마케터 (월 50+ 글 생산 필요)
SEO 전문가 (키워드 리서치 + 콘텐츠 생산 동시 진행)
블로거 (일관된 포스팅 스케줄 유지 필요)
에이전시 (다수 클라이언트 콘텐츠 관리)

Core Value Proposition
"시드 키워드만 입력하면, 24시간 내 SEO 완벽 블로그 글이 WordPress에 자동 발행"

2. Problem Statement
Current Pain Points

리서치 시간 과다: 키워드 조사만 2-4시간 소요
일관성 부족: 작성자마다 품질 편차 심함
SEO 최적화 어려움: Rank Math 80점 달성률 30% 미만
이미지 제작 병목: 이미지 제작에 추가 1-2시간
발행 지연: 수동 업로드로 인한 스케줄 관리 실패

Market Gap

기존 AI 글쓰기 도구: 키워드 리서치 미포함, SEO 점수 낮음
기존 키워드 도구: 글 작성 기능 없음
기존 자동화 도구: 품질 낮고 AI 티 남


3. Product Goals & Success Metrics
Primary Goals

시간 절감: 글 1개당 작업 시간 6시간 → 30분 단축 (90% 절감)
품질 보장: Rank Math 80점 이상 달성률 95%+
확장성: 월 100+ 글 자동 생산 가능
ROI 증명: 3개월 내 유기 트래픽 200% 증가

Success Metrics (KPIs)
MetricBaselineTarget (3개월)Target (6개월)Rank Math 평균 점수65점82점85점글 생성 완료 시간6시간30분20분Featured Snippet 노출률5%15%25%월 발행 글 수10개50개100개유기 트래픽 증가율-+150%+300%사용자 만족도 (NPS)-40+60+

4. User Personas
Persona 1: "바쁜 Sam" - 콘텐츠 마케터

배경: 스타트업 마케팅 팀, 혼자서 블로그/SNS 관리
목표: 월 50개 글 발행, SEO 트래픽 3배 증가
Pain Point: 키워드 리서치 + 글 작성에 주 30시간 소요
Use Case: 매주 월요일 10개 시드 입력 → 금요일까지 자동 발행

Persona 2: "완벽주의자 Emily" - SEO 전문가

배경: 프리랜서 SEO 컨설턴트, 5개 클라이언트 관리
목표: 모든 글 Rank Math 85점+, Featured Snippet 노출
Pain Point: 고품질 유지하면서 물량 확보 불가능
Use Case: 클라이언트별 브랜드 톤 설정 → 자동 생성 → 검토 후 발행

Persona 3: "스케일러 David" - 에이전시 대표

배경: 콘텐츠 마케팅 에이전시, 20개 클라이언트
목표: 클라이언트당 월 30개 글 (총 600개), 팀 효율 3배
Pain Point: 작성자 10명 고용해도 품질 불균일
Use Case: 대시보드에서 20개 사이트 동시 관리, 배치 발행


5. Product Architecture
System Components
┌──────────────────────────────────────────────────────────┐
│                      Frontend (Web App)                      │
│  - Dashboard / Seed Input Form / Preview / Schedule Manager  │
└───────────────────┬──────────────────────────────────────┘
                    │
┌───────────────────┴──────────────────────────────────────┐
│                    Backend API (Node.js)                     │
│  - Queue Manager / Webhook Handler / Auth / Analytics       │
└───────────────────┬──────────────────────────────────────┘
                    │
         ┌──────────┼──────────┐
         │          │          │
┌────────▼────────┐ ┌─▼──────────┐ ┌▼─────────────┐
│  Research       │ │   AI       │ │  Publishing  │
│  Pipeline       │ │   Engine   │ │  Service     │
└─────────────────┘ └────────────┘ └──────────────┘
│                 │ │            │ │              │
│ • Reddit        │ │ • GPT-4o   │ │ • WordPress  │
│ • StackEx       │ │ • DALL-E-3 │ │ • Image      │
│ • G Trends      │ │ • Keywords │ │   Optimizer  │
│ • Wikipedia     │ │   Analysis │ │ • Scheduler  │
│ • RSS Feeds     │ │            │ │              │
│ • Autocomplete  │ │            │ │              │
└─────────────────┘ └────────────┘ └──────────────┘

6. Core Features & User Flow
Feature 1: Smart Content Creation (Manual + Auto Modes)

이 기능은 사용자가 직접 제어하는 Manual Mode와 완전 자동화된 Auto Mode를 모두 지원합니다.

#### Mode 1: Manual Mode (기본 - 사용자 제어)

**User Flow:**
1. 사용자 대시보드 접속
2. "새 글 작성" 버튼 클릭
3. 모드 선택 화면
   ├─ "직접 설정하기" (Manual)
   └─ "AI에게 맡기기" (Auto)
4. [Manual 선택 시] 시드 입력 폼 표시
   ├─ 주제 카테고리 선택 (Medicare, Health Insurance, etc.)
   ├─ 초기 시드 키워드 입력 (1-3개)
   ├─ 페르소나 선택/커스텀 (드롭다운 + 텍스트)
   └─ 리서치 소스 선택 (체크박스: Reddit, SE, Trends, etc.)
5. "자동 조사 시작" 버튼 클릭
6. 백그라운드 작업 시작
   ├─ Progress bar 표시 (리서치 0% → 100%)
   └─ 예상 완료 시간 표시 (약 5-10분)
**Technical Specs (Manual):**
```typescript
// Manual mode - 기존 로직 유지
interface ManualModeInput {
  seeds: string[];              // 사용자 입력 1-5개
  sources: string[];            // 사용자 선택
  persona: Persona;             // 사용자 선택/커스텀
  category: string;             // 사용자 선택
}
```

**Process:**

Seed expansion via Google Autocomplete (각 시드당 10개 확장)
Google Trends related queries (각 시드당 20개)
Reddit search (각 확장 키워드당 top 10 posts)
StackExchange search (각 확장 키워드당 top 10)
Wikipedia OpenSearch (각 확장 키워드당 top 5)
RSS feeds parsing (최근 30일)

Output:

200-500개 후보 키워드 리스트
각 키워드별 메트릭:

Search volume (Trends data)
Competition score (Reddit/SE post count)
Relevance score (AI 평가)
Trending status (증가/감소/안정)



Research Source Details (from RESEARCH_SOURCES_AND_SEEDS.md):
Reddit (Read-only JSON):
typescriptinterface RedditSearchOptions {
  endpoint: 'https://www.reddit.com/search.json' | 
            'https://www.reddit.com/r/{subreddits}/search.json';
  params: {
    q: string;              // query
    limit: number;          // default from options.limit
    sort: 'new';
    raw_json: '1';
    restrict_sr?: 'on';     // when subreddits provided
  };
  headers: {
    'User-Agent': string;
    'Accept': 'application/json';
    'Accept-Language': 'en-US,en;q=0.8';
  };
  timeout: 10000;           // ms, configurable
  fallback: {
    endpoint: 'https://www.reddit.com/search.rss';
    enabled: REDDIT_READONLY_ENABLED === 'true';
  };
}

// Default Subreddits
const DEFAULT_SUBREDDITS = [
  'medicare', 'healthinsurance', 'insurance', 
  'eldercare', 'caregiver', 'retirement', 
  'aging', 'socialsecurity'
];

// Throttling
const REDDIT_CONFIG = {
  requestDelay: process.env.REDDIT_REQUEST_DELAY_MS || 1000,
  userAgent: process.env.REDDIT_USER_AGENT,
  readonlyEnabled: process.env.REDDIT_READONLY_ENABLED === 'true'
};
Reddit OAuth (when available):
typescriptinterface RedditOAuthOptions {
  endpoint: 'https://oauth.reddit.com/search' | 
            'https://oauth.reddit.com/r/{subreddits}/search';
  params: {
    q: string;
    limit: number;
    sort: 'new';
    restrict_sr: 'on' | 'off';
  };
  headers: {
    'Authorization': `Bearer ${accessToken}`;
    'User-Agent': string;
  };
  timeout: 10000;
}
StackExchange:
typescriptinterface StackExchangeOptions {
  endpoint: 'https://api.stackexchange.com/2.3/search/advanced';
  params: {
    site: process.env.STACKEXCHANGE_SITE || 'medicalsciences';
    q: string;
    pagesize: number;       // options.limit
    sort: 'activity';
    order: 'desc';
    key?: string;           // STACKEXCHANGE_KEY if set
  };
  timeout: 10000;
}
Google Trends (Related Queries):
typescriptinterface GoogleTrendsOptions {
  // For ingestion
  ingest: {
    modifiers: ['medical', 'health', 'wellness', 'insurance'];
    geo: 'US';
    startTime: Date.now() - (365 * 24 * 60 * 60 * 1000); // 12 months
    hl: 'en-US';
  };
  // For seed expansion
  expansion: {
    geo: process.env.RESEARCH_TRENDS_GEO || 'US';
    hl: process.env.RESEARCH_TRENDS_HL || 'en-US';
    limit: process.env.RESEARCH_TRENDS_LIMIT || 10;
  };
  timeout: 10000;
}
Wikipedia OpenSearch:
typescriptinterface WikipediaOptions {
  endpoint: 'https://en.wikipedia.org/w/api.php';
  params: {
    action: 'opensearch';
    search: string;
    limit: number;
    namespace: '0';
    format: 'json';
  };
  headers: {
    'User-Agent': string;
    'Accept': 'application/json';
  };
  timeout: 20000;           // max(20000, options.timeoutMs)
}
Google Autocomplete:
typescriptinterface AutocompleteOptions {
  endpoint: 'https://suggestqueries.google.com/complete/search';
  params: {
    client: 'firefox';
    hl: process.env.RESEARCH_AUTOCOMPLETE_HL || 'en-US';
    q: string;
  };
  timeout: 10000;
}
CMS RSS:
typescriptinterface RSSOptions {
  endpoints: process.env.CMS_RSS_FEEDS?.split(',') || [];
  fields: ['title', 'link', 'pubDate', 'updated'];
  timeout: 10000;
}
Default Seed List (65 terms with weights):
typescriptconst DEFAULT_SEEDS = [
  { term: 'medicare basics', weight: 2 },
  { term: 'medicare eligibility age', weight: 2 },
  { term: 'medicare enrollment', weight: 3 },
  { term: 'medicare special enrollment period', weight: 3 },
  { term: 'medicare open enrollment', weight: 3 },
  { term: 'medicare annual enrollment', weight: 2 },
  { term: 'medicare part a coverage', weight: 2 },
  { term: 'medicare part b coverage', weight: 2 },
  { term: 'medicare part d coverage', weight: 2 },
  { term: 'medicare advantage vs medigap', weight: 4 },
  { term: 'medigap plan g', weight: 3 },
  { term: 'medigap plan n', weight: 3 },
  { term: 'medicare part a deductible', weight: 3 },
  { term: 'medicare part b deductible', weight: 3 },
  { term: 'medicare part b premium', weight: 3 },
  { term: 'medicare part b excess charges', weight: 3 },
  { term: 'medicare part d donut hole', weight: 3 },
  { term: 'medicare part d coverage gap', weight: 3 },
  { term: 'medicare part d late enrollment penalty', weight: 3 },
  { term: 'medicare advantage open enrollment period', weight: 4 },
  { term: 'medicare initial enrollment period', weight: 3 },
  { term: 'medicare special enrollment period rules', weight: 4 },
  { term: 'medicare annual notice of change', weight: 2 },
  { term: 'medicare plan compare checklist', weight: 2 },
  { term: 'medicare enrollment documents needed', weight: 3 },
  { term: 'medicare coverage after retirement', weight: 2 },
  { term: 'medicare coverage while traveling', weight: 2 },
  { term: 'medicare advantage network restrictions', weight: 3 },
  { term: 'medicare out of network costs', weight: 3 },
  { term: 'medicare skilled nursing facility coverage', weight: 4 },
  { term: 'medicare home health eligibility', weight: 3 },
  { term: 'medicare physical therapy coverage', weight: 3 },
  { term: 'medicare durable medical equipment', weight: 3 },
  { term: 'medicare prior authorization', weight: 3 },
  { term: 'medicare appeal timeline', weight: 3 },
  { term: 'medicare billing dispute', weight: 4 },
  { term: 'medicare claim denial reasons', weight: 4 },
  { term: 'medicare claim status check', weight: 3 },
  { term: 'medicare savings program eligibility', weight: 3 },
  { term: 'extra help prescription drug plan', weight: 3 },
  { term: 'dual eligible medicare medicaid', weight: 3 },
  { term: 'medicare penalties', weight: 3 },
  { term: 'late enrollment penalty', weight: 3 },
  { term: 'medicare premium increase', weight: 2 },
  { term: 'irmaa medicare', weight: 3 },
  { term: 'medicare prescription drug coverage', weight: 2 },
  { term: 'medicare and dental vision hearing', weight: 2 },
  { term: 'medicare and home health care', weight: 2 },
  { term: 'medicare and nursing home', weight: 2 },
  { term: 'medicare billing errors', weight: 4 },
  { term: 'medicare claims denied', weight: 5 },
  { term: 'medicare claim denial', weight: 4 },
  { term: 'medicare appeal process', weight: 3 },
  { term: 'medicare claim status', weight: 3 },
  { term: 'medicare billing codes', weight: 4 },
  { term: 'medicare explanation of benefits', weight: 4 },
  { term: 'medicare appeals', weight: 3 },
  { term: 'medicare for caregivers', weight: 2 },
  { term: 'medicare after moving states', weight: 2 },
  { term: 'medicare advantage plan costs', weight: 4 },
  { term: 'medicare supplement enrollment', weight: 2 },
  { term: 'medicare and hospital stays', weight: 2 },
  { term: 'medicare and doctor visits', weight: 2 },
  { term: 'medicare coverage for seniors', weight: 2 },
  { term: 'medicare out of pocket costs', weight: 3 }
];
UI Components:
jsx<SeedInputForm>
  <CategorySelector options={categories} />
  <SeedKeywordInput placeholder="예: medicare enrollment" maxSeeds={5} />
  <PersonaSelector 
    presets={["뉴욕 은퇴자", "플로리다 이사자", "커스텀"]}
    customField={true}
  />
  <SourceCheckboxes 
    sources={["Reddit", "StackExchange", "Google Trends", "Wikipedia", "RSS"]}
    defaultSelected={["Reddit", "Google Trends"]}
  />
  <Button onClick={startResearch}>자동 조사 시작</Button>
</SeedInputForm>

<ResearchProgress>
  <ProgressBar value={progress} max={100} />
  <StatusText>Reddit 검색 중... (134/200 키워드)</StatusText>
  <EstimatedTime>약 7분 남음</EstimatedTime>
</ResearchProgress>
Parallel Research Implementation:
typescript// 병렬 처리 + 배치 최적화
async function parallelResearch(seeds: string[]) {
  const batchSize = 10; // 동시에 10개씩 처리
  
  const tasks = [
    () => getGoogleAutocomplete(seeds),          // 빠름 (~2s)
    () => getGoogleTrends(seeds),                // 빠름 (~3s)
    () => batchRedditSearch(seeds, batchSize),   // 병렬화 (~5-8min)
    () => batchStackExchange(seeds, batchSize),  // 병렬화 (~3-5min)
    () => getWikipedia(seeds),                   // 중간 (~1-2min)
    () => getRSSFeeds(seeds)                     // 빠름 (~1min)
  ];
  
  // 모든 소스 동시 시작
  const results = await Promise.allSettled(
    tasks.map(task => task())
  );
  
  // 실패한 소스는 로그만 남기고 계속 진행
  return mergeResults(results);
}

// Reddit API: 배치 요청 with rate limit handling
async function batchRedditSearch(keywords: string[], batchSize: number) {
  const batches = chunk(keywords, batchSize);
  const results = [];
  const delay = parseInt(process.env.REDDIT_REQUEST_DELAY_MS || '1000');
  
  for (const batch of batches) {
    const promises = batch.map(kw => 
      searchReddit(kw).catch(err => {
        console.warn(`Reddit search failed for "${kw}":`, err.message);
        return { keyword: kw, error: err, posts: [] };
      })
    );
    
    const batchResults = await Promise.all(promises);
    results.push(...batchResults);
    
    // Rate limit 회피
    if (batches.indexOf(batch) < batches.length - 1) {
      await sleep(delay);
    }
  }
  
  return results.filter(r => !r.error || r.posts?.length > 0);
}

// Reddit read-only fallback
async function searchReddit(keyword: string): Promise<RedditResult> {
  const readonlyEnabled = process.env.REDDIT_READONLY_ENABLED === 'true';
  
  try {
    // Try OAuth first if available
    if (process.env.REDDIT_CLIENT_ID && process.env.REDDIT_CLIENT_SECRET) {
      return await searchRedditOAuth(keyword);
    }
    
    // Fallback to read-only JSON
    if (readonlyEnabled) {
      return await searchRedditJSON(keyword);
    }
    
    throw new Error('REDDIT_ENV_MISSING');
  } catch (error) {
    // Final fallback to RSS
    if (readonlyEnabled) {
      console.log(`Falling back to Reddit RSS for "${keyword}"`);
      return await searchRedditRSS(keyword);
    }
    
    throw error;
  }
}
```

---

#### Mode 2: Auto Mode (3단계 워크플로)

> **핵심 철학**: "생성 즉시 발행"이 아닌 "**드래프트 → 검토 → 발행**" 파이프라인.
> 사용자가 최종 발행 전에 콘텐츠를 검토할 수 있도록 함.

**3-Step Workflow:**
```
STEP 1. AI 생성  →  STEP 2. 검토 및 재생성  →  STEP 3. 발행
```

**User Flow:**
```
1. 사용자가 /auto 페이지 접속
2. STEP 1: AI 생성
   ├─ 생성 수량 입력 (숫자 입력 필드, 기본값: 1)
   └─ "AI 글 자동생성" 버튼 클릭
3. 백그라운드에서 자동 실행 (이미지 자동 생성 포함, 토글 없음)
   ├─ 시드 자동 선택 (DEFAULT_SEEDS에서 weight 기반)
   ├─ 페르소나 자동 생성 (rotation)
   ├─ 리서치 실행 → 키워드 선택
   ├─ 글 생성 (최소 2,500단어, Rank Math 80점+)
   └─ 이미지 생성 (DALL-E 3 HD, 뉴욕 감성 프로페셔널 스타일)
4. STEP 2: 검토 및 재생성
   ├─ 생성된 글 목록 테이블에 드래프트 표시
   ├─ 각 글별 미리보기/검토 가능
   ├─ 불만족 시 "재생성" 버튼으로 개별 항목 재생성
   └─ 이미지 불만족 시 "이미지 재생성" 가능
5. STEP 3: 발행
   ├─ 체크박스로 발행할 항목 선택
   ├─ (선택) 예약 발행 날짜/시간 설정
   └─ "선택 항목 즉시 발행" 버튼 클릭
6. WordPress에 발행 완료
```

**UI Components (현재 구현됨):**
```jsx
<AutoModeSettings>
  {/* STEP 1: Generation */}
  <Card>
    <CardHeader>
      <CardTitle>Auto Content Generator</CardTitle>
      <CardSubtitle>
        STEP 1. AI 생성 → STEP 2. 검토 및 재생성 → STEP 3. 발행
      </CardSubtitle>
    </CardHeader>
    <CardContent>
      <QuantityInput 
        label="생성 수량" 
        type="number" 
        defaultValue={1} 
        min={1} 
        max={10} 
      />
      <Button variant="primary" onClick={handleGenerate}>
        AI 글 자동생성
      </Button>
      {/* 이미지 생성 토글 없음 - 자동으로 HD 품질 이미지 생성 */}
    </CardContent>
  </Card>

  {/* STEP 2: Review - 글 목록 테이블 */}
  <Card>
    <CardHeader>
      <CardTitle>생성된 글 목록 ({articles.length})</CardTitle>
    </CardHeader>
    <CardContent>
      <ArticleTable>
        <TableHeader>
          <Checkbox 
            checked={allSelected} 
            onCheckedChange={handleSelectAll} 
          />
          <Column>제목</Column>
          <Column>단어수</Column>
          <Column>예상 점수</Column>
          <Column>이미지</Column>
          <Column>액션</Column>
        </TableHeader>
        {articles.map(article => (
          <TableRow key={article.id}>
            <Checkbox 
              checked={selectedIds.includes(article.id)} 
              onCheckedChange={() => handleSelect(article.id)} 
            />
            <Cell>{article.title}</Cell>
            <Cell>{article.wordCount}단어</Cell>
            <Cell>{article.estimatedScore}/100</Cell>
            <Cell>
              <ImageThumbnail src={article.featuredImage} />
            </Cell>
            <Cell>
              {/* 개별 액션 버튼들 */}
              <Button size="sm" onClick={() => handlePreview(article)}>
                미리보기
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleRegenerateContent(article.id)}>
                글 재생성
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleRegenerateImage(article.id)}>
                이미지 재생성
              </Button>
              <Button size="sm" variant="destructive" onClick={() => handleDelete(article.id)}>
                삭제
              </Button>
            </Cell>
          </TableRow>
        ))}
      </ArticleTable>
      {articles.length === 0 && (
        <EmptyState>
          검토할 대기 중인 글이 없습니다.
          상단의 'AI 글 자동생성' 버튼을 눌러보세요.
        </EmptyState>
      )}
    </CardContent>
  </Card>

  {/* STEP 3: Publish - 발행 액션 바 */}
  <ActionBar>
    <SelectionStatus>{selectedCount}개 항목 선택됨</SelectionStatus>
    
    {/* 날짜/시간 선택 (예약 발행용) */}
    <DateTimePicker 
      placeholder="연도-월-일 시간:분" 
      value={scheduledDate}
      onChange={setScheduledDate}
    />
    
    {/* 즉시 발행 버튼 */}
    <Button 
      variant="success" 
      onClick={handlePublishNow}
      disabled={selectedCount === 0}
    >
      선택 항목 즉시 발행
    </Button>
    
    {/* 예약 발행 버튼 */}
    <Button 
      variant="outline" 
      onClick={handleSchedulePublish}
      disabled={selectedCount === 0 || !scheduledDate}
    >
      예약 발행
    </Button>
    
    {/* 선택 항목 일괄 삭제 */}
    <Button 
      variant="destructive" 
      onClick={handleDeleteSelected}
      disabled={selectedCount === 0}
    >
      선택 삭제
    </Button>
  </ActionBar>
</AutoModeSettings>
```

**핵심 특징:**
- **이미지 자동 생성**: 토글 없음. Auto Mode에서는 항상 DALL-E 3 HD 품질로 자동 생성
- **드래프트 우선**: 생성 후 바로 발행하지 않고 검토 대기 상태(status: 'draft')로 저장
- **재생성 기능**: 콘텐츠/이미지 개별 재생성 가능
- **배치 발행**: 체크박스로 여러 글 선택 → 즉시 발행 또는 예약 발행
- **삭제 기능**: 개별 글 삭제 + 선택 항목 일괄 삭제
- **예약 발행**: 날짜/시간 지정 후 "예약 발행" 버튼으로 스케줄링


**Technical Specs (Auto):**
```typescript
// src/services/automation/autoPipeline.ts

interface AutoModeConfig {
  articlesCount: number;         // 1, 5, 10
  publishStrategy: 'immediate' | 'scheduled';
  scheduleInterval?: number;     // minutes between posts
  category?: string;             // optional, default: 'medicare'
}

class AutoContentPipeline {
  async run(config: AutoModeConfig): Promise<AutomationResult[]> {
    const results: AutomationResult[] = [];
    
    for (let i = 0; i < config.articlesCount; i++) {
      try {
        // 1. 자동 시드 선택 (weight 기반, 최근 7일 내 사용 제외)
        const seed = await this.selectSeedAuto();
        
        // 2. 자동 페르소나 생성 (rotation)
        const persona = await this.generatePersonaAuto();
        
        // 3. 리서치 실행 (모든 소스)
        const researchJob = await this.runResearchAuto(seed, persona);
        
        // 4. 키워드 자동 선택 (AI 추천 Top 1)
        const keyword = await this.selectBestKeywordAuto(researchJob);
        
        // 5. 콘텐츠 생성
        const article = await this.generateContentAuto(keyword, researchJob, persona);
        
        // 6. 이미지 생성
        await this.generateImagesAuto(article);
        
        // 7. 자동 발행
        await this.publishArticleAuto(article, config);
        
        results.push({
          success: true,
          articleId: article.id,
          keyword: keyword.phrase,
          url: article.wpPostUrl
        });
        
        // 8. 다음 글을 위한 딜레이 (rate limit 방지)
        if (i < config.articlesCount - 1) {
          await this.sleep(config.scheduleInterval || 60000); // 기본 1분
        }
        
      } catch (error) {
        console.error(`Failed to generate article ${i + 1}:`, error);
        results.push({
          success: false,
          error: error.message
        });
      }
    }
    
    return results;
  }
  
  /**
   * 자동 시드 선택 (Weight 기반 + 최근 사용 제외)
   */
  private async selectSeedAuto(): Promise<string[]> {
    // Redis에서 최근 7일 사용 기록 조회
    const recentSeeds = await redis.smembers('recent_seeds:7d');
    
    // 사용 가능한 시드 필터링
    const availableSeeds = DEFAULT_SEEDS.filter(
      seed => !recentSeeds.includes(seed.term)
    );
    
    if (availableSeeds.length === 0) {
      // 모두 사용했으면 히스토리 리셋
      await redis.del('recent_seeds:7d');
      return this.selectSeedAuto();
    }
    
    // Weight 기반 확률적 선택
    const totalWeight = availableSeeds.reduce((sum, s) => sum + s.weight, 0);
    const random = Math.random() * totalWeight;
    
    let cumulative = 0;
    for (const seed of availableSeeds) {
      cumulative += seed.weight;
      if (random <= cumulative) {
        // Redis에 사용 기록 저장 (7일 TTL)
        await redis.sadd('recent_seeds:7d', seed.term);
        await redis.expire('recent_seeds:7d', 7 * 24 * 60 * 60);
        
        return [seed.term];
      }
    }
    
    // Fallback
    const selected = availableSeeds[0];
    await redis.sadd('recent_seeds:7d', selected.term);
    return [selected.term];
  }
  
  /**
   * 자동 페르소나 생성 (Rotation)
   */
  private async generatePersonaAuto(): Promise<Persona> {
    const personaTemplates = [
      {
        age: 65,
        location: 'New York, NY',
        situation: 'Just retired from corporate job, exploring Medicare options',
        budget: '$200-300/month',
        experience: 'First time dealing with Medicare',
        tone: '친구한테 조언하듯 편하게'
      },
      {
        age: 62,
        location: 'Miami, FL',
        situation: 'Moved from NY to FL, need to update Medicare enrollment',
        budget: '$150-250/month',
        experience: 'Had Medicare in NY, now switching',
        tone: '실수와 시행착오 솔직하게'
      },
      {
        age: 67,
        location: 'Phoenix, AZ',
        situation: 'Comparing Medicare Advantage vs Medigap plans',
        budget: '$300-400/month',
        experience: 'Currently on Original Medicare, considering switch',
        tone: '격려하는 느낌'
      },
      {
        age: 70,
        location: 'Seattle, WA',
        situation: 'Dealing with Medicare claim denial',
        budget: 'N/A',
        experience: 'Long-time Medicare user, first time appealing',
        tone: '차분하고 실용적'
      },
      {
        age: 63,
        location: 'Austin, TX',
        situation: 'Planning ahead for Medicare enrollment next year',
        budget: '$200-350/month',
        experience: 'Researching options before turning 65',
        tone: '꼼꼼하고 계획적'
      }
    ];
    
    // Redis에서 현재 인덱스 가져오기 (rotation)
    const key = 'persona:rotation:index';
    const currentIndex = parseInt(await redis.get(key) || '0');
    
    const persona = personaTemplates[currentIndex % personaTemplates.length];
    
    // 다음 인덱스로 업데이트
    await redis.set(key, ((currentIndex + 1) % personaTemplates.length).toString());
    
    return persona;
  }
  
  /**
   * 리서치 실행 (모든 소스 자동 활성화)
   */
  private async runResearchAuto(seeds: string[], persona: Persona): Promise<ResearchJob> {
    const job = await prisma.researchJob.create({
      data: {
        userId: 'SYSTEM_AUTO', // 자동 실행 표시
        seeds: seeds,
        sources: ['reddit', 'stackexchange', 'trends', 'wikipedia', 'rss'], // 모든 소스
        persona: persona,
        status: 'pending'
      }
    });
    
    // 백그라운드 큐에 추가
    await queue.add('research', { jobId: job.id });
    
    // 완료 대기
    return await this.waitForResearch(job.id);
  }
  
  private async waitForResearch(jobId: string): Promise<ResearchJob> {
    const maxWait = 20 * 60 * 1000; // 20분
    const pollInterval = 10 * 1000;  // 10초
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWait) {
      const job = await prisma.researchJob.findUnique({
        where: { id: jobId },
        include: { keywords: true }
      });
      
      if (job.status === 'completed') return job;
      if (job.status === 'failed') throw new Error(`Research failed: ${job.error}`);
      
      await this.sleep(pollInterval);
    }
    
    throw new Error('Research timeout');
  }
  
  /**
   * 키워드 자동 선택 (AI 추천 Top 1)
   */
  private async selectBestKeywordAuto(researchJob: ResearchJob): Promise<Keyword> {
    const keywords = researchJob.keywords.sort((a, b) => b.score - a.score);
    
    if (keywords.length === 0) {
      throw new Error('No keywords found');
    }
    
    const bestKeyword = keywords[0];
    
    // 최소 점수 검증
    if (bestKeyword.score < 70) {
      throw new Error(`Best keyword score too low: ${bestKeyword.score}`);
    }
    
    await prisma.keyword.update({
      where: { id: bestKeyword.id },
      data: { selected: true }
    });
    
    return bestKeyword;
  }
  
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export { AutoContentPipeline, AutoModeConfig };
```

**UI Components (Mode Selection):**
```jsx
// app/(dashboard)/articles/new/page.tsx

<ModeSelectionScreen>
  <Header>
    <Title>어떻게 글을 작성하시겠어요?</Title>
    <Subtitle>필요에 맞는 방식을 선택하세요</Subtitle>
  </Header>
  
  <ModeCards>
    {/* Manual Mode */}
    <ModeCard onClick={() => setMode('manual')}>
      <ModeIcon>✍️</ModeIcon>
      <ModeTitle>직접 설정하기</ModeTitle>
      <ModeDescription>
        키워드, 페르소나, 소스를 직접 선택하고
        <br />AI가 고품질 콘텐츠를 생성합니다
      </ModeDescription>
      <ModeBenefits>
        <Benefit>✓ 완전한 제어</Benefit>
        <Benefit>✓ 맞춤형 콘텐츠</Benefit>
        <Benefit>✓ 즉시 시작</Benefit>
      </ModeBenefits>
      <ModeButton>직접 설정 시작</ModeButton>
      <ModeTime>예상 시간: 2-3분 설정</ModeTime>
    </ModeCard>
    
    {/* Auto Mode */}
    <ModeCard onClick={() => setMode('auto')} featured>
      <ModeBadge>🤖 추천</ModeBadge>
      <ModeIcon>⚡</ModeIcon>
      <ModeTitle>AI에게 맡기기</ModeTitle>
      <ModeDescription>
        AI가 자동으로 키워드를 선택하고
        <br />고품질 콘텐츠를 생성합니다
      </ModeDescription>
      <ModeBenefits>
        <Benefit>✓ 완전 자동화</Benefit>
        <Benefit>✓ 손떼기 가능</Benefit>
        <Benefit>✓ 배치 생성</Benefit>
      </ModeBenefits>
      <ModeButton variant="primary">자동 생성 시작</ModeButton>
      <ModeTime>예상 시간: 클릭 한 번</ModeTime>
    </ModeCard>
  </ModeCards>
</ModeSelectionScreen>
```

---

### Feature 2: AI-Powered Long-Tail Keyword Selection

**User Flow:**
```
1. 리서치 완료 후 자동으로 키워드 분석 화면 표시
2. AI가 추천하는 Top 10 롱테일 키워드 표시
   ├─ 각 키워드별 점수 (0-100)
   ├─ 예상 난이도 (Easy/Medium/Hard)
   ├─ 예상 트래픽 (Low/Medium/High)
   └─ Featured Snippet 가능성 (%)
3. 사용자가 키워드 선택 (1개) 또는 AI 추천 수락
4. "이 키워드로 글 작성" 버튼 클릭
Keyword Scoring Algorithm:
typescriptfunction calculateKeywordScore(keyword: string, data: KeywordData): number {
  const scores = {
    searchVolume: normalizeVolume(data.trends) * 0.25,      // 25%
    competition: (1 - normalizeCompetition(data)) * 0.20,   // 20%
    relevance: data.aiRelevanceScore * 0.25,                // 25%
    trending: calculateTrendScore(data.trends) * 0.15,      // 15%
    snippetPotential: data.hasQAFormat ? 0.15 : 0.05       // 15%
  };
  
  return Object.values(scores).reduce((a, b) => a + b, 0) * 100;
}

function normalizeVolume(trendsData: TrendsData): number {
  // 0-100 range from Trends → 0-1
  const avgValue = trendsData.interest.reduce((a, b) => a + b, 0) / trendsData.interest.length;
  return Math.min(avgValue / 100, 1);
}

function normalizeCompetition(data: KeywordData): number {
  // More posts = higher competition = lower score
  const totalPosts = (data.redditPosts || 0) + (data.sePosts || 0);
  // Normalize: 0-50 posts = low (0-0.3), 51-200 = medium (0.3-0.7), 200+ = high (0.7-1)
  if (totalPosts <= 50) return totalPosts / 50 * 0.3;
  if (totalPosts <= 200) return 0.3 + ((totalPosts - 50) / 150 * 0.4);
  return Math.min(0.7 + ((totalPosts - 200) / 300 * 0.3), 1);
}

function calculateTrendScore(trendsData: TrendsData): number {
  const recent = trendsData.interest.slice(-3);
  const older = trendsData.interest.slice(0, 3);
  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
  const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
  
  if (recentAvg > olderAvg * 1.2) return 1.0;      // Strong uptrend
  if (recentAvg > olderAvg * 1.05) return 0.7;     // Mild uptrend
  if (recentAvg >= olderAvg * 0.95) return 0.5;    // Stable
  return 0.3;                                       // Downtrend
}
UI Components:
jsx<KeywordRecommendations>
  <AIBadge>AI 추천 Top 10</AIBadge>
  
  {keywords.map(kw => (
    <KeywordCard key={kw.id} selected={kw.id === selected}>
      <KeywordText>{kw.phrase}</KeywordText>
      <ScoreBadge score={kw.score}>{kw.score}/100</ScoreBadge>
      
      <MetricsRow>
        <Metric label="난이도" value={kw.difficulty} color="green" />
        <Metric label="트래픽" value={kw.traffic} color="blue" />
        <Metric label="Snippet" value={`${kw.snippetChance}%`} color="purple" />
      </MetricsRow>
      
      <TrendChart data={kw.trendData} />
      
      <ActionButtons>
        <Button onClick={() => selectKeyword(kw)}>선택</Button>
        <Button variant="ghost" onClick={() => viewDetails(kw)}>상세</Button>
      </ActionButtons>
    </KeywordCard>
  ))}
</KeywordRecommendations>
```

---

### Feature 3: AI Content Generation (Master Prompt Integration)

**User Flow:**
```
1. 키워드 선택 완료 후 "글 작성 시작" 버튼 활성화
2. 프롬프트 자동 구성
   ├─ 주제: 리서치 데이터 기반 갈등 상황 자동 생성
   ├─ 포커스 키워드: 선택된 롱테일 키워드
   ├─ 페르소나: 사용자 선택 + 리서치 인사이트 보강
   └─ 참고 정보: Reddit/SE top posts 요약
3. GPT-4o API 호출 (Master Prompt + 자동 구성된 입력)
4. 실시간 생성 진행 상황 표시
   ├─ "제목 생성 중..."
   ├─ "도입부 작성 중..."
   ├─ "본문 작성 중... (H2: 3/10)"
   └─ "FAQ 작성 중..."
5. 생성 완료 후 프리뷰 화면 표시
Prompt Auto-Construction Logic:
typescriptasync function constructPrompt(
  keyword: Keyword, 
  researchData: ResearchData, 
  persona: Persona
): Promise<PromptData> {
  // 1. 갈등 상황 자동 생성
  const topPosts = researchData.reddit.slice(0, 5);
  const commonPainPoints = extractPainPoints(topPosts);
  const conflictSituation = `
    ${persona.location}에서 ${commonPainPoints[0]}로 고생했는데,
    ${commonPainPoints[1]} 문제까지 겹쳤던 경험.
    결국 ${researchData.solutions[0]}로 해결한 스토리
  `;
  
  // 2. 참고 정보 구성
  const referenceInfo = {
    commonCosts: extractCosts(topPosts),
    timeline: extractTimelines(topPosts),
    commonMistakes: extractMistakes(topPosts),
    successFactors: extractSuccesses(topPosts)
  };
  
  // 3. 비교 옵션 추출
  const comparisonOptions = extractComparisonOptions(researchData);
  
  // 4. Master Prompt에 통합
  return {
    subject: conflictSituation,
    focusKeyword: keyword.phrase,
    persona: {
      age: persona.age,
      location: persona.location,
      situation: persona.situation,
      budget: referenceInfo.commonCosts[0],
      experience: "처음 직접 알아봄"
    },
    referenceInfo,
    tone: persona.tone || "친구한테 조언하듯 편하게",
    sectionsToInclude: [
      "실제로 든 비용 전부 공개",
      `${comparisonOptions.length}가지 옵션 비교`,
      "타임라인 (준비 → 실행 → 이후)"
    ],
    comparisonOptions
  };
}
GPT-4o API Integration:
typescriptasync function generateContent(promptData: PromptData): Promise<GeneratedContent> {
  const masterPrompt = await loadMasterPrompt(); // artifact에서 로드
  
  const fullPrompt = `
${masterPrompt}

---

주제: ${promptData.subject}

포커스 키워드: ${promptData.focusKeyword}

상황/페르소나:
${JSON.stringify(promptData.persona, null, 2)}

참고 정보:
${JSON.stringify(promptData.referenceInfo, null, 2)}

비교 대상:
${promptData.comparisonOptions.map((opt, i) => 
  `${i+1}. ${opt.name} - ${opt.pros}, ${opt.cons}`
).join('\n')}

톤: ${promptData.tone}

포함해줘야 할 섹션:
${promptData.sectionsToInclude.map(s => `- ${s}`).join('\n')}
  `;
  
  const response = await fetch("https://api.openai.계속오전 6:16com/v1/chat/completions", {
method: "POST",
headers: {
"Content-Type": "application/json",
"Authorization": Bearer ${process.env.OPENAI_API_KEY}
},
body: JSON.stringify({
model: "gpt-4o",
messages: [
{
role: "system",
content: "You are an expert SEO content writer specializing in Medicare and health insurance topics."
},
{ role: "user", content: fullPrompt }
],
max_tokens: 3000,
temperature: 0.7,
stream: true // 실시간 진행 상황 표시
})
});
return processStreamResponse(response);
}
// 스트리밍 응답 처리
async function processStreamResponse(response: Response) {
const reader = response.body?.getReader();
const decoder = new TextDecoder();
let content = '';
let currentSection = '';
while (true) {
const { done, value } = await reader!.read();
if (done) break;
const chunk = decoder.decode(value);
const lines = chunk.split('\n').filter(line => line.trim() !== '');

for (const line of lines) {
  if (line.startsWith('data: ')) {
    const data = line.slice(6);
    if (data === '[DONE]') continue;
    
    try {
      const parsed = JSON.parse(data);
      const delta = parsed.choices[0]?.delta?.content || '';
      content += delta;
      
      // 섹션 감지 및 진행 상황 업데이트
      if (delta.includes('##')) {
        currentSection = delta.split('##')[1]?.split('\n')[0] || '';
        await updateProgress({
          section: currentSection,
          wordCount: content.split(/\s+/).length
        });
      }
    } catch (e) {
      console.warn('Failed to parse SSE chunk:', e);
    }
  }
}
}
return {
content,
wordCount: content.split(/\s+/).length,
h2Count: (content.match(/^## /gm) || []).length,
h3Count: (content.match(/^### /gm) || []).length
};
}

**Cost Tracking:**
```typescript
async function trackAPIUsage(
  userId: string, 
  usage: { inputTokens: number; outputTokens: number }
) {
  const inputCost = (usage.inputTokens / 1_000_000) * 2.50;   // $2.50 per 1M
  const outputCost = (usage.outputTokens / 1_000_000) * 10.00; // $10.00 per 1M
  const totalCost = inputCost + outputCost;
  
  await prisma.usageStats.update({
    where: { userId },
    data: {
      articlesThisMonth: { increment: 1 },
      totalArticles: { increment: 1 },
      totalWordCount: { increment: usage.outputTokens }
    }
  });
  
  // 비용 로깅 (analytics용)
  await logCost({
    userId,
    type: 'gpt-4o',
    inputTokens: usage.inputTokens,
    outputTokens: usage.outputTokens,
    cost: totalCost
  });
  
  return totalCost;
}
```

**UI Components:**
```jsx
<ContentGenerationProgress>
  <ProgressSteps>
    <Step completed={step >= 1}>제목 생성</Step>
    <Step completed={step >= 2}>도입부 작성</Step>
    <Step active={step === 3}>본문 작성 (H2: {currentH2}/10)</Step>
    <Step>FAQ 작성</Step>
    <Step>최종 검토</Step>
  </ProgressSteps>
  
  <LivePreview>
    <MarkdownRenderer content={generatedContent} />
  </LivePreview>
  
  <MetricsBar>
    <Metric label="단어수" value={wordCount} target="2,500+ (최소)" />
    <Metric label="키워드 밀도" value={`${keywordDensity}%`} target="1-2%" />
    <Metric label="H2 개수" value={h2Count} target="8-12" />
    <Metric label="예상 Rank Math" value={estimatedScore} target="80+" />
  </MetricsBar>
</ContentGenerationProgress>
```

**Estimated Rank Math Score Calculation:**
```typescript
function calculateEstimatedScore(article: Article): number {
  const checks = {
    // Basic SEO (40 points)
    focusKeywordInTitle: article.title.toLowerCase().includes(article.focusKeyword.toLowerCase()) ? 10 : 0,
    focusKeywordInURL: article.slug.includes(article.focusKeyword.toLowerCase().replace(/\s+/g, '-')) ? 5 : 0,
    focusKeywordInMeta: article.metaDesc.toLowerCase().includes(article.focusKeyword.toLowerCase()) ? 5 : 0,
    focusKeywordDensity: (article.keywordDensity >= 1 && article.keywordDensity <= 2) ? 10 : (article.keywordDensity * 5),
    contentLength: article.wordCount >= 2500 ? 10 : (article.wordCount / 250),  // 최소 2,500단어 필수
    
    // Additional SEO (30 points)
    metaDescLength: (article.metaDesc.length >= 120 && article.metaDesc.length <= 160) ? 10 : 5,
    hasImages: article.images.length > 0 ? 10 : 0,
    imageAltText: article.images.every(img => img.altText) ? 5 : 0,
    internalLinks: article.content.match(/\[.*?\]\(\/.*?\)/g)?.length >= 3 ? 5 : 0,
    
    // Readability (20 points)
    h2Count: (article.h2Count >= 8 && article.h2Count <= 12) ? 10 : (article.h2Count / 1.2),
    h3Count: article.h3Count >= 5 ? 5 : article.h3Count,
    paragraphLength: 5, // Assume good (hard to measure pre-publish)
    
    // Schema & Advanced (10 points)
    hasFAQ: article.content.includes('## FAQ') || article.content.includes('자주 묻는 질문') ? 5 : 0,
    hasTableOfContents: article.h2Count >= 5 ? 5 : 0
  };
  
  const totalScore = Object.values(checks).reduce((sum, score) => sum + score, 0);
  return Math.min(Math.round(totalScore), 100);
}
```

---

### Feature 4: AI Image Generation & Insertion

**User Flow:**

글 생성 완료 후 자동으로 이미지 생성 단계 시작
AI가 글 내용 요약 및 핵심 테마 추출
이미지 생성 프롬프트 자동 구성
├─ Featured Image (인트로용)
└─ (Optional) H2 Section Images - Phase 2에서 추가
DALL-E-3 API 호출
생성된 이미지를 글의 적절한 위치에 자동 삽입
Alt text 자동 생성 (SEO 최적화)
최종 프리뷰 표시


**Image Generation Logic:**
```typescript
async function generateImages(article: Article): Promise<GeneratedImage[]> {
  const images: GeneratedImage[] = [];
  
  // 1. Featured Image (Hero) - MVP에서는 1개만
  const heroPrompt = generateHeroImagePrompt(article);
  const heroImage = await callDALLE3(heroPrompt);
  images.push({
    type: "featured",
    position: "after_h1",
    url: heroImage.url,
    altText: `${article.focusKeyword} - comprehensive guide`,
    prompt: heroPrompt
  });
  
  /* Phase 2: Section Images
  const h2Sections = extractH2Sections(article.content);
  for (const section of h2Sections.slice(0, 2)) {
    const sectionPrompt = generateSectionImagePrompt(section);
    const sectionImage = await callDALLE3(sectionPrompt);
    images.push({
      type: "section",
      position: `after_h2_${section.index}`,
      url: sectionImage.url,
      altText: `${article.focusKeyword} - ${section.title}`,
      prompt: sectionPrompt
    });
  }
  */
  
  return images;
}

function generateHeroImagePrompt(article: Article): string {
  const theme = extractMainTheme(article);
  
  // 뉴욕 감성 프로페셔널 스타일 (blog-prompt.md 기준)
  return `
    A high-resolution (HD) professional corporate photography style hero image for a blog post about "${article.focusKeyword}".
    
    Style Requirements:
    - NEW YORK CITY aesthetic: Modern, sophisticated, urban professional feel
    - Corporate Photography style: Clean, editorial quality
    - NO 3D characters, NO cartoonish illustrations, NO obvious AI artifacts
    - NO text, NO logos, NO watermarks
    
    Visual Elements:
    - Theme: ${theme}
    - Color palette: Muted professional tones with subtle warmth
    - Lighting: Natural, soft, professional studio quality
    - Composition: Clean negative space for text overlay in bottom third
    - 16:9 aspect ratio (1792x1024)
    
    Quality: Photorealistic, magazine-editorial quality, HD
  `.trim();
}

function extractMainTheme(article: Article): string {
  const keyword = article.focusKeyword.toLowerCase();
  
  // Theme mapping based on keywords
  if (keyword.includes('enrollment') || keyword.includes('eligibility')) {
    return 'calendar and forms symbolizing enrollment process';
  }
  if (keyword.includes('costs') || keyword.includes('premium') || keyword.includes('deductible')) {
    return 'calculator and medical bills showing healthcare costs';
  }
  if (keyword.includes('coverage') || keyword.includes('benefits')) {
    return 'shield and medical cross representing healthcare protection';
  }
  if (keyword.includes('appeal') || keyword.includes('denial') || keyword.includes('claim')) {
    return 'documents and gavel representing dispute resolution';
  }
  if (keyword.includes('compare') || keyword.includes('vs')) {
    return 'side-by-side comparison chart';
  }
  
  return 'healthcare and Medicare symbols in modern style';
}

async function callDALLE3(prompt: string): Promise<DALLEImage> {
  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1792x1024",    // 16:9 for hero images
      quality: "hd",         // HD 품질 필수 ($0.080) - 뉴욕 감성 프로페셔널 스타일
      style: "natural"
    })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`DALL-E-3 failed: ${error.error?.message || 'Unknown error'}`);
  }
  
  const data = await response.json();
  
  // 이미지 다운로드 및 최적화
  const optimizedImage = await optimizeImage(data.data[0].url);
  
  // WordPress Media Library에 업로드
  const wpMediaId = await uploadToWPMedia(optimizedImage);
  
  return {
    url: optimizedImage.url,
    wpMediaId,
    originalPrompt: prompt,
    revisedPrompt: data.data[0].revised_prompt
  };
}
```

**Image Optimization:**
```typescript
async function optimizeImage(imageUrl: string): Promise<OptimizedImage> {
  // 1. 이미지 다운로드
  const imageBuffer = await downloadImage(imageUrl);
  
  // 2. WebP 변환 + 압축 (sharp library)
  const optimized = await sharp(imageBuffer)
    .webp({ quality: 85 })
    .resize(1792, 1024, { fit: 'cover', position: 'center' })
    .toBuffer();
  
  // 3. CDN 업로드 (optional - Phase 2)
  // const cdnUrl = await uploadToCDN(optimized);
  
  // MVP: local storage or direct WP upload
  const tempPath = path.join('/tmp', `${uuidv4()}.webp`);
  await fs.writeFile(tempPath, optimized);
  
  return {
    path: tempPath,
    buffer: optimized,
    size: optimized.length,
    format: "webp",
    width: 1792,
    height: 1024
  };
}
```

**Content Insertion:**
```typescript
function insertImages(markdown: string, images: GeneratedImage[]): string {
  let updatedContent = markdown;
  
  // Featured image (H1 바로 아래)
  const featuredImg = images.find(img => img.type === "featured");
  if (featuredImg) {
    updatedContent = updatedContent.replace(
      /(# .+\n\n)/,
      `$1![${featuredImg.altText}](${featuredImg.url})\n\n`
    );
  }
  
  /* Phase 2: Section images
  const sectionImages = images.filter(img => img.type === "section");
  sectionImages.forEach((img, index) => {
    const h2Pattern = new RegExp(`(## .+\n\n)`, 'g');
    let h2Index = 0;
    updatedContent = updatedContent.replace(h2Pattern, (match) => {
      if (h2Index === img.position.split('_')[2]) {
        h2Index++;
        return `${match}![${img.altText}](${img.url})\n\n`;
      }
      h2Index++;
      return match;
    });
  });
  */
  
  return updatedContent;
}
```

**Cost Tracking:**
```typescript
async function trackImageCost(userId: string, quality: 'standard' | 'hd' = 'standard') {
  const cost = quality === 'standard' ? 0.040 : 0.080;
  
  await prisma.usageStats.update({
    where: { userId },
    data: {
      imagesThisMonth: { increment: 1 },
      totalImages: { increment: 1 }
    }
  });
  
  await logCost({
    userId,
    type: 'dall-e-3',
    quality,
    cost
  });
  
  return cost;
}
```

**UI Components:**
```jsx
<ImageGenerationProgress>
  <StatusHeader>AI 이미지 생성 중...</StatusHeader>
  
  <ImageList>
    {images.map((img, i) => (
      <ImageCard key={i} status={img.status}>
        <ImageType>{img.type}</ImageType>
        <ImagePreview src={img.url || placeholderImg} />
        <ImageMeta>
          <div>Alt: {img.altText}</div>
          <div>Size: {formatBytes(img.size)}</div>
          <StatusBadge>{img.status}</StatusBadge>
        </ImageMeta>
        {img.status === "completed" && (
          <Actions>
            <Button onClick={() => regenerate(i)}>재생성</Button>
            <Button onClick={() => editPrompt(i)}>수정</Button>
          </Actions>
        )}
      </ImageCard>
    ))}
  </ImageList>
  
  <CostInfo>
    이미지 생성 비용: ${(images.length * 0.04).toFixed(2)}
  </CostInfo>
</ImageGenerationProgress>
```

---

### Feature 5: WordPress Auto-Publishing

**User Flow:**

글 + 이미지 생성 완료 후 발행 옵션 선택 화면
발행 옵션 설정
├─ 즉시 발행 / 예약 발행
├─ 카테고리 선택
├─ 태그 자동 생성 (키워드 기반) 또는 수동 입력
├─ Featured Image 설정
└─ SEO 메타 데이터 확인 (Rank Math/Yoast)
"발행" 버튼 클릭
WordPress REST API 호출
발행 완료 후 확인 화면
├─ 발행된 글 URL
├─ Rank Math 최종 점수
└─ 예상 인덱싱 시간


**WordPress Integration:**
```typescript
async function publishToWordPress(
  article: Article, 
  options: PublishOptions
): Promise<PublishResult> {
  const wpApiUrl = `${options.siteUrl}/wp-json/wp/v2`;
  
  // 1. Featured Image 업로드
  const featuredImageId = await uploadFeaturedImage(
    article.images.find(img => img.type === "featured"),
    wpApiUrl,
    options.credentials
  );
  
  // 2. Post 데이터 구성
  const postData = {
    title: article.meta.title,
    content: article.contentWithImages,
    status: options.publishType === "immediate" ? "publish" : "future",
    date: options.publishType === "scheduled" ? options.scheduledDate : undefined,
    categories: options.categories,
    tags: options.tags || generateTags(article),
    featured_media: featuredImageId,
    meta: {
      // Rank Math meta
      rank_math_focus_keyword: article.focusKeyword,
      rank_math_description: article.meta.description,
      rank_math_title: article.meta.title,
      rank_math_robots: ["index", "follow"],
      rank_math_advanced_robots: [],
      
      // Yoast meta (optional fallback)
      _yoast_wpseo_focuskw: article.focusKeyword,
      _yoast_wpseo_metadesc: article.meta.description,
      _yoast_wpseo_title: article.meta.title
    }
  };
  
  // 3. POST 요청 with retry logic
  const result = await publishWithRetry(wpApiUrl, postData, options.credentials);
  
  // 4. 발행 후 작업
  await postPublishTasks(result.post, article);
  
  return {
    success: true,
    postId: result.post.id,
    url: result.post.link,
    rankMathScore: await checkRankMathScore(result.post.id, wpApiUrl, options.credentials),
    estimatedIndexTime: "24-48시간"
  };
}

async function publishWithRetry(
  wpApiUrl: string, 
  postData: any, 
  credentials: WPCredentials
): Promise<{ post: any }> {
  const maxRetries = 3;
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(`${wpApiUrl}/posts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Basic ${btoa(`${credentials.username}:${credentials.appPassword}`)}`
        },
        body: JSON.stringify(postData)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(`WordPress API error: ${error.message || response.statusText}`);
      }
      
      const post = await response.json();
      return { post };
      
    } catch (error: any) {
      lastError = error;
      
      // 복구 가능한 오류만 재시도
      if (isRecoverableError(error) && attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
        console.warn(`Publish attempt ${attempt} failed, retrying in ${delay}ms...`);
        await sleep(delay);
        continue;
      }
      
      // 복구 불가능하거나 최종 시도 실패
      break;
    }
  }
  
  // 모든 재시도 실패
  throw new Error(`Failed to publish after ${maxRetries} attempts: ${lastError?.message}`);
}

function isRecoverableError(error: any): boolean {
  const recoverableCodes = [
    'ETIMEDOUT',
    'ECONNRESET',
    'ENOTFOUND',
    429, // Rate limit
    502, // Bad gateway
    503, // Service unavailable
    504  // Gateway timeout
  ];
  
  return recoverableCodes.includes(error.code) || 
         recoverableCodes.includes(error.status);
}

async function uploadFeaturedImage(
  image: GeneratedImage | undefined,
  wpApiUrl: string,
  credentials: WPCredentials
): Promise<number> {
  if (!image) {
    throw new Error('No featured image provided');
  }
  
  // 이미지 파일 읽기
  const imageBuffer = await fs.readFile(image.path);
  
  // WordPress Media Library에 업로드
  const formData = new FormData();
  formData.append('file', new Blob([imageBuffer]), 'featured-image.webp');
  formData.append('title', image.altText);
  formData.append('alt_text', image.altText);
  
  const response = await fetch(`${wpApiUrl}/media`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${btoa(`${credentials.username}:${credentials.appPassword}`)}`
    },
    body: formData
  });
  
  if (!response.ok) {
    throw new Error(`Failed to upload image: ${response.statusText}`);
  }
  
  const media = await response.json();
  return media.id;
}

async function postPublishTasks(post: any, article: Article): Promise<void> {
  try {
    // 1. Google Search Console에 인덱싱 요청 (optional - Phase 2)
    // await submitToSearchConsole(post.link);
    
    // 2. 내부 링크 자동 업데이트 (Phase 2)
    // await updateInternalLinks(post, article);
    
    // 3. 소셜 미디어 자동 공유 (Phase 2)
    // if (article.options.autoShare) {
    //   await shareToSocial(post);
    // }
    
    // 4. Analytics 이벤트 전송
    await trackPublishEvent(post, article);
    
  } catch (error) {
    console.error('Post-publish tasks failed:', error);
    // 실패해도 발행은 완료된 상태이므로 에러를 던지지 않음
  }
}

async function checkRankMathScore(
  postId: number, 
  wpApiUrl: string,
  credentials: WPCredentials
): Promise<number> {
  try {
    // Rank Math REST API endpoint
    const response = await fetch(
      `${wpApiUrl.replace('/wp/v2', '')}/rankmath/v1/getPost/${postId}`,
      {
        headers: {
          'Authorization': `Basic ${btoa(`${credentials.username}:${credentials.appPassword}`)}`
        }
      }
    );
    
    if (!response.ok) {
      console.warn('Rank Math API not available, using estimated score');
      return calculateEstimatedScore(article);
    }
    
    const data = await response.json();
    return data.seo_score || 0;
    
  } catch (error) {
    console.warn('Failed to check Rank Math score:', error);
    return calculateEstimatedScore(article);
  }
}
```

**Scheduling System:**
```typescript
// Queue-based scheduling with BullMQ
async function schedulePublish(
  article: Article, 
  scheduledDate: Date
): Promise<ScheduledJob> {
  const delay = scheduledDate.getTime() - Date.now();
  
  if (delay <= 0) {
    throw new Error('Scheduled date must be in the future');
  }
  
  const job = await queue.add("publish-article", {
    articleId: article.id,
    scheduledDate: scheduledDate.toISOString(),
    options: article.publishOptions
  }, {
    delay,
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 60000 // 1분
    }
  });
  
  // DB에 스케줄 정보 저장
  await prisma.article.update({
    where: { id: article.id },
    data: {
      status: 'scheduled',
      scheduledFor: scheduledDate
    }
  });
  
  return {
    jobId: job.id!,
    scheduledFor: scheduledDate,
    status: "scheduled"
  };
}

// Queue processor
queue.process("publish-article", async (job) => {
  const { articleId, options } = job.data;
  
  try {
    const article = await prisma.article.findUnique({
      where: { id: articleId },
      include: { images: true }
    });
    
    if (!article) {
      throw new Error(`Article ${articleId} not found`);
    }
    
    const result = await publishToWordPress(article, options);
    
    // 발행 완료 알림
    await notifyUser(article.userId, {
      type: "publish-success",
      postUrl: result.url,
      rankMathScore: result.rankMathScore
    });
    
    // DB 업데이트
    await prisma.article.update({
      where: { id: articleId },
      data: {
        status: 'published',
        publishedAt: new Date(),
        wpPostId: result.postId,
        wpPostUrl: result.url,
        rankMathScore: result.rankMathScore
      }
    });
    
    return result;
    
  } catch (error) {
    console.error(`Failed to publish article ${articleId}:`, error);
    
    // 실패 알림
    await notifyUser(article.userId, {
      type: "publish-failed",
      articleId,
      error: error.message
    });
    
    // DB 업데이트
    await prisma.article.update({
      where: { id: articleId },
      data: {
        status: 'failed',
        error: error.message
      }
    });
    
    throw error;
  }
});
```

**UI Components:**
```jsx
<PublishOptions>
  <PublishTypeSelector>
    <Radio value="immediate" checked={type === "immediate"}>
      즉시 발행
    </Radio>
    <Radio value="scheduled" checked={type === "scheduled"}>
      예약 발행
      {type === "scheduled" && (
        <DateTimePicker 
          value={scheduledDate}
          onChange={setScheduledDate}
          min={new Date()}
        />
      )}
    </Radio>
  </PublishTypeSelector>
  
  <CategorySelector 
    options={wpCategories}
    selected={selectedCategories}
    onChange={setSelectedCategories}
  />
  
  <TagsInput
    value={tags}
    onChange={setTags}
    suggestions={suggestedTags}
    placeholder="태그 입력 또는 자동 생성된 태그 사용"
  />
  
  <FeaturedImagePreview 
    image={featuredImage}
    onRegenerate={regenerateFeaturedImage}
  />
  
  <SEOMetaPreview>
    <MetaTitle>{article.meta.title}</MetaTitle>
    <MetaURL>{siteUrl}/{article.slug}/</MetaURL>
    <MetaDescription>{article.meta.description}</MetaDescription>
    <RankMathScore score={estimatedScore}>
      예상 Rank Math 점수: {estimatedScore}/100
    </RankMathScore>
  </SEOMetaPreview>
  
  <PublishButton 
    onClick={handlePublish}
    loading={publishing}
    disabled={!canPublish}
  >
    {type === "immediate" ? "지금 발행" : "예약 등록"}
  </PublishButton>
</PublishOptions>

<PublishSuccessModal open={publishSuccess}>
  <SuccessIcon />
  <Title>발행 완료!</Title>
  <PostURL href={publishedUrl}>{publishedUrl}</PostURL>
  <Stats>
    <Stat label="Rank Math 점수" value={`${finalScore}/100`} />
    <Stat label="예상 인덱싱" value="24-48시간" />
    <Stat label="단어수" value={wordCount} />
  </Stats>
  <Actions>
    <Button href={publishedUrl} target="_blank">글 보기</Button>
    <Button onClick={createAnother}>새 글 작성</Button>
    <Button onClick={goToDashboard}>대시보드</Button>
  </Actions>
</PublishSuccessModal>
```

---

## 7. Technical Stack

### Frontend
```yaml
Framework: Next.js 14 (App Router)
UI Library: 
  - shadcn/ui (Radix UI primitives)
  - Tailwind CSS
State Management: 
  - Zustand (global state)
  - React Query (server state)
Form Handling: React Hook Form + Zod
Real-time Updates: Server-Sent Events (SSE)
Charts: Recharts
Markdown: react-markdown + remark/rehype plugins
```

### Backend
```yaml
Runtime: Node.js 20+
Framework: Next.js API Routes
Database: PostgreSQL 16
ORM: Prisma
Queue: BullMQ (Redis)
Cache: Redis 7
File Storage: Local filesystem (MVP) → AWS S3/Cloudflare R2 (Phase 2)
Image Processing: sharp
```

### AI & Research
```yaml
LLM: GPT-4o (OpenAI API)
  - Input: $2.50 / 1M tokens
  - Output: $10.00 / 1M tokens
  - Avg cost per article: ~$0.033
Image Gen: DALL-E-3 (OpenAI API)
  - HD (1792×1024): $0.080/image (기본값 - 뉴욕 감성 프로페셔널 품질)
  - MVP: 1 HD featured image per article (자동 생성)
Research APIs:
  - Reddit JSON API (read-only)
  - Reddit OAuth API (optional)
  - StackExchange API
  - Google Trends (google-trends-api npm)
  - Wikipedia OpenSearch API
  - Google Autocomplete
  - RSS Parser (rss-parser npm)
Optional (Phase 2): 
  - Google계속오전 6:20Ads Keyword Planner API

### WordPress Integration
```yaml
API: WordPress REST API v2
Auth: Application Passwords
Plugins Required:
  - Rank Math SEO or Yoast SEO
  - Advanced Custom Fields (optional - Phase 2)
```

### DevOps
```yaml
Hosting: Vercel or AWS
CI/CD: GitHub Actions
Monitoring: Sentry + Vercel Analytics
Logging: Winston + CloudWatch
Environment: WSL2 (development), Linux (production)
```

---

## 8. Data Models

### Database Schema (Prisma)
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String   @id @default(cuid())
  email         String   @unique
  name          String?
  passwordHash  String
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  wordpressSites WordPressSite[]
  articles       Article[]
  usageStats     UsageStats?
  subscription   Subscription?
  automationJobs AutomationJob[]
}

model Subscription {
  id            String   @id @default(cuid())
  userId        String   @unique
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  tier          String   // "free" | "pro" | "agency" | "enterprise"
  status        String   // "active" | "canceled" | "expired"
  
  currentPeriodStart DateTime
  currentPeriodEnd   DateTime
  
  stripeCustomerId      String?
  stripeSubscriptionId  String?
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model WordPressSite {
  id            String   @id @default(cuid())
  userId        String
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  siteUrl       String
  siteName      String
  username      String
  appPassword   String   @db.Text // 암호화된 상태로 저장
  
  isActive      Boolean  @default(true)
  lastSync      DateTime?
  
  articles      Article[]
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@index([userId])
}

model ResearchJob {
  id            String   @id @default(cuid())
  userId        String
  
  seeds         Json     // string[]
  sources       Json     // string[]
  persona       Json     // Persona object
  
  status        String   // "pending" | "running" | "completed" | "failed"
  progress      Int      @default(0) // 0-100
  currentTask   String?
  
  // Results
  keywords      Keyword[]
  researchData  Json?    // { reddit: [...], trends: [...], ... }
  
  startedAt     DateTime?
  completedAt   DateTime?
  error         String?
  
  article       Article?
  
  createdAt     DateTime @default(now())
  
  @@index([userId, status])
  @@index([createdAt])
}

model Keyword {
  id            String   @id @default(cuid())
  researchJobId String
  researchJob   ResearchJob @relation(fields: [researchJobId], references: [id], onDelete: Cascade)
  
  phrase        String
  score         Float
  searchVolume  Int?
  competition   Float
  relevance     Float
  trending      String   // "increasing" | "stable" | "decreasing"
  
  // Metrics
  redditPosts   Int      @default(0)
  sePosts       Int      @default(0)
  snippetChance Float    @default(0)
  
  selected      Boolean  @default(false)
  
  createdAt     DateTime @default(now())
  
  @@index([researchJobId, score])
  @@index([phrase])
}

model Article {
  id            String   @id @default(cuid())
  userId        String
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  siteId        String?
  site          WordPressSite? @relation(fields: [siteId], references: [id], onDelete: SetNull)
  
  researchJobId String   @unique
  researchJob   ResearchJob @relation(fields: [researchJobId], references: [id], onDelete: Cascade)
  
  // Content
  title         String
  slug          String
  content       String   @db.Text
  focusKeyword  String
  metaTitle     String
  metaDesc      String
  
  // Structure
  wordCount     Int
  h2Count       Int
  h3Count       Int
  keywordDensity Float
  
  // Images
  images        Image[]
  
  // SEO
  rankMathScore Int?
  estimatedScore Int
  
  // Publishing
  status        String   // "draft" | "scheduled" | "published" | "failed"
  scheduledFor  DateTime?
  publishedAt   DateTime?
  wpPostId      Int?
  wpPostUrl     String?
  error         String?
  
  // Metadata
  persona       Json
  referenceInfo Json?
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@index([userId, status])
  @@index([createdAt])
}

model Image {
  id            String   @id @default(cuid())
  articleId     String
  article       Article  @relation(fields: [articleId], references: [id], onDelete: Cascade)
  
  type          String   // "featured" | "section" | "infographic"
  url           String
  path          String?
  altText       String
  prompt        String   @db.Text
  revisedPrompt String?  @db.Text
  
  wpMediaId     Int?
  position      String   // "after_h1" | "after_h2_0" | etc.
  
  width         Int?
  height        Int?
  size          Int?     // bytes
  format        String?  // "webp" | "png" | "jpg"
  
  createdAt     DateTime @default(now())
  
  @@index([articleId])
}

model UsageStats {
  id            String   @id @default(cuid())
  userId        String   @unique
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Quotas (reset monthly)
  articlesThisMonth Int   @default(0)
  articlesLimit     Int   @default(5) // 플랜별
  
  imagesThisMonth   Int   @default(0)
  imagesLimit       Int   @default(5)
  
  // Cumulative usage
  totalArticles     Int   @default(0)
  totalImages       Int   @default(0)
  totalWordCount    Int   @default(0)
  
  // Cost tracking (for analytics)
  costThisMonth     Float @default(0)
  
  lastResetAt       DateTime @default(now())
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}

model CostLog {
  id            String   @id @default(cuid())
  userId        String
  
  type          String   // "gpt-4o" | "dall-e-3"
  model         String?  // "gpt-4o" | "dall-e-3-standard" | "dall-e-3-hd"
  
  inputTokens   Int?
  outputTokens  Int?
  
  cost          Float
  
  articleId     String?
  
  createdAt     DateTime @default(now())
  
  @@index([userId, createdAt])
  @@index([type])
}

model AutomationJob {
  id            String   @id @default(cuid())
  userId        String
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  articlesCount Int
  publishType   String   // "immediate" | "scheduled"
  scheduleInterval Int?   // minutes
  category      String?  // null = auto
  
  status        String   // "pending" | "running" | "completed" | "failed"
  progress      Int      @default(0) // 0-100
  
  articlesGenerated  Int @default(0)
  articlesPublished  Int @default(0)
  articlesFailed     Int @default(0)
  
  totalCost     Float    @default(0)
  
  startedAt     DateTime?
  completedAt   DateTime?
  error         String?
  
  createdAt     DateTime @default(now())
  
  @@index([userId, status])
  @@index([createdAt])
}
```

---

## 9. API Endpoints

### Research & Content Generation

**POST /api/research/start**
```typescript
Body: {
  seeds: string[];
  sources: string[];
  persona?: Persona;
  options?: ResearchOptions;
}
Response: {
  jobId: string;
  estimatedTime: number; // seconds
}
```

**GET /api/research/:jobId/status**
```typescript
Response: {
  status: "pending" | "running" | "completed" | "failed";
  progress: number; // 0-100
  currentTask?: string;
  estimatedTimeRemaining?: number;
}
```

**GET /api/research/:jobId/keywords**
```typescript
Response: {
  keywords: Keyword[];
  aiRecommendations: Keyword[]; // Top 10
}
```

**POST /api/content/generate**
```typescript
Body: {
  researchJobId: string;
  selectedKeyword: string;
  customPrompt?: Partial<PromptData>;
}
Response: {
  articleId: string;
}
```

**GET /api/content/:articleId/status**
```typescript
Response: {
  status: "generating" | "completed" | "failed";
  progress: number;
  currentSection?: string;
  metrics?: {
    wordCount: number;
    h2Count: number;
    keywordDensity: number;
    estimatedScore: number;
  }
}
```

**GET /api/content/:articleId**
```typescript
Response: Article
```

**POST /api/images/generate**
```typescript
Body: {
  articleId: string;
  quality?: "standard" | "hd";
}
Response: {
  images: Image[];
}
```

**GET /api/images/:articleId/status**
```typescript
Response: {
  completed: number;
  total: number;
  images: Image[];
}
```

### WordPress Publishing

**GET /api/wordpress/sites**
```typescript
Response: {
  sites: WordPressSite[];
}
```

**POST /api/wordpress/sites**
```typescript
Body: {
  siteUrl: string;
  username: string;
  appPassword: string;
}
Response: WordPressSite
```

**POST /api/wordpress/publish**
```typescript
Body: {
  articleId: string;
  siteId: string;
  options: {
    publishType: "immediate" | "scheduled";
    scheduledDate?: string;
    categories: number[];
    tags: string[];
    autoShare?: boolean;
  }
}
Response: {
  success: boolean;
  postId: number;
  url: string;
  rankMathScore?: number;
}
```

**GET /api/wordpress/:siteId/categories**
```typescript
Response: {
  categories: WPCategory[];
}
```

### Analytics & Monitoring

**GET /api/analytics/overview**
```typescript
Response: {
  totalArticles: number;
  publishedThisMonth: number;
  avgRankMathScore: number;
  totalTraffic: number;
  topKeywords: Keyword[];
}
```

**GET /api/usage/current**
```typescript
Response: UsageStats
```

### Automation

**POST /api/automation/start**
```typescript
Body: {
  articlesCount?: number;        // 1, 5, 10 (default: 1)
  publishType?: 'immediate' | 'scheduled';
  scheduleInterval?: number;     // minutes
  category?: string;             // optional, 'auto' by default
}
Response: {
  success: boolean;
  jobId: string;
  message: string;
  estimatedTime: number;         // minutes
}
```

**GET /api/automation/:jobId/status**
```typescript
Response: {
  jobId: string;
  state: 'waiting' | 'active' | 'completed' | 'failed';
  progress: {
    completed: number;
    total: number;
    current?: string;
  };
  result?: AutomationResult[];
}
```

---

## 10. User Experience Details

### Dashboard Layout
┌──────────────────────────────────────────────────────────┐
│  Logo   |   대시보드   글 작성   사이트 관리   분석   설정   │
└──────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────┐
│  📊 이번 달 현황                                               │
│  ┌──────────┬──────────┬──────────┬──────────┐              │
│  │ 발행된 글 │ 평균 점수  │  트래픽   │ 사용량   │              │
│  │   24/50  │  83.2점  │  +156%  │  48%     │              │
│  └──────────┴──────────┴──────────┴──────────┘              │
└──────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────┐
│  📝 최근 글                                    [+ 새 글 작성]  │
│  ┌───────────────────────────────────────────────────────┐   │
│  │ Medicare enrollment timeline 2024                    │   │
│  │ 발행됨 · 2일 전 · 83/100 · 2,340 단어                 │   │
│  │ [보기] [편집] [복제]                                   │   │
│  └───────────────────────────────────────────────────────┘   │
│  ┌───────────────────────────────────────────────────────┐   │
│  │ How to switch Medicare plans...                      │   │
│  │ 예약됨 · 3일 후 · 81/100 · 2,180 단어                 │   │
│  │ [미리보기] [수정] [취소]                               │   │
│  └───────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────┘

### Content Generation Flow (Step-by-Step UI)

**Step 0: Mode Selection (새로 추가)**
┌──────────────────────────────────────────────────────────┐
│  어떻게 글을 작성하시겠어요?                                      │
│  필요에 맞는 방식을 선택하세요                                     │
├──────────────────────────────────────────────────────────┤
│  ┌──────────────────────┐  ┌──────────────────────┐   │
│  │ ✍️ 직접 설정하기        │  │ 🤖 AI에게 맡기기      │   │
│  │                      │  │ [추천]                │   │
│  │ 키워드, 페르소나, 소스를 │  │ AI가 자동으로 키워드를 │   │
│  │ 직접 선택하고 AI가     │  │ 선택하고 고품질       │   │
│  │ 고품질 콘텐츠를 생성   │  │ 콘텐츠를 생성합니다   │   │
│  │                      │  │                      │   │
│  │ ✓ 완전한 제어         │  │ ✓ 완전 자동화         │   │
│  │ ✓ 맞춤형 콘텐츠        │  │ ✓ 손떼기 가능         │   │
│  │ ✓ 즉시 시작           │  │ ✓ 배치 생성           │   │
│  │                      │  │                      │   │
│  │ [직접 설정 시작]       │  │ [자동 생성 시작]      │   │
│  │ 예상 시간: 2-3분 설정  │  │ 예상 시간: 클릭 한 번  │   │
│  └──────────────────────┘  └──────────────────────┘   │
└──────────────────────────────────────────────────────────┘

**Auto Mode Config Screen (Auto 선택 시)**
┌──────────────────────────────────────────────────────────┐
│  ← 뒤로  🤖 AI 자동 생성 설정                                 │
├──────────────────────────────────────────────────────────┤
│  생성할 글 개수                                               │
│  [1개 글 $0.07] [5개 글 $0.37] [10개 글 $0.73]            │
│                                                              │
│  발행 방식                                                     │
│  ● 즉시 발행                                                  │
│    생성 완료 즉시 WordPress에 발행                            │
│  ○ 예약 발행                                                  │
│    일정 간격으로 자동 발행 [6] 시간 간격                      │
│                                                              │
│  카테고리 (선택사항)                                            │
│  [자동 선택 (추천)] ▼                                         │
│                                                              │
│  ──────────────────────────────────────────────────────    │
│  요약                                                         │
│  생성 글 수: 5개                                              │
│  예상 비용: $0.37                                             │
│  예상 시간: 약 75분                                           │
│  발행 방식: 즉시                                               │
│  ──────────────────────────────────────────────────────    │
│                                                              │
│  [취소]                          [자동 생성 시작 🚀]          │
└──────────────────────────────────────────────────────────┘

**Auto Mode Progress Screen**
┌──────────────────────────────────────────────────────────┐
│  🤖 AI가 자동으로 생성 중...                                     │
│  백그라운드에서 실행됩니다. 창을 닫아도 계속 진행됩니다.              │
├──────────────────────────────────────────────────────────┤
│  ████████████████████████▒▒▒▒▒▒▒▒▒▒  3 / 5 글 완료          │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐   │
│  │ #1  ✓ 완료                                             │   │
│  │ Medicare enrollment period mistakes to avoid         │   │
│  │ Rank Math: 82/100  단어수: 2,340  비용: $0.07         │   │
│  │ [글 보기 →]                                            │   │
│  └───────────────────────────────────────────────────────┘   │
│  ┌───────────────────────────────────────────────────────┐   │
│  │ #2  ⏳ 생성 중                                         │   │
│  │ 리서치 ✓  키워드 선택 ⏳  글 작성  이미지  발행        │   │
│  └───────────────────────────────────────────────────────┘   │
│  ┌───────────────────────────────────────────────────────┐   │
│  │ #3  ⏸ 대기                                            │   │
│  └───────────────────────────────────────────────────────┘   │
│                                                              │
│  [백그라운드로 이동]  [대시보드로 →]                            │
└──────────────────────────────────────────────────────────┘

**Step 1: Seed Input (Manual Mode)**
┌──────────────────────────────────────────────────────────┐
│  🎯 새 글 작성 - 1단계: 주제 설정                              │
├──────────────────────────────────────────────────────────┤
│  카테고리 선택                                                 │
│  [Medicare] ▼                                               │
│                                                              │
│  시드 키워드 (1-5개)                                           │
│  ┌────────────────────────────────────────────────────┐    │
│  │ medicare enrollment                          [×]    │    │
│  └────────────────────────────────────────────────────┘    │
│  [+ 키워드 추가]                                              │
│                                                              │
│  리서치 소스 선택                                              │
│  ☑ Reddit        ☑ StackExchange   ☑ Google Trends        │
│  ☑ Wikipedia     ☐ RSS Feeds       ☐ Keyword Planner      │
│                                                              │
│  [이전]                                    [자동 조사 시작 →]  │
└──────────────────────────────────────────────────────────┘

**Step 2: Research Progress**
┌──────────────────────────────────────────────────────────┐
│  🔍 자동 조사 진행 중...                                       │
├──────────────────────────────────────────────────────────┤
│  ████████████▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒  45%                      │
│                                                              │
│  ✓ Google Autocomplete 완료 (48개 키워드 확장)                │
│  ✓ Google Trends 완료 (156개 관련 쿼리 수집)                  │
│  ⏳ Reddit 검색 중... (134/200 키워드)                        │
│  ⏳ StackExchange 검색 대기 중...                            │
│  ⏳ Wikipedia 검색 대기 중...                                │
│                                                              │
│  예상 남은 시간: 약 7분                                        │
│                                                              │
│  [백그라운드로 이동]  [취소]                                   │
└──────────────────────────────────────────────────────────┘

**Step 3: Keyword Selection**
┌──────────────────────────────────────────────────────────┐
│  🎯 키워드 선택 - AI 추천 Top 10                              │
├──────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────┐   │
│  │ 🏆 AI 최고 추천                                       │   │
│  │ medicare enrollment period mistakes to avoid         │   │
│  │ 점수: 94/100  난이도: Easy  트래픽: High  Snippet: 87% │   │
│  │ ▁▂▃▄▅▆▇█▇▆▅ 트렌드: ↗ 증가중              │   │
│  │ [선택] [상세보기]                                      │   │
│  └───────────────────────────────────────────────────────┘   │
│  ┌───────────────────────────────────────────────────────┐   │
│  │ medicare special enrollment period after retirement  │   │
│  │ 점수: 89/100  난이도: Medium  트래픽: Medium           │   │
│  │ [선택]                                                 │   │
│  └───────────────────────────────────────────────────────┘   │
│  ... (8개 더 표시)                                           │
│                                                              │
│  [이전]                           [선택한 키워드로 글 작성 →]  │
└──────────────────────────────────────────────────────────┘

**Step 4: Content Generation**
┌──────────────────────────────────────────────────────────┐
│  ✍️ AI 글 작성 중...                                          │
├──────────────────────────────────────────────────────────┤
│  진행 단계                                                     │
│  ✓ 제목 생성  ✓ 도입부  ⏳ 본문 (H2: 5/10)  FAQ  최종검토     │
│                                                              │
│  실시간 미리보기                                               │
│  ┌────────────────────────────────────────────────────┐    │
│  │ # Medicare Enrollment Period Mistakes to Avoid     │    │
│  │                                                     │    │
│  │ Moving from New York to Florida while switching... │    │
│  │                                                     │    │
│  │ ## Understanding Medicare Enrollment Deadlines     │    │
│  │                                                     │    │
│  │ Last year, I almost missed my Medicare...          │    │
│  │ ...                                                 │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  품질 지표                                                     │
│  단어수: 1,847 / 2,000-2,500  ▓▓▓▓▓▓▓▓▒▒                    │
│  키워드 밀도: 1.4% ✓  H2: 5/10  예상 Rank Math: 82/100      │
│                                                              │
│  예상 남은 시간: 약 3분                                        │
└──────────────────────────────────────────────────────────┘

**Step 5: Image Generation**
┌──────────────────────────────────────────────────────────┐
│  🎨 AI 이미지 생성 중...                                       │
├──────────────────────────────────────────────────────────┤
│  ┌──────────────────┐ ┌──────────────────┐ ┌─────────────┐ │
│  │ Featured Image   │ │ (Phase 2에 추가)  │ │             │ │
│  │ ┌──────────────┐ │ │                  │ │             │ │
│  │ │ [이미지]      │ │ │                  │ │             │ │
│  │ └──────────────┘ │ │                  │ │             │ │
│  │ ✓ 완료            │ │                  │ │             │ │
│  │ [재생성] [수정]   │ │                  │ │             │ │
│  └──────────────────┘ └──────────────────┘ └─────────────┘ │
│                                                              │
│  생성 완료: 1/1  비용: $0.04                                  │
│                                                              │
│  [이전 단계로]                              [다음: 발행 설정 →] │
└──────────────────────────────────────────────────────────┘

**Step 6: Publish Options**
┌──────────────────────────────────────────────────────────┐
│  🚀 발행 설정                                                  │
├──────────────────────────────────────────────────────────┤
│  WordPress 사이트 선택                                         │
│  [MedicareBlog.com] ▼                                       │
│                                                              │
│  발행 타입                                                     │
│  ● 즉시 발행                                                  │
│  ○ 예약 발행  [날짜/시간 선택]                                 │
│                                                              │
│  카테고리                                                      │
│  ☑ Medicare Enrollment  ☐ Medicare Advantage               │
│                                                              │
│  태그 (AI 자동 생성)                                           │
│  [medicare enrollment] [enrollment period] [medicare tips]  │
│  [+ 태그 추가]                                                │
│                                                              │
│  SEO 미리보기                                                  │
│  ┌────────────────────────────────────────────────────┐    │
│  │ Medicare Enrollment Period Mistakes to Avoid       │    │
│  │ medicareblog.com/medicare-enrollment-mistakes/     │    │
│  │ Complete guide to avoiding common Medicare...      │    │
│  │                                                     │    │
│  │ 예상 Rank Math 점수: 82/100 ⭐⭐⭐⭐                  │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  [← 수정하기]                          [지금 발행 🚀]          │
└──────────────────────────────────────────────────────────┘

**Step 7: Success**
┌──────────────────────────────────────────────────────────┐
│  ✅ 발행 완료!                                                 │
├──────────────────────────────────────────────────────────┤
│  글이 성공적으로 발행되었습니다.                                │
│                                                              │
│  📄 발행된 글                                                  │
│  https://medicareblog.com/medicare-enrollment-mistakes/     │
│  [링크 복사] [새 탭에서 보기]                                  │
│                                                              │
│  📊 최종 통계                                                  │
│  ┌──────────────┬──────────────┬──────────────┐            │
│  │ Rank Math    │ 단어수        │ 생성 시간     │            │
│  │   82/100     │   2,340      │   18분       │            │
│  └──────────────┴──────────────┴──────────────┘            │
│                                                              │
│  📅 다음 단계                                                  │
│  • Google 인덱싱: 24-48시간 예상                              │
│  • Search Console 제출 완료 ✓                                │
│  • 내부 링크 업데이트 완료 ✓                                   │
│                                                              │
│  [새 글 작성]  [대시보드로]  [분석 보기]                       │
└──────────────────────────────────────────────────────────┘

---

## 11. MVP (Minimum Viable Product) Scope

### Phase 1: Proof of Concept (Week 1-2)
**Must Have**:
- ✅ Manual Mode: 수동 키워드 입력 (research 제외)
- ✅ GPT-4o 기반 content generation
- ✅ 수동 review & edit
- ✅ WordPress immediate publish (1개 사이트)
- ✅ Basic dashboard

**Nice to Have**:
- 간단한 metrics 표시

**Note**: Phase 1에서는 Manual Mode만 제공합니다.

### Phase 2: Core Automation (Week 3-6)
**Must Have**:
- ✅ Manual Mode: Seed input (1-3 seeds)
- ✅ Manual Mode: Basic research (Reddit + Google Trends only)
- ✅ Manual Mode: Keyword scoring & selection
- ✅ Auto image generation (1 per article)
- ✅ Scheduled publishing
- ✅ Usage quota management
- ✅ **Auto Mode: 자동 파이프라인 기본 기능**
  - 자동 시드 선택 (weight 기반)
  - 자동 페르소나 생성 (rotation)
  - 자동 키워드 선택 (AI 추천 Top 1)
  - 배치 생성 (1-10개 글)

**Nice to Have**:
- Full research sources (SE, Wikipedia, RSS)
- Multiple WordPress sites

**Note**: Phase 2에서 Auto Mode가 추가됩니다. 사용자는 Manual 또는 Auto 중 선택 가능합니다.

### Phase 3: Enhanced Features (Week 7-10)
**Must Have**:
- ✅ Full research sources (SE, Wikipedia, RSS)
- ✅ Multiple WordPress sites
- ✅ Dashboard with analytics
- ✅ **Auto Mode: 고급 기능**
  - Cron 스케줄링 (자동 반복 생성)
  - 배치 처리 최적화
  - 실시간 진행 상황 모니터링
  - 자동화 실행 기록 및 통계

**Nice to Have**:
- Internal link suggestions
- Social media auto-share
- Advanced scheduling (content calendar)
- White-label option (Agency tier)

---

## 12. Pricing Model

### Cost Analysis (Per 100 Articles)
GPT-4o: $3.30
DALL-E-3 (Standard): $4.00
Total: $7.30/month for 100 articles
Profit Margins:

Pro tier ($49): $41.70 profit (85% margin) ✅
Agency tier ($199): $184.40 profit (93% margin) ✅


### Pricing Tiers

**Free Tier**
- 5 articles/month
- 5 images/month
- 1 WordPress site
- Basic research sources (Reddit, Trends)
- Community support
- Cost: ~$0.37/month

**Pro Tier ($49/month)** 
- 100 articles/month
- 100 images/month
- 3 WordPress sites
- All research sources
- Priority support
- Scheduled publishing
- Analytics dashboard
- Cost: ~$7.30/month
- **Profit: $41.70 (85% margin)**

**Agency Tier ($199/month)**
- 500 articles/month
- 500 images/month
- 10 WordPress sites
- All features
- White-label option (Phase 3)
- API access (Phase 3)
- Dedicated support
- Team collaboration
- Cost: ~$36.50/month
- **Profit: $162.50 (82% margin)**

**Enterprise (Custom)**
- Unlimited articles
- Unlimited images
- Unlimited sites
- Custom integrations
- SLA guarantee
- Custom AI training

---

## 13. Success Criteria & Metrics

### Launch Criteria (Before Public Release)
- [ ] 50 test articles generated with 80+ Rank Math score
- [ ] Average generation time < 30 minutes
- [ ] 95%+ successful WordPress publishing rate
- [ ] < 1% error rate in research pipeline
- [ ] 10 beta users testing for 2 weeks

### Post-Launch KPIs (First 3 Months)

| Metric | Target |
|--------|--------|
| Active users | 50+ |
| Articles generated | 1,000+ |
| Avg Rank Math score | 82+ |
| User retention (30-day) | 60%+ |
| NPS | 40+ |
| Organic traffic increase (users' sites) | 150%+ |
| Churn rate | < 10% |

---

## 14. Risk Assessment & Mitigation

### Technical Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| ~~API cost overrun~~ | Low | Low | Costs are predictable: $0.073/article ✅ |
| Research API rate limits | High | Medium | Implement delays, batch processing, fallbacks |
| WordPress API failures | High | Low | Retry logic with exponential backoff |
| Research source blocking | Medium | Medium | Rotate user agents, delays, read-only fallbacks |
| Keyword quality inconsistency | High | Medium | AI scoring validation, human review queue |
| Redis connection issues | Medium | Low | In-memory fallback for development |

### Business Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| AI-generated content penalties | High | Low | Focus on quality > quantity, human review |
| Copyright issues (research data) | Medium | Low | Only use public APIs, cite sources |
| High customer acquisition cost | Medium | High | Focus on content marketing, SEO |
| Competitors copying features | Low | High | Build strong brand, focus on UX |

---

## 15. Roadmap

### Q1 2025 (MVP Launch)
- ✅ Proof of Concept (manual workflow)
- ✅ Core automation pipeline
- ✅ Basic WordPress integration
- ✅ Free + Pro tiers
- 🎯 Target: 30 paying users, $1.5K MRR

### Q2 2025 (Growth)
- Advanced scheduling & batch processing
- Team collaboration features
- Multiple WordPress sites
- Enhanced analytics
- 🎯 Target: 100 paying users, $5K MRR

### Q3 2025 (Scale)
- API access for Enterprise
- White-label solution (Phase 3)
- Advanced analytics & reporting
- Multi-language support
- 🎯 Target: 300 users, $15K MRR

### Q4 2025 (Platform)
- Marketplace for templates
- Custom AI model training
- Mobile app
- 🎯 Target: 500 users, $25K MRR

---

## 16. Environment Setup & Getting Started

### Prerequisites
```bash
# System Info (Current Development Environment)
OS: Linux (WSL2) - 6.6.87.2-microsoft-standard-WSL2
Node: v24.11.0
NPM: 11.6.2
PostgreSQL: 16.11 (running, accepting connections)
Redis: 7.x (running on 127.0.0.1:6379)
```

### Environment Variables
```bash
# .env.local
# OpenAI
OPENAI_API_KEY=sk-...

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/whnessmaker
REDIS_URL=redis://127.0.0.1:6379

# Reddit (Read-only mode - no OAuth required for MVP)
REDDIT_READONLY_ENABLED=true
REDDIT_USER_AGENT="whnessmaker-bot/1.0"
REDDIT_REQUEST_DELAY_MS=1000

# Reddit OAuth (optional, for Phase 2)
# REDDIT_CLIENT_ID=
# REDDIT_CLIENT_SECRET=
# REDDIT_USERNAME=
# REDDIT_PASSWORD=

# StackExchange
STACKEXCHANGE_SITE=medicalsciences
STACKEXCHANGE_KEY=  # optional, increases rate limits

# Research Config
RESEARCH_AUTOCOMPLETE_HL=en-US
RESEARCH_TRENDS_GEO=US
RESEARCH_TRENDS_HL=en-US
RESEARCH_TRENDS_LIMIT=10

# CMS RSS (optional)
# CMS_RSS_FEEDS=https계속오전 11:34://example.com/feed1,https://example.com/feed2
Google Ads (optional, Phase 2)
ADS_KEYWORD_PLANNER_ENABLED=false
GOOGLE_ADS_IDEAS_LIMIT=50
Security
ENCRYPTION_KEY=  # openssl rand -base64 32
NEXTAUTH_SECRET=  # openssl rand -base64 32
NEXTAUTH_URL=http://localhost:3000
App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

### Setup Instructions
```bash
# 1. Clone repo
git clone https://github.com/yourorg/whnessmaker
cd whnessmaker

# 2. Install dependencies
npm install

# 3. Setup environment
cp .env.example .env.local
# Edit .env.local with your keys

# 4. Generate encryption key
openssl rand -base64 32  # Copy to ENCRYPTION_KEY
openssl rand -base64 32  # Copy to NEXTAUTH_SECRET

# 5. Setup database
npx prisma migrate dev --name init
npx prisma generate

# 6. Seed default data (optional)
npm run seed

# 7. Start Redis (if not running)
# Redis is already running on 127.0.0.1:6379

# 8. Run development server
npm run dev

# Open http://localhost:3000
```

### Project Structure
whnessmaker/
├── app/                      # Next.js app directory
│   ├── (dashboard)/          # Dashboard routes
│   │   ├── page.tsx
│   │   ├── articles/
│   │   ├── sites/
│   │   └── analytics/
│   ├── api/                  # API routes
│   │   ├── research/
│   │   ├── content/
│   │   ├── images/
│   │   ├── wordpress/
│   │   └── webhooks/
│   └── _lib/                 # Shared utilities
│       └── actions.ts        # Server actions
├── src/
│   ├── services/
│   │   ├── research/         # Research pipeline
│   │   │   ├── autoCollect.ts
│   │   │   ├── ingestSources.ts
│   │   │   ├── defaultSeeds.ts
│   │   │   └── keywordScoring.ts
│   │   ├── ai/               # AI content generation
│   │   │   ├── openai.ts
│   │   │   ├── dalle.ts
│   │   │   └── masterPrompt.ts
│   │   ├── wordpress/        # WP integration
│   │   │   ├── client.ts
│   │   │   ├── publish.ts
│   │   │   └── scheduler.ts
│   │   └── queue/            # Background jobs
│   │       └── worker.ts
│   ├── components/           # React components
│   │   ├── ui/              # shadcn/ui components
│   │   ├── research/
│   │   ├── editor/
│   │   └── dashboard/
│   └── lib/                  # Shared libraries
│       ├── prisma.ts
│       ├── redis.ts
│       ├── queue.ts
│       └── crypto.ts
├── prisma/
│   └── schema.prisma         # Database schema
├── public/
├── .env.local               # Environment variables
├── .env.example             # Example env file
└── package.json

---

## 17. Questions & Clarifications

### Resolved
- ✅ API Budget: GPT-4o + DALL-E-3 costs are predictable and affordable
- ✅ Image Strategy: DALL-E-3 Standard for MVP (1 image/article)
- ✅ Redis: Working correctly on 127.0.0.1:6379

### Outstanding
1. **Content Moderation:**
   - Do we need human review queue before auto-publish?
   - Should we implement content filtering for medical claims?

2. **Keyword Planner:**
   - Do we have Google Ads API access?
   - Priority: Phase 2 or later?

3. **Multi-language:**
   - MVP English-only, correct?

4. **White-label:**
   - Phase 3 priority confirmed?

---

## 18. Summary

이 PRD는 시드 키워드 입력 → 자동 리서치 → AI 키워드 선택 → 글 생성 → 이미지 생성 → WordPress 자동 발행까지의 완전 자동화 파이프라인을 정의합니다.

### 핵심 차별점:
1. **업계 유일 통합 솔루션** (research to publish)
2. **하이브리드 모드 지원** (Manual + Auto - 사용자 선택 가능)
3. **Rank Math 80+ 점수 보장**
4. **Reddit/StackExchange 등 실제 사용자 데이터 기반**
5. **페르소나 기반 스토리텔링으로 AI 티 제거**
6. **완전 자동화 파이프라인** (시드 선택부터 발행까지 100% 자동)
7. **매우 건강한 마진** (85% for Pro tier)

### 비용 구조 (확정):
월 100개 글 기준:

GPT-4o: $3.30
DALL-E-3: $4.00
총 비용: $7.30
Pro tier 매출: $49.00
순이익: $41.70 (85% 마진) ✅


### 개발 환경 (확정):

OS: Linux (WSL2)
Node: v24.11.0
PostgreSQL: 16.11 ✅
Redis: 7.x ✅
All systems operational


### Next Steps:
1. ✅ 환경 설정 완료
2. Sprint 1 시작 (Week 1-2: POC)
   - Manual keyword input
   - GPT-4o content generation
   - WordPress publish
3. Sprint 2 (Week 3-4: Research)
   - Reddit + Trends integration
   - Keyword scoring
4. Sprint 3 (Week 5-6: Images)
   - DALL-E-3 integration
   - Auto insertion
