// 예시 2: 버튼 클릭으로 데이터 추가하기 (클라이언트에서)
'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'

export default function ButtonExample() {
  const [message, setMessage] = useState('')
  const supabase = createClient()

  const handleAddData = async () => {
    try {
      // 예시: 'users' 테이블에 데이터 추가
      // 실제 테이블 이름과 컬럼으로 바꿔서 사용하세요
      const { error } = await supabase
        .from('users')
        .insert({ 
          name: '새 사용자',
          created_at: new Date().toISOString()
        })

      if (error) {
        setMessage('에러: ' + error.message)
      } else {
        setMessage('데이터가 추가되었습니다!')
      }
    } catch (err) {
      setMessage('오류가 발생했습니다.')
    }
  }

  return (
    <div className="p-4">
      <button
        onClick={handleAddData}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        데이터 추가하기
      </button>
      {message && <p className="mt-2">{message}</p>}
    </div>
  )
}
