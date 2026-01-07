# 시드 확장 & 그룹핑 전략 분석

## 📊 현재 시드 현황 분석

### 통계
- **총 시드 개수**: 65개
- **카테고리 수**: 17개
- **가중치 분포**:
  - Weight 5: 1개 (1.5%)
  - Weight 4: 11개 (17%)
  - Weight 3: 35개 (54%)
  - Weight 2: 18개 (27.5%)

### 카테고리별 분포

| 카테고리 | 개수 | 비율 | 대표 시드 |
|---------|------|------|----------|
| **coverage** | 12 | 18% | medicare part a coverage, skilled nursing facility |
| **claims** | 6 | 9% | medicare claims denied, claim denial reasons |
| **enrollment** | 9 | 14% | medicare open enrollment, special enrollment period |
| **costs** | 7 | 11% | medicare part b premium, irmaa medicare |
| **prescription** | 4 | 6% | part d donut hole, prescription drug coverage |
| **billing** | 3 | 5% | medicare billing errors, billing codes |
| **appeals** | 3 | 5% | medicare appeal process, appeal timeline |
| **medigap** | 3 | 5% | medigap plan g, medigap plan n |
| **penalties** | 3 | 5% | late enrollment penalty, medicare penalties |
| **documents** | 3 | 5% | annual notice of change, enrollment documents |
| **eligibility** | 3 | 5% | medicare eligibility age, dual eligible |
| **advantage** | 2 | 3% | medicare advantage network restrictions |
| **comparison** | 2 | 3% | medicare advantage vs medigap |
| **savings** | 1 | 1.5% | medicare savings program |
| **caregivers** | 1 | 1.5% | medicare for caregivers |
| **retirement** | 1 | 1.5% | medicare coverage after retirement |
| **basics** | 1 | 1.5% | medicare basics |

---

## ✅ 시드 확장 필요성 판단

### 결론: **부분 확장 권장 (현재 65개 → 85-100개)**

#### 확장이 필요한 이유

1. **카테고리 불균형**
   - Coverage(12개), Claims(6개)에 과도하게 집중
   - Basics(1개), Caregivers(1개), Retirement(1개)처럼 중요하지만 1개만 있는 카테고리 존재
   
2. **트렌드 반영 부족**
   - 2024-2026년 새로운 Medicare 정책 미반영
   - Telehealth, Mental Health, Preventive Care 같은 최신 주제 없음
   
3. **User Intent 갭**
   - 절차/실행 키워드는 많지만 (enrollment, claims)
   - 비교/의사결정 키워드 부족 ("best", "vs", "worth it")
   - 문제 해결 키워드 부족 ("what to do if", "how to fix")

4. **SEO 기회 누락**
   - Long-tail 질문형 시드 부족 ("can I", "do I need")
   - 지역 기반 키워드 없음 ("in [state]", "near me" 변형)
   - 시즌 이벤트 없음 ("tax season", "flu season")

---

## 🎯 추천 확장 시드 (20-35개)

### 신규 카테고리 추가

#### 1. **telehealth** (새 카테고리)
```typescript
{ term: "medicare telehealth coverage", weight: 3, category: "telehealth" },
{ term: "medicare virtual visits", weight: 2, category: "telehealth" },
{ term: "medicare online doctor appointments", weight: 2, category: "telehealth" },
```

#### 2. **mental-health** (새 카테고리)
```typescript
{ term: "medicare mental health coverage", weight: 3, category: "mental-health" },
{ term: "medicare therapy sessions", weight: 2, category: "mental-health" },
{ term: "medicare counseling benefits", weight: 2, category: "mental-health" },
```

#### 3. **preventive** (새 카테고리)
```typescript
{ term: "medicare preventive care", weight: 3, category: "preventive" },
{ term: "medicare annual wellness visit", weight: 3, category: "preventive" },
{ term: "medicare screenings covered", weight: 2, category: "preventive" },
{ term: "medicare vaccines coverage", weight: 2, category: "preventive" },
```

#### 4. **decision** (새 카테고리 - 의사결정)
```typescript
{ term: "is medicare advantage worth it", weight: 4, category: "decision" },
{ term: "should I drop medicare part b", weight: 3, category: "decision" },
{ term: "medicare supplement vs advantage", weight: 4, category: "decision" },
{ term: "best medicare plan for diabetics", weight: 3, category: "decision" },
```

#### 5. **troubleshooting** (새 카테고리 - 문제 해결)
```typescript
{ term: "what to do if medicare denies claim", weight: 4, category: "troubleshooting" },
{ term: "how to fix medicare coverage gap", weight: 3, category: "troubleshooting" },
{ term: "medicare not covering procedure", weight: 3, category: "troubleshooting" },
```

### 기존 카테고리 강화

#### **basics** (1개 → 4개)
```typescript
{ term: "how does medicare work", weight: 3, category: "basics" },
{ term: "medicare explained for beginners", weight: 2, category: "basics" },
{ term: "medicare parts a b c d explained", weight: 3, category: "basics" },
```

#### **caregivers** (1개 → 4개)
```typescript
{ term: "medicare respite care coverage", weight: 3, category: "caregivers" },
{ term: "medicare home care benefits", weight: 2, category: "caregivers" },
{ term: "medicare caregiver support", weight: 2, category: "caregivers" },
```

#### **retirement** (1개 → 4개)
```typescript
{ term: "medicare at 62 vs 65", weight: 3, category: "retirement" },
{ term: "medicare when retiring abroad", weight: 2, category: "retirement" },
{ term: "medicare with employer insurance", weight: 3, category: "retirement" },
```

#### **comparison** (2개 → 6개)
```typescript
{ term: "medicare vs medicaid differences", weight: 4, category: "comparison" },
{ term: "original medicare vs medicare advantage", weight: 4, category: "comparison" },
{ term: "medicare plan f vs plan g", weight: 3, category: "comparison" },
{ term: "medicare part d plan comparison", weight: 3, category: "comparison" },
```

---

## 🎨 시드 그룹핑 UI 설계

### 목표
- 사용자가 카테고리를 선택하면 해당 시드들이 자동으로 선택됨
- 개별 시드도 선택/해제 가능
- **자동 모드**(기존) + **수동 모드**(신규) 전환

---

### UI 구조

```
┌─────────────────────────────────────────────────────┐
│  키워드 발굴 시동                                      │
├─────────────────────────────────────────────────────┤
│                                                       │
│  모드 선택:                                            │
│  ○ 자동 발굴 (AI 추천)   ● 수동 선택 (카테고리 선택)    │
│                                                       │
│  ┌───────────────────────────────────────────────┐  │
│  │  [수동 모드 활성화 시]                          │  │
│  │                                                │  │
│  │  카테고리 선택 (복수 선택 가능):                 │  │
│  │                                                │  │
│  │  ☑ Coverage (12)      ☑ Enrollment (9)       │  │
│  │  ☐ Claims (6)         ☑ Costs (7)            │  │
│  │  ☐ Prescription (4)   ☐ Billing (3)          │  │
│  │  ☐ Appeals (3)        ☐ Medigap (3)          │  │
│  │  ...                                           │  │
│  │                                                │  │
│  │  선택된 시드 미리보기 (28개):                    │  │
│  │  ┌─────────────────────────────────────────┐  │  │
│  │  │ • medicare part a coverage  (W:2)      │  │  │
│  │  │ • medicare part b coverage  (W:2)      │  │  │
│  │  │ • medicare open enrollment  (W:3) 🔥   │  │  │
│  │  │ • medicare part b premium   (W:3)      │  │  │
│  │  │ ...                                    │  │  │
│  │  │                          [개별 편집 ▼]  │  │  │
│  │  └─────────────────────────────────────────┘  │  │
│  │                                                │  │
│  │  [시작하기]  [초기화]                           │  │
│  └───────────────────────────────────────────────┘  │
│                                                       │
└─────────────────────────────────────────────────────┘
```

---

### 컴포넌트 구조

```typescript
// components/seed-selector.tsx

interface SeedSelectorProps {
  mode: 'auto' | 'manual';
  onModeChange: (mode: 'auto' | 'manual') => void;
  onSeedsSelected: (seeds: Seed[]) => void;
}

export function SeedSelector({ mode, onModeChange, onSeedsSelected }: SeedSelectorProps) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSeeds, setSelectedSeeds] = useState<Seed[]>([]);
  
  // 카테고리 선택 시 해당 카테고리의 모든 시드 자동 추가
  const handleCategoryToggle = (category: string) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(prev => prev.filter(c => c !== category));
      setSelectedSeeds(prev => prev.filter(s => s.category !== category));
    } else {
      setSelectedCategories(prev => [...prev, category]);
      const categorySeeds = getSeedsByCategory(category);
      setSelectedSeeds(prev => [...prev, ...categorySeeds]);
    }
  };
  
  // 개별 시드 선택/해제
  const handleSeedToggle = (seed: Seed) => {
    setSelectedSeeds(prev => 
      prev.some(s => s.term === seed.term)
        ? prev.filter(s => s.term !== seed.term)
        : [...prev, seed]
    );
  };
  
  return (
    <div>
      {/* 모드 토글 */}
      <RadioGroup value={mode} onValueChange={onModeChange}>
        <Radio value="auto">자동 발굴 (AI 추천)</Radio>
        <Radio value="manual">수동 선택 (카테고리 선택)</Radio>
      </RadioGroup>
      
      {mode === 'manual' && (
        <>
          {/* 카테고리 그리드 */}
          <div className="grid grid-cols-3 gap-4">
            {SEED_CATEGORIES.map(cat => {
              const count = getSeedsByCategory(cat).length;
              const isSelected = selectedCategories.includes(cat);
              
              return (
                <button
                  key={cat}
                  onClick={() => handleCategoryToggle(cat)}
                  className={`p-4 rounded-xl border-2 transition ${
                    isSelected 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-bold capitalize">{cat}</div>
                  <div className="text-sm text-gray-500">({count}개)</div>
                </button>
              );
            })}
          </div>
          
          {/* 선택된 시드 미리보기 */}
          {selectedSeeds.length > 0 && (
            <Card className="mt-6">
              <h3>선택된 시드 ({selectedSeeds.length}개)</h3>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {selectedSeeds.map(seed => (
                  <div key={seed.term} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      <span>{seed.term}</span>
                      <Badge variant="outline">W:{seed.weight}</Badge>
                      {seed.weight >= 4 && <span>🔥</span>}
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleSeedToggle(seed)}
                    >
                      ✕
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          )}
          
          <div className="flex gap-4 mt-6">
            <Button 
              onClick={() => onSeedsSelected(selectedSeeds)}
              disabled={selectedSeeds.length === 0}
            >
              시작하기 ({selectedSeeds.length}개 시드)
            </Button>
            <Button 
              variant="outline"
              onClick={() => {
                setSelectedCategories([]);
                setSelectedSeeds([]);
              }}
            >
              초기화
            </Button>
          </div>
        </>
      )}
      
      {mode === 'auto' && (
        <Button onClick={() => onSeedsSelected([])}>
          자동 키워드 발굴 시작
        </Button>
      )}
    </div>
  );
}
```

---

### API 수정

```typescript
// app/api/keywords/generate/route.ts

export async function POST(req: Request) {
  const body = await req.json();
  const manualSeeds = body.seeds as Seed[] | undefined;
  
  let combinedSeeds;
  
  if (manualSeeds && manualSeeds.length > 0) {
    // 수동 모드: 사용자가 선택한 시드만 사용
    console.log(`[API] Manual seed selection: ${manualSeeds.length} seeds`);
    
    // 트렌드는 여전히 추가 (선택사항)
    const trendSeeds = await fetchGoogleTrendsDaily("US");
    
    combinedSeeds = [
      ...manualSeeds.slice(0, 3).map(s => ({ term: s.term, source: 'manual' as const })),
      ...trendSeeds.slice(0, 2).map(t => ({ term: t, source: 'trend' as const }))
    ];
    
  } else {
    // 자동 모드: 기존 로직 (Smart Rotation)
    const { evergreenSeeds, trendSeeds } = await autoSelectSeeds();
    combinedSeeds = [...evergreenSeeds, ...trendSeeds];
  }
  
  // 나머지 키워드 생성 로직 동일...
}
```

---

### SemiAutoBlogger 통합

```typescript
// components/semi-auto-blogger.tsx

export function SemiAutoBlogger() {
  const [seedMode, setSeedMode] = useState<'auto' | 'manual'>('auto');
  const [selectedSeeds, setSelectedSeeds] = useState<Seed[]>([]);
  
  const handleFindKeywords = async () => {
    setLoading(true);
    try {
      const body = seedMode === 'manual' 
        ? { seeds: selectedSeeds }
        : {};
      
      const res = await fetch("/api/keywords/generate", { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      
      const data = await res.json();
      setKeywords(data.keywords || []);
      // ...
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div>
      {step === "topic" && (
        <>
          <SeedSelector 
            mode={seedMode}
            onModeChange={setSeedMode}
            onSeedsSelected={setSelectedSeeds}
          />
          
          <Button onClick={handleFindKeywords}>
            {seedMode === 'auto' ? '자동 발굴 시작' : `선택한 시드로 시작 (${selectedSeeds.length}개)`}
          </Button>
        </>
      )}
      {/* ... */}
    </div>
  );
}
```

---

## 📝 최종 권장사항

### 1. 시드 확장
✅ **20-35개 추가 권장** (65개 → 85-100개)
- 신규 카테고리 5개 추가
- 기존 약한 카테고리 강화
- 2026년 트렌드 반영

### 2. 그룹핑 UI
✅ **2가지 모드 구현**
- **자동 모드**: 기존 Smart Rotation (기본값)
- **수동 모드**: 카테고리 선택 → 시드 미리보기 → 개별 편집 가능

### 3. 구현 우선순위
1. **먼저**: 시드 그룹핑 UI (1시간)
2. **다음**: API 수정 (30분)
3. **마지막**: 시드 확장 (검토 후 추가, 30분)

---

## 다음 단계

어떻게 진행할까요?

**A**: 시드 그룹핑 UI부터 구현 (SeedSelector 컴포넌트)
**B**: 시드 확장 먼저 (defaultSeeds.ts에 20-35개 추가)
**C**: 전체 설계 검토 후 한 번에 구현

말씀해 주시면 바로 시작하겠습니다!
