"use client"

import { useState, useEffect } from "react"
import { Sparkles, Clock, Calendar, CheckSquare, Rocket, RefreshCw, FileText, AlertCircle, Trash2, RotateCcw, Image as ImageIcon, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { TEXT_MODELS, IMAGE_MODELS, DEFAULT_TEXT_MODEL, DEFAULT_IMAGE_MODEL, type TextModel, type ImageModel } from "@/lib/config/models"

interface Article {
    id: string
    title: string
    keyword: string // API returns 'keyword' not 'focusKeyword'
    seoScore: number // API returns 'seoScore' not 'estimatedScore'
    status: string
    createdAt: string
}

export function AutoModeSettings() {
    // Configuration State
    const [targetCount, setTargetCount] = useState(1)
    const [scheduleDate, setScheduleDate] = useState("")

    // Model Selection State
    const [selectedTextModel, setSelectedTextModel] = useState<TextModel>(DEFAULT_TEXT_MODEL)
    const [selectedImageModel, setSelectedImageModel] = useState<ImageModel>(DEFAULT_IMAGE_MODEL)
    const [showModelSettings, setShowModelSettings] = useState(false)

    // UI State
    const [isGenerating, setIsGenerating] = useState(false)
    const [isPublishing, setIsPublishing] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [regeneratingId, setRegeneratingId] = useState<string | null>(null)
    const [regeneratingImageId, setRegeneratingImageId] = useState<string | null>(null)
    const [articles, setArticles] = useState<Article[]>([])
    const [selectedIds, setSelectedIds] = useState<string[]>([])

    // Load initial data
    useEffect(() => {
        fetchDrafts()
    }, [])

    const fetchDrafts = async () => {
        try {
            const res = await fetch("/api/automation?status=draft")
            const data = await res.json()
            // API returns array directly, not { articles: [...] }
            if (Array.isArray(data)) {
                setArticles(data)
            }
        } catch (error) {
            console.error("Failed to fetch drafts:", error)
        }
    }

    // 1. Generate Logic (Create Drafts only)
    const handleGenerate = async () => {
        setIsGenerating(true)
        const initialCount = articles.length // Track initial count

        try {
            // Trigger generation with selected models
            await fetch("/api/automation", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "start",
                    config: {
                        mode: "batch",
                        targetCount: targetCount,
                        autoPub: false,
                        textModelId: selectedTextModel.id,
                        imageModelId: selectedImageModel.id
                    }
                })
            })

            // Smart Polling: Stop when new article appears or timeout
            const startTime = Date.now()
            const pollInterval = setInterval(async () => {
                try {
                    const res = await fetch("/api/automation?status=draft")
                    const data = await res.json()

                    // API returns array directly
                    if (Array.isArray(data)) {
                        setArticles(data)

                        // Check if new article was added
                        if (data.length > initialCount) {
                            console.log(`✅ New article detected! Count: ${initialCount} → ${data.length}`)
                            clearInterval(pollInterval)
                            setIsGenerating(false)
                            return
                        }
                    }

                    // Timeout after 180s (3 min for slow models)
                    if (Date.now() - startTime > 180000) {
                        console.log("⏱️ Polling timeout, doing final refresh...")
                        clearInterval(pollInterval)
                        // One final fetch to ensure we have latest data
                        const finalRes = await fetch("/api/automation?status=draft")
                        const finalData = await finalRes.json()
                        if (Array.isArray(finalData)) {
                            setArticles(finalData)
                        }
                        setIsGenerating(false)
                    }
                } catch (pollError) {
                    console.error("Polling error:", pollError)
                }
            }, 2000) // Poll every 2 seconds for faster detection

        } catch (error) {
            console.error("Generation failed:", error)
            setIsGenerating(false)
        }
    }

    // 2. Regenerate Content Logic
    const handleRegenerateContent = async (id: string) => {
        setRegeneratingId(id)
        try {
            await fetch("/api/automation", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "regenerate_content",
                    articleId: id
                })
            })
            alert("글이 재생성되었습니다. 내용을 확인해보세요.")
            fetchDrafts()
        } catch (error) {
            console.error("Regeneration failed:", error)
        } finally {
            setRegeneratingId(null)
        }
    }

    // 3. Regenerate Image Logic
    const handleRegenerateImage = async (id: string) => {
        setRegeneratingImageId(id)
        try {
            await fetch("/api/automation", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "regenerate_image",
                    articleId: id
                })
            })
            alert("이미지가 재생성되었습니다.")
            fetchDrafts()
        } catch (error) {
            console.error("Image regeneration failed:", error)
        } finally {
            setRegeneratingImageId(null)
        }
    }

    // 4. Selection Logic
    const toggleSelection = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        )
    }

    const toggleAll = () => {
        if (selectedIds.length === articles.length) {
            setSelectedIds([])
        } else {
            setSelectedIds(articles.map(a => a.id))
        }
    }

    // 5. Publish Logic
    const handlePublishSelected = async () => {
        if (selectedIds.length === 0) return

        setIsPublishing(true)
        try {
            const res = await fetch("/api/automation", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "publish_selected",
                    articleIds: selectedIds,
                    scheduledAt: scheduleDate || undefined
                })
            })
            const data = await res.json()
            if (data.success) {
                alert(data.message)
                setSelectedIds([])
                fetchDrafts()
            }
        } catch (error) {
            console.error("Publishing failed:", error)
            alert("발행 중 오류가 발생했습니다.")
        } finally {
            setIsPublishing(false)
        }
    }

    // 6. Delete Logic
    const handleDeleteSelected = async () => {
        if (selectedIds.length === 0) return
        if (!confirm(`정말로 선택한 ${selectedIds.length}개의 글을 영구 삭제하시겠습니까?`)) return

        setIsDeleting(true)
        try {
            const res = await fetch("/api/automation", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "delete",
                    articleIds: selectedIds
                })
            })
            const data = await res.json()
            if (data.success) {
                alert("삭제되었습니다.")
                setSelectedIds([])
                fetchDrafts()
            }
        } catch (error) {
            console.error("Delete failed:", error)
        } finally {
            setIsDeleting(false)
        }
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header: Control Panel */}
            <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-card border shadow-xl p-8">
                <div className="flex flex-col md:flex-row justify-between gap-8 items-start md:items-center">
                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 flex items-center gap-3">
                            <Sparkles className="h-8 w-8 text-blue-500" />
                            Auto Content Generator
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400">
                            STEP 1. AI 생성 → STEP 2. 검토 및 재생성 → STEP 3. 발행
                        </p>
                    </div>

                    <div className="flex items-end gap-3 bg-gray-50 dark:bg-muted/50 p-4 rounded-xl border">
                        <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground ml-1">생성 수량</Label>
                            <Input
                                type="number"
                                className="w-24 h-10 bg-white"
                                value={targetCount}
                                onChange={(e) => setTargetCount(Math.max(1, parseInt(e.target.value) || 1))}
                            />
                        </div>
                        <Button
                            size="lg"
                            className="h-10 bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20"
                            onClick={handleGenerate}
                            disabled={isGenerating}
                        >
                            {isGenerating ? (
                                <><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> 생성 중...</>
                            ) : (
                                <><Sparkles className="mr-2 h-4 w-4" /> AI 글 자동생성</>
                            )}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Model Selection Panel */}
            <div className="bg-gradient-to-r from-gray-50 to-blue-50 dark:from-muted/30 dark:to-blue-900/20 rounded-2xl border p-6">
                <button
                    onClick={() => setShowModelSettings(!showModelSettings)}
                    className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 transition-colors w-full"
                >
                    <Settings className="h-4 w-4" />
                    모델 설정
                    <Badge variant="outline" className="ml-2 text-xs">
                        {selectedTextModel.tier === 'free' ? '🆓 무료' : `💰 ${selectedTextModel.name}`}
                    </Badge>
                    <span className="ml-auto text-gray-400">{showModelSettings ? '▲' : '▼'}</span>
                </button>

                {showModelSettings && (
                    <div className="mt-4 grid md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-2">
                        {/* Text Model Selection */}
                        <div className="space-y-3">
                            <Label className="text-sm font-semibold flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                텍스트 모델
                            </Label>
                            <select
                                className="w-full h-10 px-3 rounded-lg border bg-white dark:bg-gray-900 text-sm"
                                value={selectedTextModel.id}
                                onChange={(e) => {
                                    const model = TEXT_MODELS.find(m => m.id === e.target.value)
                                    if (model) setSelectedTextModel(model)
                                }}
                            >
                                {TEXT_MODELS.map(model => (
                                    <option key={model.id} value={model.id}>
                                        {model.description} - 입력 ${model.inputCost}/M
                                    </option>
                                ))}
                            </select>
                            <p className="text-xs text-gray-500">
                                현재 선택: {selectedTextModel.name} ({selectedTextModel.contextWindow.toLocaleString()} 토큰)
                            </p>
                        </div>

                        {/* Image Model Selection */}
                        <div className="space-y-3">
                            <Label className="text-sm font-semibold flex items-center gap-2">
                                <ImageIcon className="h-4 w-4" />
                                이미지 모델
                            </Label>
                            <select
                                className="w-full h-10 px-3 rounded-lg border bg-white dark:bg-gray-900 text-sm"
                                value={selectedImageModel.id}
                                onChange={(e) => {
                                    const model = IMAGE_MODELS.find(m => m.id === e.target.value)
                                    if (model) setSelectedImageModel(model)
                                }}
                            >
                                {IMAGE_MODELS.map(model => (
                                    <option key={model.id} value={model.id}>
                                        {model.description} - ${model.costPerImage}/이미지
                                    </option>
                                ))}
                            </select>
                            <p className="text-xs text-gray-500">
                                현재 선택: {selectedImageModel.name}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Status Message Area */}
            {isGenerating && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex items-center gap-3 animate-pulse">
                    <div className="h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <div>
                        <p className="font-semibold text-blue-800 dark:text-blue-100">AI가 열심히 글을 작성하고 있습니다...</p>
                        <p className="text-xs text-blue-600 dark:text-blue-300">약 15~30초 정도 소요됩니다. 잠시만 기다려주세요.</p>
                    </div>
                </div>
            )}

            {/* Main Area: Review Dashboard */}
            <div className="bg-white dark:bg-card rounded-2xl border shadow-sm overflow-hidden min-h-[400px] flex flex-col">
                <div className="p-4 border-b bg-gray-50/50 dark:bg-muted/30 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <CheckSquare className="h-5 w-5 text-gray-500" />
                        <h2 className="font-semibold text-lg">생성된 글 목록 ({articles.length})</h2>
                    </div>

                    {/* Bulk Actions (Delete) */}
                    {selectedIds.length > 0 && (
                        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2">
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={handleDeleteSelected}
                                disabled={isDeleting}
                            >
                                <Trash2 className="h-4 w-4 mr-1" /> 선택 삭제 ({selectedIds.length})
                            </Button>
                        </div>
                    )}
                </div>

                <div className="flex-1 overflow-x-auto">
                    {articles.length === 0 && !isGenerating ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center opacity-50">
                            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-full mb-4">
                                <FileText className="h-8 w-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-medium">검토할 대기 중인 글이 없습니다</h3>
                            <p className="text-sm">상단의 'AI 글 자동생성' 버튼을 눌러보세요.</p>
                        </div>
                    ) : (
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-muted/50 dark:text-gray-300">
                                <tr>
                                    <th className="p-4 w-10">
                                        <Checkbox
                                            checked={articles.length > 0 && selectedIds.length === articles.length}
                                            onCheckedChange={toggleAll}
                                        />
                                    </th>
                                    <th className="p-4">글 제목 / 키워드</th>
                                    <th className="p-4 w-32">SEO Score</th>
                                    <th className="p-4 w-40">생성일시</th>
                                    <th className="p-4 w-32">Actions</th>
                                    <th className="p-4 w-24">상태</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y dark:divide-gray-800">
                                {isGenerating && articles.length === 0 && (
                                    [1, 2, 3].map(i => (
                                        <tr key={`skeleton-${i}`} className="animate-pulse">
                                            <td className="p-4"><div className="h-4 w-4 bg-gray-200 rounded" /></td>
                                            <td className="p-4"><div className="h-4 w-3/4 bg-gray-200 rounded mb-2" /><div className="h-3 w-1/2 bg-gray-200 rounded" /></td>
                                            <td className="p-4"><div className="h-6 w-12 bg-gray-200 rounded" /></td>
                                            <td className="p-4"><div className="h-4 w-24 bg-gray-200 rounded" /></td>
                                            <td className="p-4"><div className="h-8 w-16 bg-gray-200 rounded" /></td>
                                            <td className="p-4"><div className="h-5 w-10 bg-gray-200 rounded" /></td>
                                        </tr>
                                    ))
                                )}

                                {articles.map((article) => (
                                    <tr key={article.id} className={cn("hover:bg-gray-50 dark:hover:bg-muted/50 transition-colors", selectedIds.includes(article.id) && "bg-blue-50/50 dark:bg-blue-900/10")}>
                                        <td className="p-4">
                                            <Checkbox
                                                checked={selectedIds.includes(article.id)}
                                                onCheckedChange={() => toggleSelection(article.id)}
                                            />
                                        </td>
                                        <td className="p-4">
                                            <a
                                                href={`/articles/${article.id}/preview`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="font-medium text-gray-900 dark:text-gray-100 hover:text-blue-600 hover:underline cursor-pointer transition-colors"
                                            >
                                                {article.title}
                                            </a>
                                            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                                                <span className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">🔑 {article.keyword || 'N/A'}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <span className={cn(
                                                    "font-bold text-base",
                                                    (article.seoScore || 0) >= 80 ? "text-green-600" :
                                                        (article.seoScore || 0) >= 60 ? "text-yellow-600" : "text-red-600"
                                                )}>
                                                    {article.seoScore || 85}
                                                </span>
                                                <span className="text-xs text-gray-400">/ 100</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-gray-500">
                                            {new Date(article.createdAt).toLocaleDateString()}
                                            <br />
                                            {new Date(article.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    variant="outline" size="icon" className="h-8 w-8 text-blue-600 border-blue-200 hover:bg-blue-50"
                                                    title="글 내용 다시 쓰기"
                                                    onClick={() => handleRegenerateContent(article.id)}
                                                    disabled={!!regeneratingId && regeneratingId === article.id}
                                                >
                                                    {regeneratingId === article.id ? <RefreshCw className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />}
                                                </Button>
                                                <Button
                                                    variant="outline" size="icon" className="h-8 w-8 text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                                                    title="이미지 다시 만들기"
                                                    onClick={() => handleRegenerateImage(article.id)}
                                                    disabled={!!regeneratingImageId && regeneratingImageId === article.id}
                                                >
                                                    {regeneratingImageId === article.id ? <RefreshCw className="h-3 w-3 animate-spin" /> : <ImageIcon className="h-3 w-3" />}
                                                </Button>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Draft</Badge>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Footer: Publish Actions */}
                <div className="p-4 border-t bg-white dark:bg-card sticky bottom-0 z-10 flex flex-col md:flex-row items-center justify-between gap-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <AlertCircle className="w-4 h-4" />
                        <span>{selectedIds.length}개 항목 선택됨</span>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="relative flex-1 md:w-56">
                            <Input
                                type="datetime-local"
                                className="h-11 pl-10"
                                value={scheduleDate}
                                onChange={(e) => setScheduleDate(e.target.value)}
                            />
                            <Calendar className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                        </div>

                        <Button
                            size="lg"
                            className={cn(
                                "h-11 shadow-lg transition-all min-w-[180px] font-semibold",
                                scheduleDate ? "bg-purple-600 hover:bg-purple-700" : "bg-green-600 hover:bg-green-700"
                            )}
                            disabled={selectedIds.length === 0 || isPublishing}
                            onClick={handlePublishSelected}
                        >
                            {isPublishing ? (
                                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                            ) : scheduleDate ? (
                                <><Clock className="mr-2 h-4 w-4" /> 선택 항목 예약 발행</>
                            ) : (
                                <><Rocket className="mr-2 h-4 w-4" /> 선택 항목 즉시 발행</>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
