import Link from "next/link"
import { ArrowRight, Sparkles, PenSquare, Settings, Search } from "lucide-react"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-zinc-900 dark:via-black dark:to-purple-950 p-8">
      <main className="text-center space-y-8 max-w-2xl">
        <div className="space-y-4">
          <h1 className="text-5xl font-bold tracking-tight text-gray-900 dark:text-white">
            Whness
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            AI 기반 SEO 블로그 자동 발행 플랫폼
          </p>
        </div>

        <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
          Reddit, Google Trends 등 다양한 소스에서 자동으로 키워드를 발굴하고,<br />
          AI가 SEO 최적화된 블로그 글을 작성하여 WordPress에 자동 발행합니다.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <Link
            href="/articles/new"
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
          >
            <PenSquare size={20} />
            새 글 작성
            <ArrowRight size={18} />
          </Link>

          <Link
            href="/auto"
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg border border-gray-200 bg-white text-gray-700 font-medium hover:bg-gray-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-200 dark:hover:bg-zinc-800 transition-colors"
          >
            <Sparkles size={20} />
            자동 모드
          </Link>

          <Link
            href="/keywords"
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg border border-gray-200 bg-white text-gray-700 font-medium hover:bg-gray-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-200 dark:hover:bg-zinc-800 transition-colors"
          >
            <Search size={20} />
            키워드 생성
          </Link>

          <Link
            href="/settings"
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg border border-gray-200 bg-white text-gray-700 font-medium hover:bg-gray-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-200 dark:hover:bg-zinc-800 transition-colors"
          >
            <Settings size={20} />
            설정
          </Link>
        </div>

        <div className="pt-8 text-sm text-gray-400">
          Phase 1: 수동 모드 완료 | Phase 2: 자동 모드 진행 중
        </div>
      </main>
    </div>
  )
}
