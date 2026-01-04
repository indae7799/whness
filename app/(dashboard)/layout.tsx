import Link from "next/link"
import { LayoutDashboard, PenSquare, Settings, LogOut, Sparkles, BarChart3, FileText, Globe, Search } from "lucide-react"

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex min-h-screen flex-col md:flex-row bg-gray-50 dark:bg-zinc-900">
            {/* Sidebar - Desktop */}
            <aside className="hidden w-64 flex-col border-r border-gray-200 bg-white px-6 py-8 dark:border-zinc-800 dark:bg-black md:flex">
                {/* Clickable Logo - Goes to Home */}
                <Link href="/" className="mb-10 flex items-center gap-2 px-2 hover:opacity-80 transition-opacity">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600"></div>
                    <span className="text-xl font-bold tracking-tight">Whness</span>
                </Link>

                <nav className="flex flex-1 flex-col gap-1">
                    <Link
                        href="/dashboard"
                        className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-zinc-800 dark:hover:text-gray-50"
                    >
                        <LayoutDashboard size={20} />
                        대시보드
                    </Link>
                    <Link
                        href="/articles/new"
                        className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-zinc-800 dark:hover:text-gray-50"
                    >
                        <PenSquare size={20} />
                        새 글 작성
                    </Link>
                    <Link
                        href="/auto"
                        className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-zinc-800 dark:hover:text-gray-50"
                    >
                        <Sparkles size={20} />
                        자동 모드
                    </Link>
                    <Link
                        href="/batch"
                        className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-zinc-800 dark:hover:text-gray-50"
                    >
                        <FileText size={20} />
                        일괄 처리
                    </Link>
                    <Link
                        href="/keywords"
                        className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-zinc-800 dark:hover:text-gray-50"
                    >
                        <Search size={20} />
                        키워드 생성
                    </Link>

                    <div className="my-2 border-t border-gray-100 dark:border-zinc-800"></div>

                    <Link
                        href="/analytics"
                        className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-zinc-800 dark:hover:text-gray-50"
                    >
                        <BarChart3 size={20} />
                        분석
                    </Link>
                    <Link
                        href="/sites"
                        className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-zinc-800 dark:hover:text-gray-50"
                    >
                        <Globe size={20} />
                        사이트 관리
                    </Link>
                    <Link
                        href="/settings"
                        className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-zinc-800 dark:hover:text-gray-50"
                    >
                        <Settings size={20} />
                        설정
                    </Link>
                </nav>

                <div className="mt-auto">
                    <button className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20">
                        <LogOut size={20} />
                        로그아웃
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8">
                <div className="mx-auto max-w-5xl">
                    {children}
                </div>
            </main>
        </div>
    )
}
