import { ArrowRight, BarChart2, Check, ExternalLink, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type KeywordData = {
    phrase: string
    score: number
    difficulty: "Easy" | "Medium" | "Hard"
    traffic: "Low" | "Medium" | "High" | "Very High"
    snippetChance: number
}

interface KeywordRecommendationsProps {
    keywords: KeywordData[]
    onSelect: (keyword: KeywordData) => void
}

export default function KeywordRecommendations({ keywords, onSelect }: KeywordRecommendationsProps) {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        AI 추천 키워드
                        <span className="inline-flex items-center rounded-full border border-purple-200 bg-purple-50 px-2.5 py-0.5 text-xs font-semibold text-purple-700 dark:border-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                            Top 10
                        </span>
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        분석된 데이터를 바탕으로 가장 효과적인 키워드를 선별했습니다.
                    </p>
                </div>
            </div>

            <div className="grid gap-4">
                {keywords.map((kw, i) => (
                    <div
                        key={i}
                        className="group relative flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-5 transition-all hover:border-blue-300 hover:shadow-md dark:border-zinc-800 dark:bg-black dark:hover:border-blue-700"
                    >
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                    {kw.phrase}
                                </h3>
                                <div className="mt-2 flex flex-wrap gap-2 text-sm">
                                    <Badge label={`난이도: ${kw.difficulty}`} color={kw.difficulty === 'Easy' ? 'green' : kw.difficulty === 'Medium' ? 'yellow' : 'red'} />
                                    <Badge label={`트래픽: ${kw.traffic}`} color="blue" />
                                    <Badge label={`스니펫 확률: ${kw.snippetChance}%`} color="purple" />
                                </div>
                            </div>

                            <div className="flex flex-col items-end gap-1">
                                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                    {kw.score}
                                    <span className="text-sm font-normal text-gray-400">/100</span>
                                </div>
                                <span className="text-xs text-gray-400">종합 점수</span>
                            </div>
                        </div>

                        <div className="mt-2 flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-zinc-800">
                            <Button onClick={() => onSelect(kw)} className="w-full sm:w-auto">
                                이 키워드로 글 작성 <ArrowRight size={16} className="ml-2" />
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

function Badge({ label, color }: { label: string, color: string }) {
    const styles: Record<string, string> = {
        green: "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800",
        blue: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
        purple: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800",
        yellow: "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800",
        red: "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
    }

    return (
        <span className={cn("inline-flex items-center rounded-md border px-2 py-1 text-xs font-medium", styles[color] || styles.blue)}>
            {label}
        </span>
    )
}
