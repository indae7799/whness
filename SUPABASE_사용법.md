# Supabase 사용법 (비개발자용)

## 간단 설명

**복잡한 건 몰라도 됩니다!** 그냥 이렇게 사용하세요:

### 1. 데이터 가져오기 (읽기)

```typescript
// app/page.tsx 같은 파일에서
import { createClient } from '@/lib/supabase/server'

export default async function Page() {
  const supabase = await createClient()
  
  // 테이블에서 데이터 가져오기
  const { data, error } = await supabase
    .from('테이블이름')
    .select('*')
  
  return <div>{/* 데이터 표시 */}</div>
}
```

### 2. 버튼 클릭 같은 동작 (쓰기)

```typescript
// 'use client'를 맨 위에 적어주세요
'use client'
import { createClient } from '@/lib/supabase/client'

export default function Button() {
  const supabase = createClient()
  
  const handleClick = async () => {
    // 데이터 추가하기
    await supabase
      .from('테이블이름')
      .insert({ 이름: '값' })
  }
  
  return <button onClick={handleClick}>클릭</button>
}
```

## 핵심 규칙

1. **일반 페이지** → `@/lib/supabase/server` 사용
2. **버튼, 입력창 같은 것** → 파일 맨 위에 `'use client'` 적고 `@/lib/supabase/client` 사용

이게 전부입니다! 🎉
