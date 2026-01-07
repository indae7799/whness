"use client"
// Updated: Force Resize & Layout

import { useState, useRef, useEffect } from "react"
import { Search, PenTool, CheckCircle2, Loader2, Workflow, Zap, FileText, Sparkles, Bookmark, ChevronDown, ChevronUp, Eye, Trash2, RotateCcw, Image as ImageIcon, Copy, ArrowRight, PlusCircle, Battery, CloudUpload, Target, Globe, Lightbulb } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"

import { ModelQuotaDashboard } from "./model-quota-dashboard"
import { WordPressPublisher } from "./wordpress-publisher"
import { ThumbnailGenerator, ThumbnailGeneratorRef } from "./thumbnail-generator"
import { SeedSelector } from "./seed-selector"
import { DraftsManager } from "./drafts-manager"

// TYPES
interface GeneratedKeyword {
    term: string
    category: string
    volume: string
    difficulty: string
    intent: string
    cpc: string
    competition: string
    score: number
    suggestions: any[]
}

interface AIAnalysisResult {
    strategy: {
        angle: string;
        target_audience: string;
        content_structure: string[];
    };
    competitors: {
        title: string;
        url: string;
    }[];
}

const FIXED_PROMPT_CONTENT = `
너는 지금부터 '뉴욕에 거주하는 30대 후반의 전문 블로거'로서 글을 작성한다.
네이버 블로그나 티스토리 스타일이 아닌, 구글 SEO에 최적화된 전문적인 정보성 글을 써야 한다.
독자는 미국에 거주하는 한인들이거나, 혹은 미국 생활에 관심 있는 한국 사람들이다.

[페르소나 설정]
- 이름: Jay (뉴욕 거주 7년차, 마케터 겸 에디터)
- 말투: "~해요", "~하죠" (친근하면서도 신뢰감 있는 "합쇼체"와 "해요체"의 중간)
- 특징: 직접 경험한 듯한 생생한 에피소드를 곁들임. 구체적인 수치와 데이터를 좋아함.
- 금기사항: "~합니다"만 반복되는 딱딱한 번역투 절대 금지. "결론적으로", "요약하자면" 같은 상투적인 접속사 지양.

[글 작성 원칙]
1.  **서론 (Hook)**:
    -   독자의 검색 의도를 정확히 파악하여 공감을 이끌어내는 질문이나 상황 묘사로 시작한다.
    -   이 글을 읽어야 할 이유(혜택)를 명확히 제시한다.
2.  **본론 (Body)**:
    -   H2, H3 태그를 사용하여 구조적으로 작성한다.
    -   문단은 3~4줄 내외로 짧게 끊어서 가독성을 높인다.
    -   중요한 핵심 키워드(LSI 키워드 포함)는 볼드체(**)로 강조한다.
    -   가능하면 표(Table)나 리스트(List)를 활용하여 정보를 일목요연하게 정리한다.
3.  **결론 (Conclusion)**:
    -   본문 내용을 단순히 요약하기보다, 독자가 바로 실행할 수 있는 'Action Item'을 제안한다.
    -   관련된 다른 주제로의 호기심을 유발하며 마무리한다.
4.  **SEO 요소**:
    -   메인 키워드를 제목, 서론 첫 문단, 본문 중간, 결론에 자연스럽게 배치한다.
    -   이미지 Alt 태그에 들어갈 텍스트를 제안한다. (예: [이미지: 설명... Alt: 키워드...])

[출력 형식]
- 반드시 마트다운(Markdown) 형식으로 출력한다.
- HTML 태그(h1, h2, canvas 등)를 사용하지 말고 순수 마크다운으로 작성하라.
`

export function SemiAutoBlogger() {
    // STEPS: topic -> keyword -> writing -> finish
    const [step, setStep] = useState<"topic" | "keyword" | "writing" | "finish">("topic")
    const [loading, setLoading] = useState(false)
    const thumbnailRef = useRef<ThumbnailGeneratorRef>(null)

    // Data States
    const [keywords, setKeywords] = useState<GeneratedKeyword[]>([])
    const [selectedKeywordObj, setSelectedKeywordObj] = useState<GeneratedKeyword | null>(null)
    const [selectedLongTail, setSelectedLongTail] = useState<string>("")
    const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(null)

    // Generation States
    const [generationMode, setGenerationMode] = useState<"3.0" | "hybrid" | "2.5">("3.0")
    const [generatedContent, setGeneratedContent] = useState<any>(null)
    const [editorHtml, setEditorHtml] = useState("")

    // Image & Restore States
    const [rawImageFile, setRawImageFile] = useState<File | null>(null)
    const [initialHtmlContent, setInitialHtmlContent] = useState<string | null>(null)
    const [initialImageSrc, setInitialImageSrc] = useState<string | null>(null)
    const [initialBodyImageSrc, setInitialBodyImageSrc] = useState<string | null>(null)
    const [refreshDrafts, setRefreshDrafts] = useState<(() => void) | null>(null)

    // Prompt & Copy States
    const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false)
    const [imagePrompt, setImagePrompt] = useState<string>("") // State for the generated image prompt
    const [copied, setCopied] = useState(false)

    // Seed Mode State
    const [seedMode, setSeedMode] = useState<"auto" | "manual">("auto")
    const [selectedSeeds, setSelectedSeeds] = useState<any[]>([])

    // SERP API Usage State
    const [serpUsage, setSerpUsage] = useState({ serpApi: 0, serper: 0 })

    // Fetch SERP usage on mount and after keyword generation
    const fetchSerpUsage = async () => {
        try {
            const res = await fetch("/api/serp/usage")
            if (res.ok) {
                const data = await res.json()
                setSerpUsage({
                    serpApi: data.serpApi?.used || 0,
                    serper: data.serper?.used || 0
                })
            }
        } catch (e) {
            console.warn("[SerpUsage] Failed to fetch:", e)
        }
    }

    useEffect(() => {
        fetchSerpUsage()
    }, [])

    // --- HANDLERS ---

    // 1. Find Keywords (Step 1 -> 2)
    const handleFindKeywords = async () => {
        const seeds = selectedSeeds.map(s => s.term);

        // Validation for Manual Mode
        if (seedMode === 'manual' && seeds.length === 0) {
            alert("수동 모드에서는 최소 1개 이상의 시드 키워드를 선택해야 합니다.");
            return;
        }

        setLoading(true)
        try {
            const res = await fetch("/api/keywords/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    topic: "auto-topic",
                    seedMode: seedMode,
                    manualSeeds: seeds
                })
            })
            if (!res.ok) throw new Error("Failed to fetch")
            const data = await res.json()

            // FIX: Map 'results' from backend (Backend uses 'results', Frontend expected 'keywords')
            const resultList = data.results || data.keywords || [];
            console.log("[FindKeywords] Keywords Loaded:", resultList.length);

            setKeywords(resultList)

            // Restore Analysis (Global or from first item)
            const analysisData = data.analysis || (resultList.length > 0 && resultList[0].strategy ? { strategy: resultList[0].strategy, competitors: [] } : null);
            setAiAnalysis(analysisData)

            // Auto Select First
            if (resultList.length > 0) {
                setSelectedKeywordObj(resultList[0])
            }

            setStep("keyword")

            // Refresh SERP usage counts after keyword generation
            await fetchSerpUsage()
        } catch (e: any) {
            console.error(e)
            alert(`키워드 생성 에러: ${e.message}`)
        } finally {
            setLoading(false)
        }
    }

    // 2. Start Writing (Step 2 -> 3 -> 4)
    const handleStartWriting = async () => {
        if (!selectedLongTail) return;
        setStep("writing");

        // 1. Construct Strategy Section from AI Analysis
        let strategySection = "";
        if (aiAnalysis?.strategy) {
            strategySection = `
[STRATEGIC PLAN]
- Target Audience: ${aiAnalysis.strategy.target_audience}
- Content Angle: ${aiAnalysis.strategy.angle}
- Verification Facts:
${aiAnalysis.strategy.content_structure.map(s => `  * ${s}`).join('\n')}
`;
        }

        // 2. Assemble Full Prompt (Topic + Strategy + Fixed Instructions)
        // This ensures the AI model follows the exact Persona, SEO rules, and formatting guidelines.
        const fullPrompt = `
TOPIC: ${selectedLongTail}
FOCUS KEYWORD: ${selectedKeywordObj?.term || selectedLongTail}

${strategySection}

${FIXED_PROMPT_CONTENT}
`.trim();

        try {
            const res = await fetch(`/api/generate/chained-v2?t=${Date.now()}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    topic: fullPrompt, // Send the full prompt instructions
                    focusKeyword: selectedKeywordObj?.term || selectedLongTail, // FIX: Backend expects 'focusKeyword', not 'keywords' array
                    mode: generationMode // Use the user-selected model
                })
            });

            if (!res.ok) {
                let errorMsg = `Error ${res.status}`;
                try {
                    const errorJson = await res.json();
                    errorMsg = errorJson.error || errorJson.details || JSON.stringify(errorJson);
                } catch (e) {
                    errorMsg = await res.text();
                }
                throw new Error(errorMsg);
            }

            const reader = res.body?.getReader();
            let resultText = "";
            if (reader) {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    resultText += new TextDecoder().decode(value);
                }
            }

            try {
                const json = JSON.parse(resultText);
                setGeneratedContent(json);
                setEditorHtml(json.content);
                setInitialHtmlContent(json.content);

                // DETECT MOCK DATA (FAILURE)
                if (json.content && json.content.includes("[SYSTEM NOTICE]")) {
                    alert("⚠️ 생성 실패 알림 \n\nAI 모델 호출에 실패하여 '샘플 데이터(Mock)'가 출력되었습니다.\n\n원인: API Key 누락 또는 모델 설정 오류.\n환경 변수(.env)를 확인해주세요.");
                }

            } catch (e) {
                // If response is raw text (streaming or markdown), use it directly
                setGeneratedContent({ content: resultText });
                setEditorHtml(resultText);
                setInitialHtmlContent(resultText);

                if (resultText.includes("[SYSTEM NOTICE]")) {
                    alert("⚠️ 생성 실패 알림 \n\nAI 모델 호출에 실패하여 '샘플 데이터(Mock)'가 출력되었습니다.\n\n원인: API Key 누락 또는 모델 설정 오류.\n환경 변수(.env)를 확인해주세요.");
                }
            }

            setStep("finish");
        } catch (e) {
            console.error(e);
            alert("글 작성 실패. 모델 상태를 확인해주세요.");
            setStep("keyword"); // Revert step on error
        }
    };

    // Image Prompt Copy & Generation
    const handleCopyImagePrompt = async () => {
        if (!imagePrompt) {
            await handleGenerateImagePrompt();
            return; // Generated, user can copy next
        }
        await navigator.clipboard.writeText(imagePrompt);
        alert("이미지 프롬프트가 복사되었습니다!");
    }

    const handleGenerateImagePrompt = async () => {
        setIsGeneratingPrompt(true);
        try {
            const topic = selectedLongTail || selectedKeywordObj?.term || "Lifestyle";
            const res = await fetch("/api/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    prompt: `Create a premium Midjourney/Flux image prompt for a blog post header about: "${topic}".
                    Content Angle: ${aiAnalysis?.strategy?.angle || 'General info'}.
                    
                    CRITICAL STYLE GUIDELINES:
                    - Setting: Modern New York City aesthetic (or relevant US context)
                    - Vibe: Authentic, Candid, High-end Editorial, "Unsplash-style"
                    - Camera: Shot on 35mm film (Kodak Portra 400), slight film grain, soft natural lighting
                    - Composition: Cinematic, depth of field, minimal and clean
                    - NEGATIVE PROMPT: No text, no logos, no 3D renders, no cartoon, no illustration, no fake AI gloss.
                    
                    Return ONLY the English prompt string.`,
                    model: "gemini-2.0-flash-exp"
                })
            });

            if (!res.ok) throw new Error("Prompt generation failed");
            const data = await res.json();
            setImagePrompt(data.result);
        } catch (e) {
            console.error(e);
            alert("이미지 프롬프트 생성 실패");
        } finally {
            setIsGeneratingPrompt(false);
        }
    }

    // State to force re-render of publisher
    const [publisherKey, setPublisherKey] = useState(0);

    // Restore Draft
    const handleRestoreDraft = async (draft: any) => {
        if (!confirm("이 글감을 불러오시겠습니까? 현재 작성 중인 내용은 사라집니다.")) return

        setStep("finish");
        setGeneratedContent({ content: draft.content });
        setEditorHtml(draft.content);
        setInitialHtmlContent(draft.content);
        setSelectedLongTail(draft.title);

        // Dummy context if empty
        if (keywords.length === 0) {
            setSelectedKeywordObj({ term: draft.title, score: 0, category: 'focus', difficulty: 'M', volume: '-', intent: '-', cpc: '0', competition: '0', suggestions: [] });
        }

        if (draft.images) {
            const body = draft.images.find((img: any) => img.type === 'section');
            if (body) {
                setInitialImageSrc(body.url);
                setInitialBodyImageSrc(body.url);
                setRawImageFile(null); // URL모드 사용 (CORS 방지)
            } else {
                setInitialBodyImageSrc(null);
                setRawImageFile(null);
            }
        }

        // Force Publisher Re-mount & Scroll
        setPublisherKey(prev => prev + 1);

        // Wait for render then scroll
        setTimeout(() => {
            const publisherEl = document.getElementById('wordpress-publisher-section');
            if (publisherEl) {
                publisherEl.scrollIntoView({ behavior: 'smooth' });
            }
        }, 100);
    }


    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-32 p-4">



            {/* ROW 2: Step Indicators */}
            <div className="flex flex-col md:flex-row items-center justify-between bg-white dark:bg-zinc-900 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-800 gap-4">
                <div className="flex items-center gap-4 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
                    <StepBadge active={step === "topic"} done={step !== "topic"} num={1} label="키워드 발굴" />
                    <div className="w-8 h-px bg-gray-200 shrink-0" />
                    <StepBadge active={step === "keyword"} done={step === "writing" || step === "finish"} num={2} label="전략 구성" />
                    <div className="w-8 h-px bg-gray-200 shrink-0" />
                    <StepBadge active={step === "writing"} done={step === "finish"} num={3} label="AI 글쓰기" />
                    <div className="w-8 h-px bg-gray-200 shrink-0" />
                    <StepBadge active={step === "finish"} done={false} num={4} label="발행 및 편집" />
                </div>
                {step !== "topic" && (
                    <Button variant="ghost" size="sm" onClick={() => setStep("topic")} className="text-gray-400 hover:text-red-500 shrink-0">
                        <RotateCcw className="w-4 h-4 mr-2" /> 초기화
                    </Button>
                )}
            </div>



            {/* ROW 3 Bottom Cards: Seed Mode (Left) + Action Buttons (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Card: Seed Keyword Mode Selection */}
                <Card className="p-5 bg-blue-50 dark:bg-blue-950/30 border-blue-100 dark:border-blue-900 h-full">
                    <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="w-5 h-5 text-blue-600" />
                        <h3 className="font-bold text-blue-900 dark:text-blue-100">시드 키워드 모드</h3>
                    </div>

                    {/* Mode Buttons */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <Button
                            variant={seedMode === 'auto' ? 'default' : 'outline'}
                            className={`w-full ${seedMode === 'auto' ? 'bg-blue-600 hover:bg-blue-700' : 'border-blue-200 hover:bg-blue-100 dark:border-blue-800'}`}
                            onClick={() => setSeedMode('auto')}
                        >
                            <Zap className="w-4 h-4 mr-2" />
                            자동 발굴
                        </Button>
                        <Button
                            variant={seedMode === 'manual' ? 'default' : 'outline'}
                            className={`w-full ${seedMode === 'manual' ? 'bg-blue-600 hover:bg-blue-700' : 'border-blue-200 hover:bg-blue-100 dark:border-blue-800'}`}
                            onClick={() => setSeedMode('manual')}
                        >
                            <PenTool className="w-4 h-4 mr-2" />
                            수동 선택
                        </Button>
                    </div>

                    {/* Seed Selector & Analyze Button */}
                    {step === "topic" && (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-4">
                            <SeedSelector
                                mode={seedMode}
                                onModeChange={setSeedMode}
                                onSeedsSelected={setSelectedSeeds}
                            />

                            {/* API Usage Status (Requested UI) */}
                            <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 dark:bg-zinc-800/50 rounded-lg border border-gray-100 dark:border-zinc-700">
                                {/* SERP API Status */}
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="font-semibold flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
                                            <Search className="w-3.5 h-3.5" /> SERP API
                                        </span>
                                        <Badge variant="outline" className="text-[9px] h-4 px-1 bg-green-50 border-green-200 text-green-700">
                                            Active
                                        </Badge>
                                    </div>
                                    <div className="h-1.5 bg-gray-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                                        <div className="h-full bg-green-500" style={{ width: `${(serpUsage.serpApi / 100) * 100}%` }} />
                                    </div>
                                    <div className="flex justify-between text-[9px] text-gray-500">
                                        <span>Limit: 3 searches/post</span>
                                        <span>{serpUsage.serpApi} / 100</span>
                                    </div>
                                </div>

                                {/* Serper API Status */}
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="font-semibold flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
                                            <Zap className="w-3.5 h-3.5" /> Serper API
                                        </span>
                                        <Badge variant="outline" className="text-[9px] h-4 px-1 bg-green-50 border-green-200 text-green-700">
                                            Active
                                        </Badge>
                                    </div>
                                    <div className="h-1.5 bg-gray-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                                        <div className="h-full bg-green-500" style={{ width: `${(serpUsage.serper / 2500) * 100}%` }} />
                                    </div>
                                    <div className="flex justify-between text-[9px] text-gray-500">
                                        <span>Total Usage</span>
                                        <span>{serpUsage.serper} / 2500</span>
                                    </div>
                                </div>
                            </div>

                            <Button
                                size="lg"
                                className="w-full h-12 text-base font-bold shadow-md bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all text-white"
                                onClick={handleFindKeywords}
                                disabled={loading || (seedMode === 'manual' && selectedSeeds.length === 0)}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                        가중치 기반 분석 중...
                                    </>
                                ) : (
                                    <>
                                        <Search className="w-5 h-5 mr-2" />
                                        가중치 기반 최적 시드 분석
                                    </>
                                )}
                            </Button>
                        </div>
                    )}
                </Card>


                {/* Right Card: Action Buttons Group */}
                <Card className="p-5 bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800 h-full flex flex-col justify-between">
                    <div className="font-bold flex items-center gap-2 mb-4 text-amber-500">
                        <Zap className="w-5 h-5" />
                        액션 센터
                    </div>

                    <div className="flex flex-col gap-3 flex-1">
                        {/* AI 글쓰기 시작 */}
                        <Button
                            className="w-full flex-1 text-lg py-6 shadow-lg shadow-blue-500/10 bg-blue-600 hover:bg-blue-700 transition-all font-bold"
                            disabled={!selectedLongTail || step === "writing"}
                            onClick={handleStartWriting}
                        >
                            {step === "writing" ? (
                                <>
                                    <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                                    AI 글쓰기 진행 중...
                                </>
                            ) : (
                                <>
                                    <PenTool className="w-6 h-6 mr-2" />
                                    AI 글쓰기 시작
                                </>
                            )}
                        </Button>

                        {/* 이미지 프롬프트 생성 (Copy included) */}
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                className="flex-1 h-12 text-sm border-gray-200 hover:bg-gray-50"
                                disabled={!selectedLongTail || isGeneratingPrompt}
                                onClick={handleGenerateImagePrompt}
                            >
                                {isGeneratingPrompt ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        생성 중...
                                    </>
                                ) : (
                                    <>
                                        <ImageIcon className="w-4 h-4 mr-2" />
                                        이미지 프롬프트 생성
                                    </>
                                )}
                            </Button>

                            {imagePrompt && (
                                <Button
                                    variant="outline"
                                    className="w-12 h-12 p-0 border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-600"
                                    onClick={handleCopyImagePrompt}
                                    title="프롬프트 복사"
                                >
                                    <Copy className="w-5 h-5" />
                                </Button>
                            )}
                        </div>

                        {/* Tools: Gemini + Flow */}
                        <div className="grid grid-cols-2 gap-2 mt-auto">
                            <Button
                                variant="outline"
                                className="w-full h-10 border-gray-200 text-gray-600 hover:text-gray-900"
                                onClick={() => window.open('https://gemini.google.com/app', '_blank')}
                            >
                                <Sparkles className="w-4 h-4 mr-2" />
                                Gemini
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full h-10 border-gray-200 text-gray-600 hover:text-gray-900"
                                onClick={() => window.open('https://labs.google/fx/ko/tools/flow/project/743f991d-0bc5-449d-9d3c-fea44b52856f', '_blank')}
                            >
                                <Workflow className="w-4 h-4 mr-2" />
                                Flow
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>

            {/* COMBINED VIEW: RESTRUCTURED LAYOUT (Top-Down Flow) */}

            {/* 1. TOP ROW: Discovered Keywords (Horizontal Cards) */}
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 mt-6">
                <h3 className="font-bold flex items-center gap-2 mb-3 text-base text-gray-700 dark:text-gray-300">
                    <Search className="w-4 h-4 text-blue-500" />
                    발굴된 주제 (Top 3 Picks)
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {keywords?.length > 0 ? keywords.map((k, i) => (
                        <div
                            key={i}
                            onClick={() => setSelectedKeywordObj(k)}
                            className={`relative group p-4 rounded-2xl border cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 flex flex-col justify-between overflow-hidden ${selectedKeywordObj?.term === k.term
                                ? 'bg-gradient-to-br from-blue-50 to-white border-blue-400 ring-2 ring-blue-200 dark:from-blue-950/40 dark:to-zinc-900 border-2 shadow-blue-200/50'
                                : 'bg-white border-gray-100 hover:border-blue-300 dark:bg-zinc-900 dark:border-zinc-800'
                                }`}
                        >
                            {/* Selection Indicator */}
                            {selectedKeywordObj?.term === k.term && (
                                <div className="absolute top-0 right-0 p-1.5 bg-blue-500 rounded-bl-xl text-white shadow-sm">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                </div>
                            )}

                            <div>
                                <div className="flex justify-between items-start mb-2">
                                    <span className="font-extrabold text-lg text-gray-900 dark:text-gray-100 leading-tight group-hover:text-blue-700 transition-colors line-clamp-2">
                                        {k.term}
                                    </span>
                                    <Badge variant={(k.score || 0) >= 80 ? "default" : "secondary"} className={`text-xs px-1.5 py-0 shadow-sm ml-2 h-5 ${(k.score || 0) >= 80 ? 'bg-blue-600' : 'bg-gray-200 text-gray-700'}`}>
                                        {k.score}
                                    </Badge>
                                </div>

                                <div className="flex flex-wrap gap-1 mt-2">
                                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 border ${k.difficulty === 'Easy' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>
                                        {k.difficulty === 'Easy' ? '경쟁 낮음' : '경쟁 보통'}
                                    </Badge>
                                    <span className="text-[10px] text-gray-400 flex items-center ml-auto">
                                        <Search className="w-3 h-3 mr-1" />
                                        {k.volume}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )) : (
                        <div className="col-span-3 h-32 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed rounded-2xl border-gray-100 bg-gray-50/50">
                            <Search className="w-6 h-6 mb-2 opacity-20" />
                            <p className="text-sm">키워드 분석을 시작하세요</p>
                        </div>
                    )}
                </div>
            </div>

            {/* 2. BOTTOM ROW: Titles (Left) & SERP Analysis (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6 animate-in fade-in slide-in-from-bottom-5 duration-500 delay-100">

                {/* Left: Recommended Titles */}
                <Card className="p-5 bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800 flex flex-col h-full">
                    <h3 className="font-bold flex items-center gap-2 mb-3 text-base">
                        <Sparkles className="w-4 h-4 text-indigo-500" />
                        추천 제목 (Titles)
                    </h3>

                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar max-h-[400px] space-y-2">
                        {selectedKeywordObj ? (
                            (selectedKeywordObj as any).suggestions?.map((s: any, i: number) => (
                                <div
                                    key={i}
                                    onClick={() => setSelectedLongTail(s.keyword)}
                                    className={`group p-3 rounded-lg border cursor-pointer transition-all flex items-start gap-3 ${selectedLongTail === s.keyword
                                        ? 'bg-indigo-50 border-indigo-300 shadow-sm dark:bg-indigo-900/30'
                                        : 'bg-white border-gray-100 hover:border-indigo-200 hover:bg-gray-50 dark:bg-zinc-800/50'
                                        }`}
                                >
                                    <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${selectedLongTail === s.keyword ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-400'}`}>
                                        <PenTool className="w-3 h-3" />
                                    </div>
                                    <div className="flex-1">
                                        <p className={`font-medium text-sm leading-snug ${selectedLongTail === s.keyword ? 'text-indigo-900 dark:text-indigo-100' : 'text-gray-900 dark:text-gray-100'}`}>
                                            {s.keyword}
                                        </p>
                                        <div className="flex items-center gap-2 mt-1">
                                            {s.korean && s.korean !== s.keyword && (
                                                <span className="text-[10px] text-gray-500 truncate max-w-[200px]">{s.korean}</span>
                                            )}
                                            <span className="text-[10px] text-indigo-400 font-medium ml-auto">Score: {s.score}</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="h-40 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed rounded-xl border-gray-100 bg-gray-50/30">
                                <p className="text-sm">주제를 선택하면 추천 제목이 표시됩니다</p>
                            </div>
                        )}
                    </div>
                </Card>

                {/* Right: SERP Analysis Dashboard */}
                <Card className="overflow-hidden border-indigo-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm flex flex-col h-full">
                    {selectedKeywordObj && (selectedKeywordObj as any).serpAnalysis ? (
                        <>
                            <div className="bg-indigo-50/50 dark:bg-indigo-900/20 p-4 border-b border-indigo-100 dark:border-zinc-800 flex justify-between items-center shrink-0">
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="bg-indigo-100 text-indigo-700 border-indigo-200 text-[10px] h-5 px-1.5">
                                        Live
                                    </Badge>
                                    <h3 className="font-bold text-sm text-indigo-950 dark:text-indigo-100 truncate max-w-[200px]">
                                        경쟁 분석 리포트
                                    </h3>
                                </div>
                                <div className="text-[10px] text-gray-400">
                                    {(selectedKeywordObj as any).serpAnalysis.source}
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-0">
                                <div className="divide-y divide-gray-100 dark:divide-zinc-800">
                                    {/* 1. Gaps */}
                                    <div className="p-4">
                                        <h4 className="font-semibold text-xs text-gray-500 uppercase tracking-wider flex items-center gap-2 mb-2">
                                            <Target className="w-3.5 h-3.5" /> 공략 포인트 (Gaps)
                                        </h4>
                                        <ul className="space-y-1.5">
                                            {(selectedKeywordObj as any).serpAnalysis.contentGaps?.slice(0, 3).map((gap: string, i: number) => (
                                                <li key={i} className="text-xs flex items-start gap-2 text-gray-700 dark:text-gray-300">
                                                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />
                                                    <span>{gap}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    {/* 2. Competitors */}
                                    <div className="p-4">
                                        <h4 className="font-semibold text-xs text-gray-500 uppercase tracking-wider flex items-center gap-2 mb-2">
                                            <Globe className="w-3.5 h-3.5" /> 상위 경쟁사
                                        </h4>
                                        <div className="flex flex-wrap gap-1.5">
                                            {(selectedKeywordObj as any).serpAnalysis.topDomains?.slice(0, 5).map((domain: string, i: number) => (
                                                <Badge key={i} variant="secondary" className="text-[10px] bg-gray-100 text-gray-600 hover:bg-gray-200 px-1.5 py-0 h-5">
                                                    {domain}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>

                                    {/* 3. Patterns */}
                                    <div className="p-4">
                                        <h4 className="font-semibold text-xs text-gray-500 uppercase tracking-wider flex items-center gap-2 mb-2">
                                            <Lightbulb className="w-3.5 h-3.5" /> 제목 패턴
                                        </h4>
                                        <ul className="space-y-1.5">
                                            {(selectedKeywordObj as any).serpAnalysis.headlinePatterns?.slice(0, 3).map((pattern: string, i: number) => (
                                                <li key={i} className="text-xs flex items-start gap-2 text-gray-700 dark:text-gray-300">
                                                    <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                                                    <span>{pattern}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 bg-gray-50/10">
                            <div className="bg-gray-50 p-3 rounded-full mb-3">
                                <Target className="w-6 h-6 text-gray-300" />
                            </div>
                            <p className="text-sm font-medium text-gray-500">경쟁 분석 데이터 대기 중</p>
                            <p className="text-xs text-gray-400 mt-1">좌측에서 주제를 선택하세요</p>
                        </div>
                    )}
                </Card>
            </div>

            {/* Editor & Media Studio (ALWAYS VISIBLE) */}
            <div className="space-y-8 pt-8 border-t border-gray-100 dark:border-zinc-800 animate-in fade-in slide-in-from-bottom-8 duration-700">

                {/* 2. Middle: Thumbnail Generator (Left) + Body Image Upload (Right) */}
                < div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8" >
                    {/* Left: Thumbnail Generator */}
                    < Card className="p-5 bg-green-50 dark:bg-green-950/30 border-green-100 dark:border-green-900" >
                        <div className="flex items-center gap-2 mb-4">
                            <ImageIcon className="w-5 h-5 text-green-600" />
                            <h3 className="font-bold text-green-900 dark:text-green-100">썸네일 생성</h3>
                        </div>
                        <ThumbnailGenerator
                            ref={thumbnailRef}
                            initialImageSrc={initialImageSrc}
                            defaultTitle={selectedLongTail || "New Blog Post"}
                            onRawImageChange={setRawImageFile}
                        />
                    </Card >

                    {/* Right: Body Image Selection */}
                    < Card className="p-5 bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800" >
                        <div className="space-y-1 mb-4">
                            <h3 className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                <CloudUpload className="w-4 h-4 text-blue-500" />
                                2. 본문 이미지 (선택사항)
                            </h3>
                            <p className="text-xs text-gray-500">
                                *기본값: 좌측 썸네일 생성기의 원본 이미지<br />
                                *다른 이미지를 원하면 아래에 업로드하세요.
                            </p>
                        </div>

                        <div
                            className="border-2 border-dashed border-blue-200 hover:border-blue-400 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-900/10 rounded-xl h-[200px] flex flex-col items-center justify-center cursor-pointer transition-all"
                            onClick={() => document.getElementById('body-image-upload')?.click()}
                            onDragOver={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                e.currentTarget.classList.add('border-blue-500', 'bg-blue-100/50');
                            }}
                            onDragLeave={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                e.currentTarget.classList.remove('border-blue-500', 'bg-blue-100/50');
                            }}
                            onDrop={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                e.currentTarget.classList.remove('border-blue-500', 'bg-blue-100/50');
                                const file = e.dataTransfer.files?.[0];
                                if (file && file.type.startsWith('image/')) {
                                    setRawImageFile(file);
                                }
                            }}
                        >
                            <input
                                id="body-image-upload"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                    const file = e.target.files?.[0]
                                    if (file) setRawImageFile(file)
                                }}
                            />
                            {rawImageFile ? (
                                <div className="relative w-full h-full p-2">
                                    <img
                                        src={URL.createObjectURL(rawImageFile)}
                                        alt="Body"
                                        className="w-full h-full object-contain rounded-lg"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity rounded-lg">
                                        <p className="text-white text-sm font-bold">이미지 변경하기 (끌어다 놓기 가능)</p>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <CloudUpload className="w-10 h-10 text-blue-400 mb-3" />
                                    <p className="text-sm font-bold text-blue-900 dark:text-blue-100">원본 이미지 드래그</p>
                                    <p className="text-xs text-blue-600 dark:text-blue-300">또는 클릭하여 업로드</p>
                                </>
                            )}
                        </div>
                    </Card >
                </div >

                {/* 3. Bottom: WordPress Publisher */}
                < div className="mt-8 pt-8 border-t border-gray-200 dark:border-zinc-800" >
                    {/* Section Header */}
                    {/* Removed redundant header since it's inside the component now, or we can keep a simple one if needed. Keeping it clean. */}

                    <div className="relative" id="wordpress-publisher-section">
                        {step === "writing" && (
                            <div className="absolute inset-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-xl border border-indigo-100">
                                <div className="relative w-24 h-24 mb-6">
                                    <div className="absolute inset-0 border-4 border-gray-100 rounded-full"></div>
                                    <div className="absolute inset-0 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                                    <Sparkles className="absolute inset-0 m-auto w-8 h-8 text-indigo-500 animate-pulse" />
                                </div>
                                <h3 className="text-xl font-bold text-indigo-900 dark:text-indigo-100 mb-2">AI 작가가 집필 중입니다</h3>
                                <p className="text-gray-500">약 30~60초 정도 소요됩니다.</p>
                            </div>
                        )}
                        <WordPressPublisher
                            key={publisherKey}
                            initialHtmlContent={initialHtmlContent || generatedContent?.content}
                            initialBodyImageSrc={initialBodyImageSrc}
                            focusKeyword={selectedLongTail || selectedKeywordObj?.term || ""}
                            defaultBodyImage={rawImageFile}
                            getFeaturedImage={async () => {
                                if (thumbnailRef.current?.getThumbnailBlob) {
                                    return await thumbnailRef.current.getThumbnailBlob()
                                }
                                return null
                            }}
                            onHtmlChange={setEditorHtml}
                            onDraftSaved={() => refreshDrafts?.()}
                        />
                    </div>
                </div >
            </div >


            {/* 3. Drafts Manager (Always Visible at Bottom) */}
            < div className="mt-16 pt-8 border-t border-gray-200 dark:border-zinc-800" >
                <DraftsManager
                    onRefreshNeeded={(fn) => setRefreshDrafts(() => fn)}
                    onRestore={handleRestoreDraft}
                />
            </div >
        </div >
    )
}

function StepBadge({ active, done, num, label }: { active: boolean, done: boolean, num: number, label: string }) {
    return (
        <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' :
                done ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400'
                }`}>
                {done ? <CheckCircle2 className="w-5 h-5" /> : num}
            </div>
            <span className={`text-sm font-bold ${active ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>
                {label}
            </span>
        </div>
    )
}
