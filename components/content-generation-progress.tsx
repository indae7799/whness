"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { Loader2, CheckCircle, Copy, Image as ImageIcon, Send, ExternalLink, RefreshCw } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Button } from "@/components/ui/button"
import { KeywordData } from "@/components/keyword-recommendations"

interface ContentGenerationProgressProps {
    keyword: KeywordData
    onComplete?: (content: string) => void
}

export default function ContentGenerationProgress({ keyword, onComplete }: ContentGenerationProgressProps) {
    const [content, setContent] = useState("")
    const [isGenerating, setIsGenerating] = useState(true)
    const [hasStarted, setHasStarted] = useState(false)
    const [showDebug, setShowDebug] = useState(false)
    const [renderedHtml, setRenderedHtml] = useState("")
    const articleRef = useRef<HTMLElement | null>(null)

    // Image state
    const [featuredImage, setFeaturedImage] = useState<string | null>(null)
    const [isGeneratingImage, setIsGeneratingImage] = useState(false)

    // Publish state
    const [isPublishing, setIsPublishing] = useState(false)
    const [publishResult, setPublishResult] = useState<{ postUrl?: string, error?: string } | null>(null)

    const bottomRef = useRef<HTMLDivElement>(null)
    const abortControllerRef = useRef<AbortController | null>(null)

    useEffect(() => {
        // Strict Mode Guard: Ensure we only run generation once per mount cycle
        if (hasStarted) return
        setHasStarted(true)

        // Ref to track if we are currently mounted
        const isMountedRef = { current: true }
        const abortController = new AbortController()
        abortControllerRef.current = abortController

        const startGeneration = async () => {
            try {
                // Clear content on start ensuring no duplicates
                setContent("")

                // START IMAGE GENERATION IN PARALLEL
                // We don't await this, so it runs concurrently
                handleGenerateImage()

                const response = await fetch("/api/generate", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        keyword,
                        topic: keyword.phrase,
                        options: {}
                    }),
                    signal: abortController.signal
                })

                if (!response.body) throw new Error("No response body")

                const reader = response.body.getReader()
                const decoder = new TextDecoder()

                while (true) {
                    const { done, value } = await reader.read()
                    if (done || !isMountedRef.current) break

                    const chunk = decoder.decode(value, { stream: true })
                    if (isMountedRef.current) {
                        setContent(prev => prev + chunk)
                    }

                    if (bottomRef.current) {
                        bottomRef.current.scrollIntoView({ behavior: "smooth" })
                    }
                }

                if (isMountedRef.current) {
                    setIsGenerating(false)
                }

            } catch (error: any) {
                if (error.name === 'AbortError') return
                console.error("Generation failed:", error)
                if (isMountedRef.current) {
                    setIsGenerating(false)
                    setContent(prev => prev + "\n\n**[Error: Generation stopped]**")
                }
            }
        }

        startGeneration()

        return () => {
            isMountedRef.current = false
            abortController.abort()
        }
    }, []) // Empty dependency array

    useEffect(() => {
        if (!showDebug) return
        if (!articleRef.current) return
        setRenderedHtml(articleRef.current.innerHTML)
    }, [showDebug, content])

    const displayContent = useMemo(() => {
        let updated = content
        updated = updated.replace(/<!--[\s\S]*?-->\s*/m, "")
        updated = updated.replace(/^\[Image:.*\]\s*$/gim, "")
        updated = updated.replace(/^\*?Alt Text:.*$/gim, "")
        updated = updated.replace(/^\[Internal link:.*\]\s*$/gim, "")
        updated = updated.replace(/^\[내부 링크:.*\]\s*$/gim, "")
        return updated.trim()
    }, [content])

    const handleGenerateImage = async () => {
        if (isGeneratingImage || featuredImage) return // Prevent duplicate calls
        setIsGeneratingImage(true)
        try {
            const response = await fetch("/api/image", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ keyword: keyword.phrase })
            })
            const data = await response.json()
            if (data.imageUrl) {
                setFeaturedImage(data.imageUrl)
            } else {
                // Silently fail or show toast in real app, but for now just log
                console.error("Image generation error:", data.error)
            }
        } catch (error) {
            console.error("Image generation failed:", error)
        } finally {
            setIsGeneratingImage(false)
        }
    }

    const handlePublish = async () => {
        setIsPublishing(true)
        try {
            // Extract title from content (first H1)
            const titleMatch = content.match(/^#\s+(.+)$/m)
            const title = titleMatch ? titleMatch[1] : keyword.phrase

            const response = await fetch("/api/publish", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title,
                    content,
                    excerpt: `${keyword.phrase}에 대한 완벽 가이드`,
                    featuredImageUrl: featuredImage,
                    status: "draft" // Start as draft for safety
                })
            })
            const data = await response.json()

            if (data.success) {
                setPublishResult({ postUrl: data.postUrl })
            } else {
                setPublishResult({ error: data.error })
            }
        } catch (error) {
            console.error("Publish failed:", error)
            setPublishResult({ error: "발행 중 오류가 발생했습니다." })
        } finally {
            setIsPublishing(false)
        }
    }

    return (
        <div className="space-y-6">
            {/* Status Card */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-black">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        {isGenerating ? (
                            <div className="flex items-center justify-center h-10 w-10 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                                <Loader2 className="animate-spin" size={20} />
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-10 w-10 rounded-full bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                                <CheckCircle size={20} />
                            </div>
                        )}
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                                {isGenerating ? "콘텐츠 생성 중..." : "생성 완료"}
                            </h3>
                            <p className="text-sm text-gray-500">
                                주제: {keyword.phrase}
                            </p>
                        </div>
                    </div>

                    {!isGenerating && (
                        <Button variant="outline" onClick={() => navigator.clipboard.writeText(content)}>
                            <Copy size={16} className="mr-2" /> 복사
                        </Button>
                    )}
                </div>

                {isGenerating && (
                    <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden dark:bg-zinc-800">
                        <div className="h-full bg-blue-600 transition-all duration-300 animate-pulse" style={{ width: "100%" }} />
                    </div>
                )}
            </div>

            {/* Featured Image Section - ALWAYS VISIBLE NOW */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-black">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">대표 이미지</h3>

                {featuredImage ? (
                    <div className="space-y-4">
                        <img src={featuredImage} alt="Featured" className="w-full rounded-lg object-cover max-h-[400px]" />
                        <Button variant="outline" onClick={handleGenerateImage} disabled={isGeneratingImage}>
                            <RefreshCw size={16} className="mr-2" /> 다시 생성
                        </Button>
                    </div>
                ) : (
                    <div className="w-full h-32 border-dashed border-2 rounded-lg flex items-center justify-center bg-gray-50 dark:bg-zinc-900/50">
                        {isGeneratingImage ? (
                            <div className="flex flex-col items-center text-gray-500">
                                <Loader2 className="animate-spin mb-2" size={24} />
                                <span>AI가 이미지를 생성하고 있습니다...</span>
                            </div>
                        ) : (
                            <Button onClick={handleGenerateImage} variant="ghost" className="h-full w-full">
                                <ImageIcon size={24} className="mr-2" /> 이미지 생성 실패 (클릭하여 재시도)
                            </Button>
                        )}
                    </div>
                )}
            </div>

            {/* Publish Section */}
            {!isGenerating && (
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-black">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">WordPress 발행</h3>

                    {publishResult?.postUrl ? (
                        <div className="flex items-center gap-4 p-4 bg-green-50 rounded-lg dark:bg-green-900/20">
                            <CheckCircle className="text-green-600" size={24} />
                            <div className="flex-1">
                                <p className="font-medium text-green-800 dark:text-green-300">발행 완료! (임시저장)</p>
                                <a href={publishResult.postUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                                    게시물 보기 <ExternalLink size={14} />
                                </a>
                            </div>
                        </div>
                    ) : publishResult?.error ? (
                        <div className="p-4 bg-red-50 rounded-lg dark:bg-red-900/20 text-red-700 dark:text-red-300">
                            {publishResult.error}
                        </div>
                    ) : (
                        <Button onClick={handlePublish} disabled={isPublishing} className="w-full">
                            {isPublishing ? (
                                <><Loader2 className="animate-spin mr-2" size={20} /> 발행 중...</>
                            ) : (
                                <><Send size={18} className="mr-2" /> WordPress에 발행 (임시저장)</>
                            )}
                        </Button>
                    )}
                </div>
            )}

            {/* Content Preview */}
            <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-black min-h-[500px]">
                <div className="mb-6 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">미리보기</h3>
                    <Button variant="outline" size="sm" onClick={() => setShowDebug(!showDebug)}>
                        {showDebug ? "디버그 숨기기" : "디버그 보기"}
                    </Button>
                </div>
                <article className="prose prose-blue max-w-none dark:prose-invert" ref={articleRef}>
                    <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                            p: ({ node, children, ...props }) => {
                                const astChildren = (node as any)?.children || []
                                const hasImageChild = astChildren.some(
                                    (child: any) => child?.tagName === "img" || child?.type === "image"
                                )
                                const hasBlockChild = Array.isArray(children) && children.some((child: any) =>
                                    child?.type === "div" || child?.type === "img"
                                )
                                if (hasImageChild || hasBlockChild) {
                                    return <div className="my-6">{children}</div>
                                }
                                return <p {...props}>{children}</p>
                            },
                            img: ({ node, ...props }) => (
                                <div className="my-10">
                                    <img className="w-full rounded-2xl shadow-lg border border-gray-100 object-cover max-h-[500px]" {...props} />
                                    {props.alt && <p className="text-center text-sm text-gray-500 mt-3 italic">{props.alt}</p>}
                                </div>
                            ),
                            h1: ({ node, ...props }) => <h1 className="text-[40px] font-bold mt-12 mb-8 border-b pb-6 text-[#001f3f] dark:text-[#7fdbff]" {...props} />,
                            h2: ({ node, ...props }) => <h2 className="text-[30px] font-bold mt-12 mb-6 text-[#001f3f] dark:text-[#7fdbff]" {...props} />,
                            h3: ({ node, ...props }) => <h3 className="text-[23px] font-semibold mt-8 mb-4 text-[#001f3f] dark:text-[#7fdbff]" {...props} />,
                            table: ({ node, ...props }) => <div className="overflow-x-auto my-12 border rounded-xl shadow-sm"><table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700" {...props} /></div>,
                            thead: ({ node, ...props }) => <thead className="bg-[#f8f9fa] dark:bg-zinc-800" {...props} />,
                            th: ({ node, ...props }) => <th className="px-4 py-4 text-left text-sm font-bold text-[#001f3f] dark:text-gray-100 uppercase tracking-wider" {...props} />,
                            td: ({ node, ...props }) => <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300 border-t border-gray-100 dark:border-gray-700" {...props} />,
                            a: ({ node, ...props }) => <a className="text-blue-600 hover:underline dark:text-blue-400" target="_blank" rel="noopener noreferrer" {...props} />,
                            ul: ({ node, ...props }) => <ul className="list-disc list-outside ml-6 space-y-2 my-4" {...props} />,
                            ol: ({ node, ...props }) => <ol className="list-decimal list-outside ml-6 space-y-2 my-4" {...props} />,
                            li: ({ node, ...props }) => <li className="text-gray-700 dark:text-gray-300 pl-1" {...props} />,
                            blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-blue-500 pl-4 py-2 my-4 italic bg-gray-50 dark:bg-zinc-800/50 rounded-r" {...props} />,
                        }}
                    >
                        {(() => {
                            let processedContent = displayContent;
                            // If we have a featured image, replace any placeholder OR inject after H1
                            if (featuredImage) {
                                if (processedContent.includes('![Featured Photography:')) {
                                    processedContent = processedContent.replace(/!\[Featured Photography:.*?\]/g, `![Featured Image](${featuredImage})`);
                                } else if (processedContent.includes('# ')) {
                                    // Fallback: inject after H1 if no specific placeholder found
                                    const h1Match = processedContent.match(/^#\s+.+$/m);
                                    if (h1Match) {
                                        const h1Index = processedContent.indexOf(h1Match[0]) + h1Match[0].length;
                                        processedContent = processedContent.slice(0, h1Index) + `\n\n![Featured Image](${featuredImage})` + processedContent.slice(h1Index);
                                    }
                                }
                            }
                            return processedContent;
                    })()}
                    </ReactMarkdown>
                </article>
                <div ref={bottomRef} />
            </div>

            {showDebug && (
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-black">
                    <h3 className="mb-4 text-sm font-semibold text-gray-700 dark:text-gray-300">원문 마크다운 (HTML 파싱 전)</h3>
                    <pre className="max-h-[400px] overflow-auto rounded-lg bg-gray-50 p-4 text-xs text-gray-800 dark:bg-zinc-900 dark:text-gray-200 whitespace-pre-wrap">
                        {content || "아직 생성된 내용이 없습니다."}
                    </pre>
                    <h3 className="mb-4 mt-6 text-sm font-semibold text-gray-700 dark:text-gray-300">렌더링된 HTML</h3>
                    <pre className="max-h-[400px] overflow-auto rounded-lg bg-gray-50 p-4 text-xs text-gray-800 dark:bg-zinc-900 dark:text-gray-200 whitespace-pre-wrap">
                        {renderedHtml || "HTML 캡처 준비 중..."}
                    </pre>
                </div>
            )}
        </div>
    )
}
