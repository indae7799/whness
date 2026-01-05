"use client"

import { useState, useRef, useEffect } from 'react'
import { Search, ArrowRight, Loader2, Copy, CheckCircle2, RefreshCw, Zap, Sparkles, Edit3, Save, PlusCircle, Trash2, GitBranch, Bookmark, ChevronLeft, ChevronRight, X, Image as ImageIcon, Workflow, Calendar, Clock } from 'lucide-react'
import { format } from "date-fns"
import { FIXED_PROMPT_CONTENT } from "@/lib/prompts/fixedPrompt"
import { Card } from "@/components/ui/card"
import { ThumbnailGenerator } from "@/components/thumbnail-generator"
import { WordPressPublisher } from "@/components/wordpress-publisher"

interface LongTailSuggestion {
    keyword: string
    volume: string
    difficulty: string
    cpc: string
    intent: string
    score: number
}

interface GeneratedKeyword {
    term: string
    category: string // 'focus' | 'long-tail'
    volume: string
    difficulty: string
    intent: string // 'informational' | 'commercial' | 'transactional'
    cpc: string
    competition: string
    score: number
    suggestions: LongTailSuggestion[]
    peopleAlsoAsk?: string[] // NEW: PAA questions extracted from Google
}

export default function KeywordGeneratorPage() {
    const [loading, setLoading] = useState(false)
    const [keywords, setKeywords] = useState<GeneratedKeyword[]>([])

    // Selection States
    const [selectedKeywordObj, setSelectedKeywordObj] = useState<GeneratedKeyword | null>(null) // UI showing analysis for this
    const [targetFocusKeyword, setTargetFocusKeyword] = useState<string>("")
    const [targetLongTailKeyword, setTargetLongTailKeyword] = useState<string>("")

    const [copied, setCopied] = useState(false)

    // Saved Keywords State (string array)
    const [savedKeywords, setSavedKeywords] = useState<string[]>([])

    // Shared Image State
    const [rawImageFile, setRawImageFile] = useState<File | null>(null)
    const thumbnailRef = useRef<any>(null)

    // Draft Restore State
    const [initialHtmlContent, setInitialHtmlContent] = useState<string>("")
    const [editorHtml, setEditorHtml] = useState<string>("") // Real-time content from editor
    const [initialImageSrc, setInitialImageSrc] = useState<string | null>(null)
    const [initialBodyImageSrc, setInitialBodyImageSrc] = useState<string | null>(null)

    // Pagination & View State
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 9; // Grid display

    // Drafts refresh callback
    const [refreshDrafts, setRefreshDrafts] = useState<(() => void) | null>(null);

    // Pagination Logic
    const totalPages = Math.ceil(savedKeywords.length / ITEMS_PER_PAGE);
    const displayedSavedKeywords = savedKeywords.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const handleGenerate = async () => {
        setLoading(true)
        try {
            const res = await fetch("/api/keywords/generate", { method: "POST" })
            if (!res.ok) throw new Error("Failed to generate")

            const data = await res.json()
            setKeywords(data.keywords)

            // Initial Select
            if (data.keywords && data.keywords.length > 0) {
                const first = data.keywords[0];
                setSelectedKeywordObj(first)
                // Auto-set focus for convenience
                setTargetFocusKeyword(first.term)
            }
        } catch (error) {
            console.error("Error generating keywords:", error)
            alert("키워드 생성에 실패했습니다. 서버 상태를 확인해주세요.")
        } finally {
            setLoading(false)
        }
    }

    // Handles clicking a main Keyword Button
    const handleFocusClick = (k: GeneratedKeyword) => {
        setSelectedKeywordObj(k)
        setTargetFocusKeyword(k.term)
        setTargetLongTailKeyword("") // Reset long-tail when switching focus
    }

    // Handles clicking a Long-tail row
    const handleLongTailClick = (s: LongTailSuggestion) => {
        setTargetLongTailKeyword(s.keyword)
    }

    const handleReset = () => {
        setTargetFocusKeyword("")
        setTargetLongTailKeyword("")
        setCopied(false)
    }

    const constructContentPrompt = () => {
        if (!targetFocusKeyword && !targetLongTailKeyword) return "키워드를 선택하면 글 작성 프롬프트가 생성됩니다.";

        return `${FIXED_PROMPT_CONTENT}

---

**[Gemini 3.0 지시 사항]**

1. **메인 주제(Title Topic)**: "${targetLongTailKeyword}" (이 키워드가 글의 핵심 주제입니다.)
2. **SEO 서브 키워드**: "${targetFocusKeyword}" (이 키워드를 본문에 자연스럽게 녹여 SEO 점수를 높이세요.)

**[작성 지시 - 필독]**
- **언어**: 반드시 **미국식 영어(English US)**로 작성하세요. (Target Audience: US Seniors)
- **제목(H1)**: 메인 주제("${targetLongTailKeyword}")를 포함하여 클릭을 유도하는 매력적인 제목을 지으세요.
- **구조**: 메인 주제를 깊이 있게 다루되, SEO 서브 키워드("${targetFocusKeyword}")를 H2/H3 및 본문에 자연스럽게 5회 이상 사용하세요.
- **분량**: 2,500단어 이상, 깊이 있는 전문가 수준의 가이드.

**[출력 형식 및 스타일 디자인 - 엄격 준수]**
최종 결과물은 블로그에 즉시 붙여넣을 수 있도록 다음 스타일이 적용된 **HTML 코드 블록**으로 출력해주세요. 
(Canvas 사용 가능 시 Canvas 우선)

1. **타이포그래피 (Inline Style 적용 필수 - Georgia 서체 통일)**:
   - **전체 문서에 Georgia 서체만 사용하세요. 다른 폰트(Helvetica 등)를 절대 섞지 마세요.**
   - **H1**: \`<h1 style="font-family: Georgia, 'Times New Roman', serif; font-size: 42px; font-weight: 700; color: #111827; margin-bottom: 32px; margin-top: 60px; letter-spacing: -0.02em; line-height: 1.2;">제목</h1>\`
   - **H2**: \`<h2 style="font-family: Georgia, 'Times New Roman', serif; font-size: 28px; font-weight: 700; color: #111827; margin-top: 48px; margin-bottom: 20px; letter-spacing: -0.01em; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px;">소제목</h2>\`
   - **H3**: \`<h3 style="font-family: Georgia, 'Times New Roman', serif; font-size: 22px; font-weight: 600; color: #1f2937; margin-top: 32px; margin-bottom: 16px;">세부 제목</h3>\`
   - **본문**: \`<p style="font-family: Georgia, 'Times New Roman', serif; font-size: 18px; line-height: 1.75; margin-bottom: 28px; color: #2d3748;">\` (폰트 패밀리 반복 필수)

2. **구조 및 스타일 강제 규정 (매우 중요)**:
   - **서체 통일 필수**: 모든 태그(H1, H2, H3, p, ul, li)에 \`font-family: Georgia, 'Times New Roman', serif;\`를 **동일하게 적용**하세요.
   - 문단 사이에는 충분한 여백(margin-bottom: 28px)을 주어 읽기 편하게 하세요.
   - <strong> 태그 등을 활용하여 핵심 내용을 강조하세요.


**[최종 지시사항: 잡담 금지]**
- "네, 알겠습니다" 또는 "블로그 글을 작성해드리겠습니다" 같은 **불필요한 서론/인사말을 일체 생략하세요.**
-   "네, 알겠습니다" 또는 "블로그 글을 작성해드리겠습니다" 같은 **불필요한 서론/인사말을 일체 생략하세요.**
-   오직 **HTML 코드 블록**으로 된 본문 내용만 즉시 출력하세요.`
    }

    const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);

    const handleCopyImagePrompt = async () => {
        setIsGeneratingPrompt(true);
        try {
            let promptText = "";

            // 1. Try to extract from the editor content first (The [IMAGE_PROMPT_START] region)
            if (editorHtml) {
                const match = editorHtml.match(/\[IMAGE_PROMPT_START\]([\s\S]*?)\[IMAGE_PROMPT_END\]/);
                if (match && match[1]) {
                    promptText = match[1].trim();
                }
            }

            // 2. Fallback: If not found in editor, use a generic template (Free & Zero-Token)
            if (!promptText) {
                const keyword = targetLongTailKeyword || targetFocusKeyword || "New York Lifestyle";
                promptText = `Editorial photography of ${keyword}, New York City atmosphere, cinematic lighting, shallow depth of field, shot on Sony A7R IV, 8k resolution, highly detailed, realistic texture, 16:9 aspect ratio --ar 16:9 --v 6.0`;
            }

            // 3. Copy to clipboard
            await navigator.clipboard.writeText(promptText);
            alert("이미지 프롬프트가 복사되었습니다! (본문 기반 분석 완료)");

        } catch (error) {
            console.error("Failed to copy prompt", error);
            alert("복사 실패.");
        } finally {
            setIsGeneratingPrompt(false);
        }
    }

    const handleCopy = () => {
        const text = constructContentPrompt(); // Changed to constructContentPrompt
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }



    const handleCopyList = () => {
        if (savedKeywords.length === 0) return;
        const text = savedKeywords.join('\n');
        navigator.clipboard.writeText(text);
        alert("저장된 키워드 목록이 복사되었습니다.");
    };

    const handleSaveKeyword = (keyword: string) => {
        if (!savedKeywords.includes(keyword)) {
            setSavedKeywords([...savedKeywords, keyword])
        }
    }

    const handleDeleteKeyword = (keyword: string) => {
        setSavedKeywords(savedKeywords.filter(k => k !== keyword))
    }

    const handleUseSavedKeyword = (keyword: string) => {
        setTargetLongTailKeyword(keyword)
        if (!targetFocusKeyword) setTargetFocusKeyword(keyword)
    }

    return (
        <div className="space-y-8 pb-20">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-200 dark:border-zinc-800 pb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                        <Search className="w-8 h-8 text-blue-500" />
                        키워드 생성기
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 max-w-2xl text-sm leading-relaxed">
                        시드 로직과 웹 소스를 활용하여 강력한 SEO 키워드를 발굴하고, LLM용 프롬프트를 생성합니다.
                    </p>
                </div>
                <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
                    {/* Manual Input Section */}
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-400 font-bold text-xs">A</span>
                        </div>
                        <input
                            type="text"
                            placeholder="롱테일 키워드 직접 입력..."
                            value={targetLongTailKeyword}
                            onChange={(e) => {
                                setTargetLongTailKeyword(e.target.value)
                                if (!targetFocusKeyword) setTargetFocusKeyword(e.target.value)
                            }}
                            className="pl-8 pr-12 py-3 w-64 md:w-80 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all shadow-sm"
                        />
                        <div className="absolute -top-2 left-2 px-1 bg-white dark:bg-black text-[10px] font-semibold text-gray-500">
                            Manual Input
                        </div>
                        {targetLongTailKeyword && (
                            <button
                                onClick={() => handleSaveKeyword(targetLongTailKeyword)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md transition-colors"
                                title="이 키워드 저장"
                            >
                                <PlusCircle className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    <button
                        onClick={handleGenerate}
                        disabled={loading}
                        className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all font-medium shadow-lg shadow-blue-600/20 whitespace-nowrap"
                    >
                        {loading ? <RefreshCw className="animate-spin" /> : <Sparkles />}
                        {keywords.length > 0 ? "키워드 다시 생성" : "키워드 생성 (AI)"}
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="space-y-6">

                {/* Section 1: Focus Keywords (Top Full Width) */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-indigo-500" />
                            포커스 키워드 ({keywords.length})
                        </h2>
                    </div>

                    {/* Vertical List Layout - Optimized for Top 3 */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {keywords.length === 0 ? (
                            <div className="col-span-full w-full flex flex-col items-center justify-center p-12 bg-gray-50 dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 border-dashed">
                                <Search className="w-12 h-12 text-gray-300 mb-2" />
                                <p className="text-gray-500 text-sm">상단 '키워드 생성' 버튼을 눌러주세요.</p>
                            </div>
                        ) : (
                            keywords.map((k, i) => (
                                <div
                                    key={i}
                                    className={`relative p-5 rounded-xl transition-all cursor-pointer ${selectedKeywordObj?.term === k.term
                                        ? 'bg-indigo-50/80 border-indigo-600 dark:bg-indigo-900/20 dark:border-indigo-400 border-2 shadow-sm'
                                        : 'bg-white border-gray-200 hover:border-indigo-300 dark:bg-zinc-900 dark:border-zinc-800 border'
                                        }`}
                                    onClick={() => handleFocusClick(k)}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={`text-lg leading-tight font-medium ${selectedKeywordObj?.term === k.term ? 'text-indigo-900 dark:text-indigo-100' : 'text-gray-700 dark:text-gray-300'
                                            }`}>
                                            {k.term}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                                        <span className="bg-gray-100 dark:bg-zinc-800 px-2 py-0.5 rounded">{k.category}</span>
                                        <span>제안 {k.suggestions.length}개</span>
                                    </div>

                                    {/* Action Buttons Absolute Top-Right */}
                                    <div className="absolute top-2 right-2 flex gap-1">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigator.clipboard.writeText(k.term);
                                            }}
                                            className="p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-lg text-gray-400 hover:text-blue-600 transition-colors"
                                            title="복사"
                                        >
                                            <Copy className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleSaveKeyword(k.term);
                                            }}
                                            className="p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-lg text-gray-300 hover:text-green-600 transition-colors"
                                            title="저장"
                                        >
                                            <PlusCircle className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* PROMPT ACTION CARDS - Moved to Middle */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Image Prompt Card */}
                    <div className="bg-gradient-to-br from-purple-50 to-white dark:from-zinc-900 dark:to-zinc-950 rounded-xl p-6 border border-purple-100 dark:border-zinc-800 shadow-sm flex flex-col items-center justify-center text-center">
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                            <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">AI 이미지 프롬프트</h3>
                        </div>
                        <p className="text-xs text-gray-500 mb-4 max-w-xs">
                            키워드 맞춤형 Midjourney 프롬프트 생성
                        </p>
                        <div className="flex gap-2 w-full">
                            <button
                                onClick={handleCopyImagePrompt}
                                disabled={isGeneratingPrompt}
                                className="flex-1 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 hover:border-purple-300 transition-all shadow-sm flex items-center justify-center gap-2 group"
                            >
                                {isGeneratingPrompt ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-600" />
                                ) : (
                                    <Copy className="w-3.5 h-3.5 text-gray-400 group-hover:text-purple-500 transition-colors" />
                                )}
                                {isGeneratingPrompt ? "분석 중..." : "프롬프트 복사"}
                            </button>
                            <button
                                onClick={() => window.open('https://labs.google/fx/ko/tools/flow/project/743f991d-0bc5-449d-9d3c-fea44b52856f', '_blank')}
                                className="flex-1 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                            >
                                <Workflow className="w-3.5 h-3.5 text-blue-500" />
                                Flow
                            </button>
                        </div>
                    </div>

                    {/* Blog Content Prompt Card */}
                    <div className="bg-gradient-to-br from-blue-50 to-white dark:from-zinc-900 dark:to-zinc-950 rounded-xl p-6 border border-blue-100 dark:border-zinc-800 shadow-sm flex flex-col items-center justify-center text-center">
                        <div className="flex items-center gap-2 mb-2">
                            <Edit3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">블로그 글 작성 프롬프트</h3>
                        </div>
                        <p className="text-xs text-gray-500 mb-4 max-w-xs">
                            SEO 최적화된 Gemini 3.0 블로그 글 생성
                        </p>
                        <div className="flex gap-2 w-full">
                            <button
                                onClick={handleCopy}
                                className="flex-1 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                            >
                                {copied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                {copied ? "완료" : "복사"}
                            </button>
                            <button
                                onClick={() => window.open('https://gemini.google.com/app', '_blank')}
                                className="flex-1 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                            >
                                <Zap className="w-3.5 h-3.5 text-orange-500" />
                                Gemini
                            </button>
                            <button
                                onClick={() => window.open('https://labs.google/fx/ko/tools/flow/project/743f991d-0bc5-449d-9d3c-fea44b52856f', '_blank')}
                                className="flex-1 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                            >
                                <Workflow className="w-3.5 h-3.5 text-blue-500" />
                                Flow
                            </button>
                        </div>
                    </div>
                </div>

                {/* SPLIT SECTION: Long-tail Suggestions (Left) + Thumbnail Generator (Right) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[650px]">

                    {/* LEFT COLUMN: Long-tail Suggestions */}
                    <div className="h-full flex flex-col">
                        <div className="flex items-center justify-between mb-2 shrink-0">
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                <GitBranch className="w-5 h-5 text-purple-500" />
                                롱테일 제안
                            </h2>
                            {selectedKeywordObj && (
                                <span className="text-xs bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full font-medium">
                                    Selected: {selectedKeywordObj.term}
                                </span>
                            )}
                        </div>

                        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 overflow-hidden shadow-sm flex-1 overflow-y-auto custom-scrollbar">
                            {!selectedKeywordObj ? (
                                <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3 p-8 text-center">
                                    <ArrowRight className="w-12 h-12 opacity-20" />
                                    <p className="text-sm">위에서 포커스 키워드를<br />선택해주세요.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-100 dark:divide-zinc-800">
                                    {selectedKeywordObj.suggestions.map((lt, i) => {
                                        const intentColor = lt.intent.includes("수익")
                                            ? "text-orange-700 bg-orange-50 dark:text-orange-300 dark:bg-orange-900/40 border-orange-200"
                                            : "text-blue-700 bg-blue-50 dark:text-blue-300 dark:bg-blue-900/40 border-blue-200";

                                        return (
                                            <div
                                                key={i}
                                                className={`p-4 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer group border-l-4 ${targetLongTailKeyword === lt.keyword
                                                    ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-500'
                                                    : 'border-transparent'
                                                    }`}
                                                onClick={() => handleLongTailClick(lt)}
                                            >
                                                <div className="flex justify-between items-start">
                                                    <p className="font-medium text-base text-gray-800 dark:text-gray-200 leading-snug mb-2">{lt.keyword}</p>
                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                navigator.clipboard.writeText(lt.keyword);
                                                            }}
                                                            className="p-1 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded text-gray-400 hover:text-blue-600"
                                                            title="복사"
                                                        >
                                                            <Copy className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleSaveKeyword(lt.keyword);
                                                            }}
                                                            className="p-1 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded text-gray-500 hover:text-green-600"
                                                            title="저장"
                                                        >
                                                            <PlusCircle className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="flex flex-wrap gap-2 text-xs mt-1">
                                                    <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800">
                                                        점수 {lt.score}
                                                    </span>
                                                    <span className={`px-2 py-0.5 rounded border ${intentColor} font-medium`}>
                                                        {lt.intent}
                                                    </span>
                                                    <span className="text-gray-500 border border-gray-100 px-2 py-0.5 rounded bg-white dark:bg-zinc-800 dark:border-zinc-700">
                                                        {lt.difficulty}
                                                    </span>
                                                    {(lt as any).freshness && (lt as any).freshness.includes("높음") && (
                                                        <span className="text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded font-bold dark:bg-red-900/30 dark:text-red-300 dark:border-red-800 flex items-center gap-1">
                                                            🔥 이슈
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}

                            {/* PAA Section - People Also Ask */}
                            {selectedKeywordObj?.peopleAlsoAsk && selectedKeywordObj.peopleAlsoAsk.length > 0 && (
                                <div className="border-t border-gray-200 dark:border-zinc-700 p-4 bg-gradient-to-b from-yellow-50/50 to-white dark:from-yellow-900/10 dark:to-zinc-900">
                                    <h3 className="text-sm font-bold text-yellow-700 dark:text-yellow-400 mb-3 flex items-center gap-2">
                                        💡 People Also Ask ({selectedKeywordObj.peopleAlsoAsk.length})
                                    </h3>
                                    <div className="space-y-2">
                                        {selectedKeywordObj.peopleAlsoAsk.map((question, qi) => (
                                            <div
                                                key={qi}
                                                className="flex items-center justify-between p-2.5 bg-white dark:bg-zinc-800 rounded-lg border border-yellow-100 dark:border-zinc-700 hover:border-yellow-300 transition-colors cursor-pointer group"
                                                onClick={() => setTargetLongTailKeyword(question)}
                                            >
                                                <span className="text-sm text-gray-700 dark:text-gray-300">{question}</span>
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            navigator.clipboard.writeText(question);
                                                        }}
                                                        className="p-1 hover:bg-yellow-100 dark:hover:bg-zinc-700 rounded text-gray-400 hover:text-yellow-600"
                                                        title="복사"
                                                    >
                                                        <Copy className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleSaveKeyword(question);
                                                        }}
                                                        className="p-1 hover:bg-yellow-100 dark:hover:bg-zinc-700 rounded text-gray-400 hover:text-green-600"
                                                        title="저장"
                                                    >
                                                        <PlusCircle className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Thumbnail Generator */}
                    <div className="w-full h-full flex flex-col">
                        <div className="flex items-center justify-between mb-2 shrink-0">
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                <ImageIcon className="w-5 h-5 text-blue-600" />
                                Thumbnail Auto-Creator
                            </h2>
                        </div>
                        <div className="flex-1 min-h-0">
                            <ThumbnailGenerator
                                ref={thumbnailRef}
                                initialImageSrc={initialImageSrc}
                                defaultTitle={targetLongTailKeyword || targetFocusKeyword || "Your Blog Title Here"}
                                onRawImageChange={setRawImageFile}
                            />
                        </div>
                    </div>
                </div>

                {/* WORDPRESS PUBLISHER - Logic Step 4 */}
                <div className="w-full">
                    <WordPressPublisher
                        defaultBodyImage={rawImageFile}
                        initialHtmlContent={initialHtmlContent}
                        initialBodyImageSrc={initialBodyImageSrc}
                        focusKeyword={targetLongTailKeyword || targetFocusKeyword}
                        getFeaturedImage={async () => {
                            if (thumbnailRef.current?.getThumbnailBlob) {
                                return await thumbnailRef.current.getThumbnailBlob();
                            }
                            return null;
                        }}
                        onHtmlChange={setEditorHtml}
                        onDraftSaved={() => refreshDrafts?.()}
                    />
                </div>

                {/* RESERVED DRAFTS & BATCH PUBLISHING */}
                <DraftsManager
                    onRefreshNeeded={(fn) => setRefreshDrafts(() => fn)}
                    onRestore={async (draft) => {
                        setTargetLongTailKeyword(draft.title);
                        setInitialHtmlContent(draft.content);
                        setEditorHtml(draft.content);

                        if (draft.images) {
                            const body = draft.images.find((img: any) => img.type === 'section');

                            // Use raw/body image for ThumbnailGenerator (not featured, which already has text)
                            if (body) {
                                setInitialImageSrc(body.url); // Raw image goes to Thumbnail generator
                                setInitialBodyImageSrc(body.url);
                                // Also convert URL back to File for WordPressPublisher
                                try {
                                    const response = await fetch(body.url);
                                    const blob = await response.blob();
                                    const restoredFile = new File([blob], "restored-body.png", { type: blob.type });
                                    setRawImageFile(restoredFile);
                                } catch (e) {
                                    console.error("Could not fully restore body image file object", e);
                                }
                            }
                        }
                        alert("글감이 성공적으로 복구되었습니다. (이미지 포함)");
                    }}
                />
            </div>
        </div>
    )
}

// Sub-component for cleaner file structure (ideally move to separate file, but placing here for context)
// import { Calendar as CalendarIcon, Clock } from "lucide-react"; // REMOVED: Already imported at top

function DraftsManager({ onRestore, onRefreshNeeded }: { onRestore: (draft: any) => void, onRefreshNeeded?: (refresh: () => void) => void }) {
    const [drafts, setDrafts] = useState<any[]>([]);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isBatchRunning, setIsBatchRunning] = useState(false);
    const [scheduleDate, setScheduleDate] = useState<string>(""); // ISO String-ish
    const [logs, setLogs] = useState<string[]>([]);

    useEffect(() => {
        loadDrafts();
        onRefreshNeeded?.(loadDrafts); // Pass refresh function to parent
    }, []);

    const loadDrafts = async () => {
        try {
            const res = await fetch("/api/articles/draft");
            const data = await res.json();
            if (data.drafts) setDrafts(data.drafts);
        } catch (e) {
            console.error("Failed to load drafts", e);
        }
    }

    const toggleSelect = (id: string) => {
        const next = new Set(selectedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedIds(next);
    }

    const handleDelete = async (id?: string) => {
        const targetIds = id ? [id] : Array.from(selectedIds);
        if (targetIds.length === 0) return;

        if (!confirm(`정말로 ${targetIds.length === 1 ? '이 글감을' : '선택한 ' + targetIds.length + '개의 글감을'} 삭제하시겠습니까?`)) return;

        try {
            const res = await fetch(`/api/articles/draft?${id ? `id=${id}` : `ids=${targetIds.join(',')}`}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                // Success
                setDrafts(prev => prev.filter(d => !targetIds.includes(d.id)));
                if (!id) setSelectedIds(new Set());
                else {
                    const next = new Set(selectedIds);
                    next.delete(id);
                    setSelectedIds(next);
                }
            } else {
                alert("삭제 실패");
            }
        } catch (e) {
            console.error(e);
            alert("삭제 중 에러 발생");
        }
    }

    const runBatch = async () => {
        if (selectedIds.size === 0) return alert("선택된 글감이 없습니다.");
        if (isBatchRunning) return;

        setIsBatchRunning(true);
        setLogs(["🚀 배치 작업 시작..."]);

        // Sort items by selections (preserving order? or date?)
        // Let's iterate drafts in order they appear to keep sequence
        const queue = drafts.filter(d => selectedIds.has(d.id));

        for (let i = 0; i < queue.length; i++) {
            const draft = queue[i];
            setLogs(prev => [...prev, `[${i + 1}/${queue.length}] '${draft.title}' 처리 중...`]);

            // 1. Trigger Restore (Loads into main UI)
            await onRestore(draft);

            // Wait a bit for state to sync (React state updates are async)
            await new Promise(r => setTimeout(r, 1000));

            // 2. Perform Publish via API (Simulating the Publisher 'Publish' click)
            // Since the logic is inside WordPressPublisher component, we can't easily click it from here without Ref.
            // REFACTOR: We should strictly move the publish logic to a shared helper or hook. 
            // BUT, for now, we can replicate the publish API call here using the draft data directly.
            // This is actually safer than simulating clicks.

            try {
                // NEW: Upload images separately first, then publish with JSON
                // This avoids Vercel's body size limits

                const uploadImageToWP = async (url: string, type: 'featured' | 'body') => {
                    // Fetch blob from URL
                    const blob = await fetch(url).then(r => r.blob());

                    const formData = new FormData();
                    formData.append("image", blob, `${type}-image.png`);
                    formData.append("type", type);

                    const res = await fetch("/api/wordpress/upload-image", {
                        method: "POST",
                        body: formData
                    });

                    if (!res.ok) {
                        const errData = await res.json();
                        throw new Error(`Image upload failed: ${errData.error || res.status}`);
                    }

                    return await res.json();
                };

                // Find images from draft
                const featured = draft.images.find((img: any) => img.type === 'featured');
                const body = draft.images.find((img: any) => img.type === 'section');

                let featuredMediaId: number | null = null;
                let featuredMediaUrl: string | null = null;
                let bodyMediaUrl: string | null = null;

                // Upload featured image
                if (featured) {
                    setLogs(prev => [...prev, `📸 Uploading featured image...`]);
                    const result = await uploadImageToWP(featured.url, 'featured');
                    featuredMediaId = result.id;
                    featuredMediaUrl = result.url;
                }

                // Upload body image
                if (body) {
                    setLogs(prev => [...prev, `📷 Uploading body image...`]);
                    const result = await uploadImageToWP(body.url, 'body');
                    bodyMediaUrl = result.url;
                }

                // Publish with JSON (small payload)
                const res = await fetch("/api/wordpress/post", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        htmlContent: draft.content,
                        featuredMediaId: featuredMediaId,
                        featuredMediaUrl: featuredMediaUrl,
                        bodyMediaUrl: bodyMediaUrl
                    })
                });

                if (res.ok) {
                    setLogs(prev => [...prev, `✅ '${draft.title}' 발행 성공`]);
                } else {
                    const err = await res.json();
                    setLogs(prev => [...prev, `❌ '${draft.title}' 실패: ${err.error || 'Unknown'}`]);
                }

            } catch (e) {
                setLogs(prev => [...prev, `❌ '${draft.title}' 에러 발생`]);
            }

            // Wait interval if scheduled? (Simulated 5s delay between posts)
            await new Promise(r => setTimeout(r, 5000));
        }

        setLogs(prev => [...prev, "🏁 모든 작업 완료"]);
        setIsBatchRunning(false);
    }

    return (
        <div className="space-y-4 pt-10 border-t border-gray-200 dark:border-zinc-800">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <Bookmark className="w-6 h-6 text-indigo-500" />
                    예약된 글감 (Drafts)
                </h2>
                <div className="flex items-center gap-3">
                    {/* Batch Controls */}
                    <div className="flex items-center gap-2 bg-gray-100 p-1.5 rounded-lg">
                        <Calendar className="w-4 h-4 text-gray-500 ml-2" />
                        <input
                            type="datetime-local"
                            className="bg-transparent text-sm border-none focus:ring-0 w-40"
                            value={scheduleDate}
                            onChange={e => setScheduleDate(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={runBatch}
                        disabled={isBatchRunning || selectedIds.size === 0}
                        className={`text-sm px-4 py-2 rounded-lg font-bold text-white flex items-center gap-2 shadow-sm
                            ${isBatchRunning ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}
                        `}
                    >
                        {isBatchRunning ? <Loader2 className="animate-spin w-4 h-4" /> : <Zap className="w-4 h-4" />}
                        {isBatchRunning ? "발행 중..." : "선택 항목 일괄 발행"}
                    </button>
                    {selectedIds.size > 0 && (
                        <button
                            onClick={() => handleDelete()}
                            className="text-sm px-4 py-2 rounded-lg font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 flex items-center gap-2"
                        >
                            <Trash2 className="w-4 h-4" />
                            선택 삭제
                        </button>
                    )}
                </div>
            </div>

            {logs.length > 0 && (
                <div className="bg-black text-green-400 font-mono text-xs p-3 rounded-lg max-h-32 overflow-y-auto">
                    {logs.map((l, i) => <div key={i}>{l}</div>)}
                </div>
            )}

            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 dark:bg-zinc-800 border-b border-gray-100 dark:border-zinc-700">
                        <tr>
                            <th className="p-4 w-10">
                                <input
                                    type="checkbox"
                                    onChange={(e) => {
                                        if (e.target.checked) setSelectedIds(new Set(drafts.map(d => d.id)));
                                        else setSelectedIds(new Set());
                                    }}
                                    checked={selectedIds.size === drafts.length && drafts.length > 0}
                                />
                            </th>
                            <th className="p-4">제목 (Keyword)</th>
                            <th className="p-4 text-center">이미지</th>
                            <th className="p-4 text-right">작성일</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                        {drafts.map(draft => (
                            <tr key={draft.id} className="hover:bg-gray-50/50 cursor-pointer" onClick={() => onRestore(draft)}>
                                <td className="p-4" onClick={e => e.stopPropagation()}>
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.has(draft.id)}
                                        onChange={() => toggleSelect(draft.id)}
                                    />
                                </td>
                                <td className="p-4 font-medium">{draft.title}</td>
                                <td className="p-4 text-center text-xs text-gray-400">
                                    {draft.images?.length > 0 ? '✅' : '-'}
                                </td>
                                <td className="p-4 text-right text-gray-500">
                                    {format(new Date(draft.createdAt), "MM/dd HH:mm")}
                                </td>
                                <td className="p-4 text-right" onClick={e => e.stopPropagation()}>
                                    <button
                                        onClick={() => handleDelete(draft.id)}
                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {drafts.length === 0 && (
                            <tr>
                                <td colSpan={4} className="p-8 text-center text-gray-400">
                                    저장된 글감이 없습니다. 위에서 '예약 저장'을 해보세요.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

