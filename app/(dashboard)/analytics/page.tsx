"use client"

import { useState, useEffect } from "react"
import { BarChart3, TrendingUp, DollarSign, FileText, Calendar, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface AnalyticsData {
    totalPosts: number
    totalWords: number
    avgSeoScore: number
    totalCost: number
    monthlyCosts: { month: string; cost: number }[]
    topKeywords: { keyword: string; posts: number; avgScore: number }[]
}

export default function AnalyticsPage() {
    const [data, setData] = useState<AnalyticsData>({
        totalPosts: 0,
        totalWords: 0,
        avgSeoScore: 0,
        totalCost: 0,
        monthlyCosts: [],
        topKeywords: []
    })
    const [isLoading, setIsLoading] = useState(true)
    const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("30d")

    useEffect(() => {
        // Simulate fetching analytics data
        setIsLoading(true)
        setTimeout(() => {
            setData({
                totalPosts: 0,
                totalWords: 0,
                avgSeoScore: 0,
                totalCost: 0,
                monthlyCosts: [
                    { month: "1월", cost: 0 },
                    { month: "2월", cost: 0 },
                ],
                topKeywords: []
            })
            setIsLoading(false)
        }, 500)
    }, [timeRange])

    return (
        <div className="space-y-8 max-w-5xl mx-auto py-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-50 flex items-center gap-3">
                        <BarChart3 className="text-green-600" />
                        분석 대시보드
                    </h1>
                    <p className="mt-2 text-gray-500 dark:text-gray-400">
                        콘텐츠 성과와 비용을 한눈에 확인하세요.
                    </p>
                </div>

                <div className="flex gap-2">
                    {(["7d", "30d", "90d"] as const).map((range) => (
                        <Button
                            key={range}
                            variant={timeRange === range ? "default" : "outline"}
                            size="sm"
                            onClick={() => setTimeRange(range)}
                        >
                            {range === "7d" ? "7일" : range === "30d" ? "30일" : "90일"}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Overview Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-black">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-500">총 발행 글</p>
                        <FileText className="text-blue-600" size={20} />
                    </div>
                    <p className="mt-2 text-3xl font-bold">{data.totalPosts}</p>
                    <p className="text-xs text-gray-400 mt-1">선택 기간 내</p>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-black">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-500">총 단어 수</p>
                        <BarChart3 className="text-green-600" size={20} />
                    </div>
                    <p className="mt-2 text-3xl font-bold">{data.totalWords.toLocaleString()}</p>
                    <p className="text-xs text-gray-400 mt-1">AI 생성 콘텐츠</p>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-black">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-500">평균 SEO 점수</p>
                        <TrendingUp className="text-purple-600" size={20} />
                    </div>
                    <p className="mt-2 text-3xl font-bold">{data.avgSeoScore || "-"}</p>
                    <p className="text-xs text-gray-400 mt-1">Rank Math 기준</p>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-black">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-500">총 비용</p>
                        <DollarSign className="text-orange-600" size={20} />
                    </div>
                    <p className="mt-2 text-3xl font-bold">${data.totalCost.toFixed(2)}</p>
                    <p className="text-xs text-gray-400 mt-1">OpenAI + DALL-E</p>
                </div>
            </div>

            {/* Cost Chart Placeholder */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-black">
                <h3 className="font-semibold text-lg mb-4">월별 비용 추이</h3>
                <div className="h-64 flex items-center justify-center text-gray-400">
                    <p>데이터가 쌓이면 여기에 차트가 표시됩니다.</p>
                </div>
            </div>

            {/* Top Keywords */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-black">
                <h3 className="font-semibold text-lg mb-4">상위 키워드</h3>
                {data.topKeywords.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                        <p>아직 분석할 데이터가 없습니다.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {data.topKeywords.map((kw, i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg dark:bg-zinc-900">
                                <span className="font-medium">{kw.keyword}</span>
                                <div className="flex items-center gap-4">
                                    <span className="text-sm text-gray-500">{kw.posts}개 글</span>
                                    <span className="text-sm font-medium text-green-600">SEO {kw.avgScore}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
