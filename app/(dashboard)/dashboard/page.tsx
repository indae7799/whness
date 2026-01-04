import Link from "next/link"
import { ArrowRight, Plus, BarChart3, FileText, Clock, TrendingUp } from "lucide-react"

export default function DashboardPage() {
    return (
        <div className="space-y-8 max-w-5xl mx-auto py-8">
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
                    { label: "이번 달 발행", value: "0", sub: "목표 30개", icon: FileText, color: "text-blue-600" },
                    { label: "생성된 단어", value: "0", sub: "이번 달 누적", icon: BarChart3, color: "text-green-600" },
                    { label: "평균 SEO 점수", value: "-", sub: "Rank Math 기준", icon: TrendingUp, color: "text-purple-600" },
                    { label: "대기 중 작업", value: "0", sub: "자동화 큐", icon: Clock, color: "text-orange-600" },
                ].map((stat, i) => (
                    <div key={i} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-black">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{stat.label}</p>
                            <stat.icon className={stat.color} size={20} />
                        </div>
                        <div className="mt-2 flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-gray-900 dark:text-gray-50">{stat.value}</span>
                        </div>
                        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{stat.sub}</p>
                    </div>
                ))}
            </div>

            {/* Quick Actions */}
            <div className="grid gap-4 md:grid-cols-3">
                <Link href="/articles/new" className="group rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:border-blue-300 hover:shadow-md transition-all dark:border-zinc-800 dark:bg-black dark:hover:border-blue-700">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <Plus className="text-blue-600" size={20} />
                        새 글 작성
                    </h3>
                    <p className="mt-2 text-sm text-gray-500">AI가 SEO 최적화된 블로그 글을 작성합니다.</p>
                </Link>

                <Link href="/auto" className="group rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:border-purple-300 hover:shadow-md transition-all dark:border-zinc-800 dark:bg-black dark:hover:border-purple-700">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <Clock className="text-purple-600" size={20} />
                        자동 모드
                    </h3>
                    <p className="mt-2 text-sm text-gray-500">자동으로 키워드 발굴부터 발행까지.</p>
                </Link>

                <Link href="/analytics" className="group rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:border-green-300 hover:shadow-md transition-all dark:border-zinc-800 dark:bg-black dark:hover:border-green-700">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <BarChart3 className="text-green-600" size={20} />
                        분석
                    </h3>
                    <p className="mt-2 text-sm text-gray-500">콘텐츠 성과와 비용을 분석합니다.</p>
                </Link>
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
