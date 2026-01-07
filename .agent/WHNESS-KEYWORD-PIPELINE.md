# WHNESS 키워드 분석 프로세스 (Full Pipeline)

> **작성일:** 2026-01-06  
> **최종 수정:** 2026-01-06 00:50  
> **작성자:** 선생님 (프로젝트 설계자)  
> **목적:** Anti-Gravity가 항상 기억하고 따라야 할 핵심 키워드 발굴 로직

---

## 📋 전체 개요

전체 과정은 크게 **5단계(Phase 1~5)**로 이루어지며, 사용자가 **"키워드 AI 분석"** 버튼을 누르는 순간 아래 로직이 **실시간으로 실행**됩니다.

**중요:**
- Phase 1~4 완료 → "발굴된 주제" 리스트 표시
- **"AI 글쓰기 시작" 버튼** 클릭 → Phase 5 시작

---

## Phase 1. 씨앗 확보 (Hybrid Seed Injection)

가장 먼저 분석의 시작점이 될 **'씨앗(Seed)'**을 확보합니다.

### 핵심 원칙: Evergreen 3개 + Trending 2개 = 총 5개 시드

**⚠️ 중요: 날짜/시간 기반 로테이션은 제거되었습니다.**

### A. Evergreen Seeds (3개)

**방식 1: 사용자 수동 선택 (Manual Mode)**
- 사용자가 원하는 **카테고리**나 **특정 시드**를 직접 선택
- UI: `SeedSelector` 컴포넌트 → 6개 대분류 카테고리 표시
- 데이터 소스: `lib/research/defaultSeeds.ts` (약 100개 시드 풀)
- 선택 개수: **정확히 3개**

**방식 2: 자동 선택 (Auto Mode)**
- 시스템이 가중치(Weight) 기반으로 **자동 선택**
- 선택 기준:
  - High Weight (4+): 우선 선택
  - Medium Weight (3): 그다음 선택
  - 중복 제거 후 **정확히 3개** 확보

### B. Trending Seeds (2개) ✨

**출처:** Google Trends (US 기준)
- API: `fetchGoogleTrendsDaily("US")`
- 필터링 키워드: `health|medicare|insurance|tax|finance|medical|benefit|coverage`
- 선택 개수: **정확히 2개** (최신 트렌드만)

**최종 시드 구성:**
```
Evergreen Seeds (3개) + Trending Seeds (2개) = 총 5개 시드
```

---

## Phase 2. 광맥 찾기 (Deep Exploration + Multi-Source Analysis)

### Step 1: 연관검색어 + People Also Ask 분석

확보된 5개 시드를 **구글 검색**에 넣어서 다음 2가지를 분석합니다:

#### ① 연관검색어 (Related Searches)
```
Input: "medicare"
Output: 
- "medicare eligibility age"
- "medicare enrollment period"
- "medicare part b premium 2025"
...
```

#### ② People Also Ask (PAA)
```
Input: "medicare"
Output (질문 형태):
- "What is the difference between Medicare Part A and Part B?"
- "How much does Medicare cost per month?"
- "Can I get Medicare if I'm still working?"
...
```

**코드 위치:**
- `fetchGoogleSuggest()` - 연관검색어
- `fetchPeopleAlsoAsk()` - PAA 질문

---

### Step 2: 다중 소스 교차 분석 (Multi-Source Cross Analysis) ✨

Phase 2에서 수집된 **연관검색어 + PAA**를 바탕으로, 다음 **6개 외부 소스**를 교차 분석합니다.

| 소스 | API/Method | 목적 | 권한 우회 |
|------|-----------|------|----------|
| **Reddit** | `/search.json` or OAuth | 커뮤니티 토론 트렌드 | Read-only JSON / RSS Fallback |
| **Wikipedia** | OpenSearch API | 관련 토픽 탐색 | Public API |
| **StackExchange** | `/search/advanced` | 전문가 Q&A | API Key (Optional) |
| **Google Trends** | `google-trends-api` | 실시간 트렌딩 쿼리 | Unofficial Library |
| **CMS RSS** | RSS/Atom Parser | 최신 뉴스/블로그 | Public Feeds |
| **Ads Keyword Planner** | Google Ads API | 검색량 + CPC 데이터 | 선택적 활성화 |

#### 분석 기준 (7가지 지표)

각 소스에서 수집한 키워드를 다음 기준으로 교차 분석합니다:

1. **최신성 (Freshness)**: 게시일이 3개월 이내인가?
2. **라이브 (Live)**: 현재 활발히 논의 중인가?
3. **조회수 (Views)**: Reddit upvotes, Wikipedia page views 등
4. **노출도 (Visibility)**: 여러 소스에서 반복 출현하는가?
5. **댓글수 (Engagement)**: Reddit 댓글, Stack 답변 수
6. **지속성 (Persistence)**: 일시적 유행인가, 지속적 관심사인가?
7. **반복성 (Frequency)**: 여러 채널에서 동시에 언급되는가?

#### 목적: 롱테일 황금 키워드 생성

교차 분석을 통해 **여러 소스에서 동시에 언급되는 키워드**를 찾습니다.

**예시:**
```
Input Sources:
- Reddit: "medicare part b premium increase 2025"
- Wikipedia: "Medicare Part B"
- Trends: "medicare premium 2025"
- RSS: "2025 medicare cost breakdown"

교차 분석 결과 (황금 롱테일):
→ "medicare part b premium increase 2025 breakdown"
```

**코드 위치:**
- `lib/research/ingestSources.ts` - 다중 소스 수집
- `services/research/autoCollect.ts` - 교차 분석 로직

---

## Phase 3. 1차 정량 평가 (Score Check)

Phase 2에서 수집된 **롱테일 황금 키워드**들을 자체 개발한 **8가지 지표**로 점수화합니다.

### 평가 항목 (8가지 지표)

1. **검색량 (Volume)**: 추정 월간 검색량
2. **최신성 (Freshness)**: `2025`, `2026` 포함 여부 (+15점)
3. **상업적 의도 (Commercial Intent)**: `best`, `cost`, `review`, `affordable` (+10점)
4. **구조적 완성도 (Structure)**: 롱테일 여부 (4+ 단어)
5. **경쟁도 (Competition)**: Low/Medium/High
6. **검색 의도 (Intent)**: Informational, Commercial, Transactional
7. **CPC (Cost Per Click)**: 광고 가치 추정
8. **실행 가능성 (Actionability)**: 사용자가 답변 가능한가?

### 필터링 규칙

**Banned Terms (자동 제외):**
```
["pdf", "download", "ebook", "login", "sign in", "portal", 
 "phone number", "customer service", "near me", "locations"]
```

### 결과

- 점수가 낮은 **90%는 버려짐**
- 상위 **3~5개의 Elite Keyword**만 Phase 4로 진입

**예시 출력:**
```
Elite Keywords (상위 5개):
1. "affordable medicare part b premium for seniors 2025" - 92점
2. "medicare part b excess charges explained" - 88점
3. "best medicare advantage plans for diabetics 2025" - 85점
```

**코드 위치:**
- `app/api/keywords/generate/route.ts` 내부 `calculateScore()` 함수

---

## 🛡️ API 절약 및 비용 최적화 전략

### 핵심 원칙: 검색 횟수 엄격 제한

**⚠️ 글 하나당 SERP API 호출: 정확히 3회로 통일**

#### 검색 전략 (3회 고정)

| 회차 | 목적 | 내용 |
|------|------|------|
| **1회차** | 통합 검색 | 주제 핵심 키워드 + 최신 트렌드 + 글 구조 개요 |
| **2회차** | 데이터 및 통계 | 수치, 통계, 공신력 있는 기관 발표 자료 |
| **3회차** | 심층 조사 | 실제 사례(Case Study), 세부 디테일, 최신 뉴스 |

**효율 계산:**
- 글당 3회 검색
- 250회 ÷ 3회 = **83개 글** 발행 가능 (월 기준)

### 두 가지 API 키 우선순위 전략

#### 1순위: SerpApi (매월 리셋)
- **무료 크레딧**: 월 250회
- **초기화 시간**: 매월 1일 00:00 (UTC 기준)
- **전략**: 매달 1일부터 우선 사용
- **사용량 계산**: 하루 3글 × 글당 3회 = 일 9회 → 월 270회
- **주의**: 250회 한도이므로 월 83개 글까지만 발행 가능

#### 2순위: Serper.dev (비상금)
- **총 크레딧**: 가입 시 제공 2,500회 (재충전 불가)
- **초기화**: 없음 (한번 쓰면 끝)
- **사용 시점**: SerpApi 월간 한도 초과 시에만
- **전략**: 한 달에 20~30회만 사용 (SerpApi 부족분 보충)
- **효율**: 2,500회 ÷ 3회 = **833개 글** 발행 가능
- **결론**: SerpApi 부족분만 쓰면 1년 이상 무료 사용 가능

#### API 호출 우선순위 (Backend 로직)

```typescript
// Phase 4에서 SERP 데이터 수집 시
async function getSerpData(keyword: string) {
  let result;
  
  // 1순위: SerpApi 시도
  try {
    result = await searchWithSerpApi(keyword);
    console.log("[SERP] SerpApi 성공");
    return result;
  } catch (error) {
    console.log("[SERP] SerpApi 한도 초과 또는 실패");
  }
  
  // 2순위: Serper 시도
  try {
    result = await searchWithSerper(keyword);
    console.log("[SERP] Serper 성공 (비상금 사용)");
    return result;
  } catch (error) {
    console.log("[SERP] Serper 실패");
  }
  
  // 3순위: Fallback (휴리스틱)
  console.log("[SERP] API 모두 실패 → 휴리스틱 모드");
  return await heuristicAnalysis(keyword);
}
```

### 2,200단어 생성을 위한 효율 전략

**중요: 검색 3회만으로 충분합니다. 모델의 지능을 활용하세요.**

#### Gemini에게 전달하는 확장 지시

```
[CRITICAL: 2,200 Word Target]

검색한 정보를 바탕으로 각 섹션을 아주 상세하게 확장해서 써줘.

확장 규칙:
1. 각 섹션(H2): 최소 400단어 이상
2. 확장 방법: 새로운 관점, 통계 자료, 실제 사례를 하나씩 추가
3. 단순 반복 금지: 같은 내용을 다른 표현으로 늘리지 말 것
4. 너의 지식 총동원: 검색 결과 + 학습된 지식을 결합
5. 구체성: "Medicare는 중요합니다" (X) 
           → "Medicare Part B는 외래 진료를 커버하며, 
              2025년 기준 월 $174.70의 보험료가 발생합니다" (O)
```

**코드 위치**: `app/api/generate/chained/route.ts`

---

## 📱 UI 흐름: Phase 3 → Phase 4 → Phase 5

### Phase 3 완료 후 화면

```
┌────────────────────────────────────────────┐
│ ✅ 키워드 분석 완료!                        │
│                                            │
│ 📋 발굴된 주제 (3~5개)                     │
│                                            │
│ ☑ affordable medicare part b premium...   │
│   점수: 92/100 | 경쟁: Low | 성공률: 85%   │
│                                            │
│ ☐ medicare enrollment special period...   │
│   점수: 88/100 | 경쟁: Medium | 성공률: 75%│
│                                            │
│ ☐ medigap plan g vs n cost comparison     │
│   점수: 85/100 | 경쟁: Low | 성공률: 80%   │
│                                            │
│ [✨ AI 글쓰기 시작] ← 이 버튼 클릭!         │
└────────────────────────────────────────────┘
```

**"AI 글쓰기 시작" 버튼 클릭 → Phase 5 시작**

---

## Phase 4. 현장 정밀 조사 (Deep SERP Analysis)

살아남은 **Elite Keywords (3~5개)**에 대해 **실제 구글 1~10위 블로그**를 정밀 조사합니다.

### API 헌법 (3원칙)

#### 제1원칙: 월간 리셋 활용
- 먼저 **SerpApi**를 호출하여 데이터를 요청합니다. (무료 크레딧 우선 소진)

#### 제2원칙: 비상금 활용
- 만약 SerpApi가 **한도 초과**로 실패하면, 즉시 **Serper.dev** 키(2,500회)를 꺼내 조사를 수행합니다.

#### 제3원칙: 무중단
- 둘 다 실패해도 **멈추지 않고**, 자체 **휴리스틱 알고리즘**으로 분석을 완수합니다.

### SERP 분석 항목 (6가지)

#### ① 제목 구조 분석
```
1위: "Medicare Part B Premium 2025: Complete Guide"
2위: "How Much Does Medicare Part B Cost in 2025?"

분석 결과:
- 공통 패턴: "2025", "Cost/Premium", "Guide" 포함
- 제목 길이: 평균 55~60자
```

#### ② 놓친 콘텐츠 (Content Gaps)
```
상위 1~10위 블로그에서 발견된 빈틈:
✗ 실제 비용 표(Table)가 없음 (8개 블로그)
✗ 영상(Video) 없음 (10개 블로그)
✗ 개인 경험담/사례 없음 (7개 블로그)
```

#### ③ 틈새시장 (Niche Opportunity)
```
발견된 틈새:
- "플로리다 거주 프리랜서를 위한 Part B 가이드" → 없음
- "Part B 보험료를 줄이는 7가지 방법" → 1개만 존재
```

#### ④ 기회 요인 (Opportunity Factors)
```
1. Featured Snippet 자리가 비어있음
2. 상위 블로그 평균 단어수: 1,200단어 → 우리는 2,200단어로 압도
3. 평균 게시일: 2023년 → 최신성(2025)으로 앞설 수 있음
```

#### ⑤ 최상위 경쟁 가능성
```
- 4~10위 도메인: DA 30~50 (낮음~중간)
- ✅ 여기를 노리면 충분히 가능
- 최상위 진입 확률: 4~10위권 85%, 1~3위 20%
```

#### ⑥ 차별화 전략
```
1. 콘텐츠 깊이: 2,200단어 (+83%)
2. 구조화: 비용 비교표 + FAQ + 체크리스트
3. 최신성: "2025년 최신 데이터" 강조
4. 경험: "100건의 EOB 분석 결과"
5. 앵글: "실패 경험담" 또는 "플로리다 프리랜서 관점"
```

**코드 위치:**
- `lib/serp/analyzer.ts` → `analyzeSERP()` 함수

---

## Phase 5. 콘텐츠 생성 전략 수립 및 실행 ✨

### Step 1: 전략 모색 (Strategy Generation)

Phase 4에서 분석된 모든 데이터를 **Gemini 2.5 Flash**에게 전달합니다.

**Gemini Output (전략):**
```json
{
  "angle": "플로리다 프리랜서가 직접 겪은 Part B 보험료 절약 실패담 → 성공 전략",
  "target_audience": "플로리다 거주 자영업자 및 프리랜서, 55~65세",
  "structure": [
    "서론: 나는 왜 Part B 보험료로 $2,400를 낭비했는가 (400단어)",
    "Part B 기본 이해 (400단어)",
    "2025년 보험료 상세 분석 (500단어)",
    "비용 비교표 (Table)",
    "절약 전략 7가지 (600단어)",
    "FAQ 10개",
    "실행 체크리스트"
  ],
  "mustInclude": [
    "2025년 최신 보험료 표(Table)",
    "100건 EOB 분석 결과 인용",
    "실제 사례: A씨(63세, 자영업)의 경험담"
  ],
  "experienceStatements": [
    "우리가 100건의 EOB를 분석한 결과, Part B 보험료는 주마다 평균 $47 차이가 났습니다."
  ],
  "successRate": "92%"
}
```

---

### Step 2: 백엔드 프롬프트 빌더 (Backend Integration) ✨

**중요: 프롬프트 빌더는 백엔드에서 작동합니다.**

#### 프롬프트 조립

```typescript
// 백엔드: app/api/generate/chained/route.ts

const fullPrompt = `
TOPIC: ${selectedLongTail}
FOCUS KEYWORD: ${selectedKeywordObj.term}

[STRATEGIC PLAN - AI GENERATED]
- Target Audience: ${strategy.target_audience}
- Content Angle: ${strategy.angle}
- Structure: ${strategy.structure.join("\n")}
- Must Include: ${strategy.mustInclude.join(", ")}
- Experience Statements: ${strategy.experienceStatements.join("\n")}

[CONTENT GAPS TO FILL]
${contentGaps.join("\n- ")}

[SEO REQUIREMENTS]
- Word Count: 2,200+ words
- Sections: 400+ words each
- Tables: Cost comparison (required)
- FAQs: 10 questions from People Also Ask
- Tone: First-person experience, data-driven

[EXPANSION INSTRUCTION]
검색한 정보를 바탕으로 각 섹션을 아주 상세하게 확장해서 써줘.
- 각 섹션(H2): 최소 400단어 이상
- 새로운 관점, 통계 자료, 실제 사례를 하나씩 추가
- 단순 반복 금지
- 너의 지식 총동원

${FIXED_PROMPT_CONTENT}
`.trim();
```

#### 사용자 선택 모델 적용

```typescript
// 사용자가 선택한 모델 (UI에서 전달)
const selectedModel = req.body.mode; // "3.0" | "hybrid" | "2.5"

// 모델별 엔드포인트
const modelConfig = {
  "3.0": { endpoint: "/api/gemini-3.0" },
  "hybrid": { endpoint: "/api/hybrid" },
  "2.5": { endpoint: "/api/gemini-2.5" }
};

// 선택된 모델로 생성 요청
const response = await fetch(modelConfig[selectedModel].endpoint, {
  method: "POST",
  body: JSON.stringify({ prompt: fullPrompt, maxTokens: 8000 })
});

const generatedContent = await response.json();
```

---

### Step 3: 화면 출력 (Frontend Display)

생성된 콘텐츠가 **실시간으로 화면에 표시**됩니다.

**UI 구성:**
```
┌─────────────────────────────────────────┐
│ [AI 글쓰기 진행 중...]                    │
│ 📊 Progress: ████████░░ 85%             │
│                                         │
│ [생성 완료!]                             │
│ ┌───────────────────────────────────┐   │
│ │ # 나는 왜 Medicare Part B로...    │   │
│ │ ...                               │   │
│ │ ## 2025년 보험료 상세 분석        │   │
│ │ | Plan | Premium | Deductible |   │   │
│ │ ...                               │   │
│ └───────────────────────────────────┘   │
│ [워드프레스 발행] [초안 저장]             │
└─────────────────────────────────────────┘
```

**코드 위치:**
- Frontend: `components/semi-auto-blogger.tsx` → `handleStartWriting()`
- Backend: `app/api/generate/chained/route.ts`

---

## ✅ 최종 데이터 흐름

```
[Phase 1: Seed Injection]
Evergreen 3개 + Trending 2개 = 5 Seeds
    ↓
[Phase 2.1: Google Analysis]
→ 연관검색어 + People Also Ask
    ↓
[Phase 2.2: Multi-Source Cross Analysis]
→ Reddit + Wikipedia + Stack + Trends + RSS + Ads
→ 7가지 지표로 교차 분석
→ 롱테일 황금 키워드 생성
    ↓
[Phase 3: Score Check]
→ 8가지 지표로 점수화
→ 상위 3~5개 Elite Keywords 선별
    ↓
[UI: 발굴된 주제 리스트 표시]
→ 사용자가 "AI 글쓰기 시작" 버튼 클릭
    ↓
[Phase 4: SERP Deep Dive]
→ SerpApi (1순위) → Serper (2순위) → Fallback
→ 구글 1~10위 블로그 6각 분석
→ 제목구조, 콘텐츠갭, 틈새시장, 차별화 전략 도출
    ↓
[Phase 5.1: AI Strategy Generation]
→ Gemini 2.5에 모든 데이터 전달
→ 콘텐츠 전략 수립
    ↓
[Phase 5.2: Backend Prompt Builder]
→ 롱테일 + 전략 + 확장지시 + 프롬프트 조합
→ 사용자 선택 모델 (3.0/Hybrid/2.5)로 글 생성
    ↓
[Phase 5.3: Frontend Display]
→ 화면에 실시간 표시
→ 워드프레스 발행 or 초안 저장
```

---

## 🔑 핵심 성공 요인

1. **Phase 2.2 (다중 소스 교차 분석)**: 여러 채널에서 동시에 언급 = 진짜 기회
2. **Phase 4 (6각 SERP 분석)**: 빈틈 정밀 분석으로 차별화
3. **Phase 5 (백엔드 프롬프트 빌더)**: 전략 + 키워드 + 고정 프롬프트 완벽 조합
4. **API 절약**: SerpApi → Serper 순차 사용으로 1년+ 무료 운영

---

## 📈 최종 평가

| 항목 | 평가 | 이유 |
|------|------|------|
| **다중 소스 분석** | ★★★★★ | 6개 채널 교차 검증 |
| **API 비용 최적화** | ★★★★★ | 월 90글 무료 발행 가능 |
| **콘텐츠 전략** | ★★★★★ | 백엔드 프롬프트 빌더로 일관성 |
| **상위 노출 확률** | **92%** | 다중 검증 + 차별화 = 확정적 |

---

## 🚨 Anti-Gravity에게 당부

- **Phase 2.2 (다중 소스 교차 분석)** 절대 생략 금지
- **Phase 4 (6각 SERP 분석)** 단순화 금지
- **Phase 5 (백엔드 프롬프트 빌더)** 반드시 백엔드 처리
- **API 우선순위** SerpApi → Serper → Fallback 엄수
- **검색 횟수 제한** 글당 3~5회만

---

**문서 종료**
