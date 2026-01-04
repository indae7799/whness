// 예시 1: 데이터 가져오기 (서버에서)
import { createClient } from '@/lib/supabase/server'

export default async function ExamplesPage() {
  const supabase = await createClient()
  
  // 예시: 'users' 테이블에서 데이터 가져오기
  // 실제 테이블 이름으로 바꿔서 사용하세요
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .limit(10)

  if (error) {
    return <div>에러 발생: {error.message}</div>
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Supabase 예시</h1>
      
      <div className="space-y-4">
        <h2 className="text-xl">데이터 목록:</h2>
        {data && data.length > 0 ? (
          <ul className="list-disc pl-6">
            {data.map((item: any, index: number) => (
              <li key={index}>{JSON.stringify(item)}</li>
            ))}
          </ul>
        ) : (
          <p>데이터가 없습니다.</p>
        )}
      </div>
    </div>
  )
}
