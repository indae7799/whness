# AI-Powered SEO Blog Auto-Publishing Platform

Reddit, StackExchange, Google Trends 등 다양한 소스에서 자동으로 데이터를 수집하고, AI를 활용하여 SEO 최적화된 롱테일 키워드를 발굴한 후, Rank Math 80점 이상의 고품질 블로그 글을 자동 생성하여 WordPress에 발행하는 올인원 자동화 플랫폼입니다.

## 🚀 시작하기

### 필수 요구사항

- Node.js 20+
- PostgreSQL 16+
- Redis 7+ (선택사항, Phase 2에서 필요)
- OpenAI API Key

### 설치 및 설정

1. **의존성 설치**
```bash
npm install
```

2. **환경 변수 설정**
`.env.local` 파일을 생성하고 다음 변수들을 설정하세요:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/whnessmaker"

# OpenAI
OPENAI_API_KEY=sk-your-openai-api-key

# Redis (선택사항)
REDIS_URL=redis://127.0.0.1:6379

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
```

3. **데이터베이스 마이그레이션**
```bash
npx prisma migrate dev --name init
npx prisma generate
```

4. **개발 서버 실행**
```bash
npm run dev
```

## 📋 개발 지침

이 프로젝트는 **`지니어스.md`** 파일에 명시된 프롬프트 최적화 원칙을 개발 지침으로 따릅니다.

- 명확하고 구체적인 코드 작성
- 맥락과 의도를 명확히 전달
- 구조화된 개발 프로세스 유지

자세한 내용은 [`지니어스.md`](./지니어스.md)와 [`개발가이드.md`](./개발가이드.md) 파일을 참조하세요.

## 🏗️ 프로젝트 구조

```
whness/
├── app/                    # Next.js App Router
│   ├── (dashboard)/        # 대시보드 라우트
│   ├── api/                # API 라우트
│   └── ...
├── lib/                    # 공유 라이브러리
│   ├── prisma.ts          # Prisma 클라이언트
│   ├── openai.ts          # OpenAI 클라이언트
│   ├── types.ts           # 공통 타입 정의
│   └── supabase/          # Supabase 클라이언트
├── prisma/                 # Prisma 스키마
│   └── schema.prisma
└── ...
```

## 📖 문서

- [PRD (Product Requirements Document)](./blog-prd.md)
- [개발 가이드](./개발가이드.md)
- [Supabase 사용법](./SUPABASE_사용법.md)

## 🎯 Phase별 개발 계획

### Phase 1: Proof of Concept (현재 진행 중)
- ✅ Manual Mode: 수동 키워드 입력
- ✅ GPT-4o 기반 content generation
- ✅ WordPress immediate publish
- ✅ Basic dashboard

### Phase 2: Core Automation
- Auto Mode 추가
- Basic research (Reddit + Google Trends)
- Keyword scoring & selection
- Auto image generation

### Phase 3: Enhanced Features
- Full research sources
- Multiple WordPress sites
- Dashboard with analytics
- Batch processing

## 📝 라이선스

Private
