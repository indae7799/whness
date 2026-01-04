"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { FileText, Plus, Search, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface Article {
    id: string
    title: string
    keyword: string
    status: "draft" | "published"
    wpUrl?: string
    createdAt: string
    wordCount: number
    seoScore?: number
}

export default function ArticlesPage() {
    const [articles, setArticles] = useState<Article[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")

    useEffect(() => {
        // Fetch articles from API
        const fetchArticles = async () => {
            try {
                const res = await fetch("/api/articles")
                const data = await res.json()
                setArticles(data.articles || [])
            } catch (error) {
                console.error("Failed to fetch articles:", error)
            } finally {
                setIsLoading(false)
            }
        }
        fetchArticles()
    }, [])

    const filteredArticles = articles.filter(article =>
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.keyword.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="space-y-8 max-w-5xl mx-auto py-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-50">글 목록</h1>
                    <p className="mt-2 text-gray-500 dark:text-gray-400">
                        생성된 모든 콘텐츠를 관리합니다.
                    </p>
                </div>
                <Link href="/articles/new">
                    <Button>
                        <Plus size={18} className="mr-2" /> 새 글 작성
                    </Button>
                </Link>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="제목 또는 키워드로 검색..."
                    className="pl-10"
                />
            </div>

            {/* Articles List */}
            <div className="rounded-xl border border-gray-200 bg-white dark:border-zinc-800 dark:bg-black overflow-hidden">
                {isLoading ? (
                    <div className="p-8 text-center text-gray-400">불러오는 중...</div>
                ) : filteredArticles.length === 0 ? (
                    <div className="p-12 text-center">
                        <FileText className="mx-auto mb-4 text-gray-300" size={48} />
                        <p className="text-gray-500">아직 생성된 글이 없습니다.</p>
                        <Link href="/articles/new" className="mt-4 inline-block text-blue-600 hover:underline">
                            첫 번째 글 작성하기 →
                        </Link>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100 dark:divide-zinc-800">
                        {filteredArticles.map((article) => (
                            <div key={article.id} className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-zinc-900">
                                <div className="flex-1">
                                    <h3 className="font-medium">{article.title}</h3>
                                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                                        <span>{article.keyword}</span>
                                        <span>•</span>
                                        <span>{article.wordCount.toLocaleString()} 단어</span>
                                        <span>•</span>
                                        <span>{new Date(article.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`px-2 py-1 text-xs rounded ${article.status === "published"
                                            ? "bg-green-100 text-green-700"
                                            : "bg-yellow-100 text-yellow-700"
                                        }`}>
                                        {article.status === "published" ? "발행됨" : "임시저장"}
                                    </span>
                                    {article.wpUrl && (
                                        <a href={article.wpUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                                            <ExternalLink size={16} />
                                        </a>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
