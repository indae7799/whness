import Link from "next/link"
import { ArrowRight, Plus } from "lucide-react"

export default function DashboardPage() {
    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-50">대시보드</h1>
                    <p className="mt-2 text-gray-500 dark:text-gray-400">
                        블로그 콘텐츠 생성 및 발행 현황을 한눈에 확인하세요.
                    </p>
                </div>
                <Link
                    href="/articles/new"
                    className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                >
                    <Plus size={18} />
                    새 글 작성
                </Link>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                    { label: "이번 달 발행", value: "0", sub: "목표 30개" },
                    { label: "생성된 단어", value: "0", sub: "이번 달 누적" },
                    { label: "평균 SEO 점수", value: "-", sub: "Rank Math 기준" },
                    { label: "남은 크레딧", value: "∞", sub: "무제한 플랜" },
                ].map((stat, i) => (
                    <div key={i} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-black">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{stat.label}</p>
                        <div className="mt-2 flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-gray-900 dark:text-gray-50">{stat.value}</span>
                        </div>
                        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{stat.sub}</p>
                    </div>
                ))}
            </div>

            {/* Recent Activity */}
            <div className="rounded-xl border border-gray-200 bg-white dark:border-zinc-800 dark:bg-black">
                <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-zinc-800">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-50">최근 발행 내역</h3>
                    <Link href="/articles" className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline dark:text-blue-400">
                        모두 보기 <ArrowRight size={16} />
                    </Link>
                </div>
                <div className="p-6 text-center text-gray-500 dark:text-gray-400 py-12">
                    <p>아직 생성된 콘텐츠가 없습니다.</p>
                    <Link href="/articles/new" className="mt-2 inline-block text-sm text-blue-600 underline dark:text-blue-400">
                        첫 번째 글을 작성해보세요
                    </Link>
                </div>
            </div>
        </div>
    )
}
