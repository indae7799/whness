"use client"

import { useState, useRef } from "react"
import { Sparkles, Search, PenTool, ArrowRight, Loader2, CheckCircle2, RotateCcw, Layout, FileText, Globe, Zap, Settings2, Copy, ExternalLink, Workflow, Image as ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ModelQuotaDashboard } from "./model-quota-dashboard"
import { WordPressPublisher } from "./wordpress-publisher"
import { ThumbnailGenerator, ThumbnailGeneratorRef } from "./thumbnail-generator"

export function SemiAutoBlogger() {
    const [step, setStep] = useState<"topic" | "keyword" | "writing" | "finish">("topic")
    const [loading, setLoading] = useState(false)
    const thumbnailRef = useRef<ThumbnailGeneratorRef>(null)

    // Data States
    const [topic, setTopic] = useState("")
    const [keywords, setKeywords] = useState<any[]>([])
    const [selectedKeyword, setSelectedKeyword] = useState<string>("")
    const [longTails, setLongTails] = useState<any[]>([])
    const [selectedLongTail, setSelectedLongTail] = useState<string>("")
    const [rawImageFile, setRawImageFile] = useState<File | null>(null)

    // Generation Strategy Mode
    const [generationMode, setGenerationMode] = useState<"3.0" | "hybrid" | "2.5">("hybrid")

    // Final Content
    const [generatedContent, setGeneratedContent] = useState<any>(null)

    // Handlers
    const handleFindKeywords = async () => {
        if (!topic) return
        setLoading(true)
        try {
            const res = await fetch("/api/research", {
                method: "POST",
                body: JSON.stringify({ seeds: [topic], sources: ["google"] })
            })
            const data = await res.json()
            setKeywords(data.keywords || [])
            setStep("keyword")
        } catch (error) {
            alert("키워드 검색 실패")
        } finally {
            setLoading(false)
        }
    }

    const handleCopyImagePrompt = async () => {
        if (!generatedContent?.content) return;
        try {
            const match = generatedContent.content.match(/\[IMAGE_PROMPT_START\]([\s\S]*?)\[IMAGE_PROMPT_END\]/);
            let promptText = "";

            if (match && match[1]) {
                promptText = match[1].trim();
            } else {
                const keyword = selectedLongTail || selectedKeyword || topic;
                promptText = `Editorial photography of ${keyword}, New York City atmosphere, cinematic lighting, shallow depth of field, shot on Sony A7R IV, 8k resolution, highly detailed, realistic texture, 16:9 aspect ratio --ar 16:9 --v 6.0`;
            }

            await navigator.clipboard.writeText(promptText);
            alert("이미지 프롬프트가 복사되었습니다! Flow에서 생성 후 섬네일을 업로드하세요.");
        } catch (error) {
            alert("복사 실패");
        }
    }

    const handleSelectKeyword = (kw: any) => {
        setSelectedKeyword(kw.phrase)
        // Simulate long tail suggestions or use more research
        setLongTails([
            { phrase: `${kw.phrase} for seniors`, score: 92 },
            { phrase: `${kw.phrase} in NYC 2026`, score: 88 },
            { phrase: `best way to ${kw.phrase}`, score: 85 },
            { phrase: `how to handle ${kw.phrase} alone`, score: 79 },
        ])
    }

    const handleStartWriting = async () => {
        setLoading(true)
        setStep("writing")

        let outlineModelId = "google/gemini-3.0-flash:free"
        let contentModelId = "google/gemini-2.5-flash:free"

        if (generationMode === "3.0") {
            outlineModelId = "google/gemini-3.0-flash:free"
            contentModelId = "google/gemini-3.0-flash:free"
        } else if (generationMode === "2.5") {
            outlineModelId = "google/gemini-2.5-flash:free"
            contentModelId = "google/gemini-2.5-flash:free"
        }
        // "hybrid" uses the defaults above (3.0 -> 2.5)

        try {
            const res = await fetch("/api/generate/chained", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    topic: selectedLongTail || selectedKeyword,
                    focusKeyword: selectedKeyword,
                    outlineModelId,
                    contentModelId,
                    temperature: 0.7,
                    maxOutputTokens: 8192
                })
            })
            const data = await res.json()
            setGeneratedContent(data)
            setStep("finish")
        } catch (error) {
            alert("글 작성 중 오류 발생")
            setStep("keyword")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-20">
            <ModelQuotaDashboard />

            <div className="relative overflow-hidden rounded-[2.5rem] bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 shadow-2xl p-10">
                {/* Background glow */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-[100px] -mr-48 -mt-48" />

                <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-10">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <Sparkles className="text-white w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Full Auto Pilot 2.0</h2>
                            <p className="text-gray-500 dark:text-gray-400">키워드 발굴부터 고품질 장문 포스팅까지 한 번에.</p>
                        </div>
                    </div>

                    {/* Step Indicators */}
                    <div className="flex items-center gap-2 mb-12">
                        <StepBadge active={step === "topic"} done={step !== "topic"} num={1} label="Topic" />
                        <div className="h-px w-8 bg-gray-200" />
                        <StepBadge active={step === "keyword"} done={step === "writing" || step === "finish"} num={2} label="Keywords" />
                        <div className="h-px w-8 bg-gray-200" />
                        <StepBadge active={step === "writing"} done={step === "finish"} num={3} label="AI Writing" />
                        <div className="h-px w-8 bg-gray-200" />
                        <StepBadge active={step === "finish"} done={false} num={4} label="Publish" />
                    </div>

                    {/* Step 1: Topic Input */}
                    {step === "topic" && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-5">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">쓰고 싶은 주제나 서비스명을 입력하세요</label>
                                <div className="flex gap-3">
                                    <Input
                                        placeholder="예: Medicare Advantage, New York Health Insurance..."
                                        className="h-14 text-lg rounded-2xl border-gray-200 dark:border-zinc-800 px-6 focus:ring-blue-500"
                                        value={topic}
                                        onChange={(e) => setTopic(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleFindKeywords()}
                                    />
                                    <Button
                                        size="lg"
                                        className="h-14 px-8 rounded-2xl bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-500/20"
                                        onClick={handleFindKeywords}
                                        disabled={loading || !topic}
                                    >
                                        {loading ? <Loader2 className="animate-spin" /> : "키워드 발굴 시동"}
                                    </Button>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                                {['Medicare', 'Senior Life', 'NYC Travel', 'Tax Guide'].map(s => (
                                    <button
                                        key={s}
                                        onClick={() => setTopic(s)}
                                        className="px-4 py-3 rounded-xl border border-gray-100 dark:border-zinc-800 text-sm font-medium hover:border-blue-500 hover:text-blue-600 transition-all text-gray-500"
                                    >
                                        #{s}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 2: Keyword Selection */}
                    {step === "keyword" && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5">
                            <div className="grid md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-2 h-6 bg-blue-500 rounded-full" />
                                        <h3 className="font-bold">메인 타겟 키워드</h3>
                                    </div>
                                    <div className="space-y-2">
                                        {keywords.map((kw, i) => (
                                            <div
                                                key={i}
                                                onClick={() => handleSelectKeyword(kw)}
                                                className={`p-4 rounded-xl border transition-all cursor-pointer flex justify-between items-center ${selectedKeyword === kw.phrase ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10' : 'border-gray-100 dark:border-zinc-800 hover:border-gray-300'}`}
                                            >
                                                <span className="font-medium">{kw.phrase}</span>
                                                <Badge variant="secondary">Score {kw.score}</Badge>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-2 h-6 bg-purple-500 rounded-full" />
                                        <h3 className="font-bold">추천 롱테일 조합</h3>
                                    </div>
                                    {selectedKeyword ? (
                                        <div className="space-y-2">
                                            {longTails.map((lt, i) => (
                                                <div
                                                    key={i}
                                                    onClick={() => setSelectedLongTail(lt.phrase)}
                                                    className={`p-4 rounded-xl border transition-all cursor-pointer flex justify-between items-center ${selectedLongTail === lt.phrase ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/10' : 'border-gray-100 dark:border-zinc-800 hover:border-gray-300'}`}
                                                >
                                                    <span className="font-medium">{lt.phrase}</span>
                                                    <span className="text-xs text-gray-400">Snippet {lt.score}%</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="h-40 flex items-center justify-center border border-dashed rounded-xl text-gray-400 text-sm">
                                            좌측에서 키워드를 먼저 선택하세요
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Logic Settings */}
                            <div className="bg-gray-50 dark:bg-zinc-800/50 p-6 rounded-3xl space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Settings2 className="w-5 h-5 text-gray-700" />
                                        <h4 className="font-bold text-gray-900">AI 집필 보드 모드 선택</h4>
                                    </div>
                                    <Badge variant="outline" className="bg-white text-blue-600 border-blue-100">Recommended</Badge>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {[
                                        { id: '3.0', label: 'Gemini 3.0 Only', desc: '논리 & 품질 우선', color: 'blue' },
                                        { id: 'hybrid', label: 'Hybrid Mode', desc: '3.0 목차 + 2.5 풍부하게', color: 'purple' },
                                        { id: '2.5', label: 'Gemini 2.5 Only', desc: '토큰 효율 & 속도 우선', color: 'indigo' },
                                    ].map((m) => (
                                        <button
                                            key={m.id}
                                            onClick={() => setGenerationMode(m.id as any)}
                                            className={`p-4 rounded-2xl border-2 transition-all text-left space-y-1 ${generationMode === m.id
                                                ? `border-${m.color}-500 bg-${m.color}-50 dark:bg-${m.color}-900/20`
                                                : 'border-white dark:border-zinc-900 hover:border-gray-200 bg-white dark:bg-zinc-900 shadow-sm'
                                                }`}
                                        >
                                            <div className={`text-sm font-bold ${generationMode === m.id ? `text-${m.color}-700 dark:text-${m.color}-300` : 'text-gray-900'}`}>{m.label}</div>
                                            <div className="text-[11px] text-gray-500 font-medium">{m.desc}</div>
                                        </button>
                                    ))}
                                </div>
                                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 pt-2">
                                    <div className="flex items-center gap-1"><Zap className="w-3 h-3 text-orange-500" /> Temp 0.7</div>
                                    <div className="flex items-center gap-1"><FileText className="w-3 h-3 text-blue-500" /> Max Tokens 8192</div>
                                    <div className="flex items-center gap-1"><Globe className="w-3 h-3 text-green-500" /> NYC Expert Persona</div>
                                </div>
                            </div>

                            <Button
                                size="lg"
                                className="w-full h-16 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-lg font-bold shadow-xl shadow-blue-500/30"
                                onClick={handleStartWriting}
                                disabled={!selectedKeyword}
                            >
                                AI 글쓰기 시작 (2,200단어 프리미엄 모드)
                            </Button>
                        </div>
                    )}

                    {/* Step 3: Writing Progress */}
                    {step === "writing" && (
                        <div className="py-20 flex flex-col items-center justify-center space-y-6 animate-in fade-in">
                            <div className="relative">
                                <RotateCcw className="w-20 h-20 text-blue-600 animate-spin" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <PenTool className="w-8 h-8 text-blue-600" />
                                </div>
                            </div>
                            <div className="text-center">
                                <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                                    AI가 목차를 구성하고 내용을 채우는 중입니다...
                                </h3>
                                <p className="text-gray-500 mt-2">약 30~60초 소요됩니다. 뒤로 가지 마세요.</p>
                            </div>
                            <div className="w-full max-w-sm">
                                <Progress value={45} className="h-2" />
                                <div className="flex justify-between text-[10px] text-gray-400 mt-2 font-mono">
                                    <span>OUTLINE GEN (3.0 FLASH)</span>
                                    <span>DONE</span>
                                </div>
                                <div className="flex justify-between text-[10px] text-gray-400 mt-1 font-mono">
                                    <span>CONTENT WEAVE (2.5 FLASH)</span>
                                    <span className="animate-pulse">IN PROGRESS...</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Finish & Publish */}
                    {step === "finish" && generatedContent && (
                        <div className="space-y-10 animate-in zoom-in-95 duration-500">
                            {/* Generation Success Banner */}
                            <div className="bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 rounded-3xl p-6 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center text-white">
                                        <CheckCircle2 className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-green-900 dark:text-green-100">프리미엄 원고 생성 완료!</h3>
                                        <p className="text-sm text-green-700 dark:text-green-300">약 {generatedContent.wordCount}단어의 SEO 최적화 콘텐츠입니다.</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="outline" onClick={handleCopyImagePrompt} className="rounded-xl flex gap-2">
                                        <ImageIcon className="w-4 h-4" /> 이미지 프롬프트 복사
                                    </Button>
                                    <Button variant="secondary" onClick={() => setStep("topic")} className="rounded-xl">처음부터 다시</Button>
                                </div>
                            </div>

                            {/* Two Column Layout: Editor & Thumbnail */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <div className="lg:col-span-2">
                                    <WordPressPublisher
                                        initialHtmlContent={generatedContent.content}
                                        focusKeyword={selectedLongTail || selectedKeyword}
                                        defaultBodyImage={rawImageFile}
                                        getFeaturedImage={async () => {
                                            if (thumbnailRef.current?.getThumbnailBlob) {
                                                return await thumbnailRef.current.getThumbnailBlob();
                                            }
                                            return null;
                                        }}
                                    />
                                </div>
                                <div className="lg:col-span-1 space-y-6">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Workflow className="w-5 h-5 text-blue-600" />
                                        <h3 className="font-bold text-gray-900">Thumbnail Creator</h3>
                                    </div>
                                    <ThumbnailGenerator
                                        ref={thumbnailRef}
                                        defaultTitle={selectedLongTail || selectedKeyword || "Your Blog Title"}
                                        onRawImageChange={setRawImageFile}
                                    />
                                    {/* Action Shortcuts */}
                                    <Card className="p-4 border-dashed border-gray-200">
                                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">External Links</h4>
                                        <div className="grid grid-cols-2 gap-2">
                                            <Button variant="outline" size="sm" onClick={() => window.open('https://labs.google/fx/ko/tools/flow/project/743f991d-0bc5-449d-9d3c-fea44b52856f', '_blank')} className="text-xs">
                                                <ExternalLink className="w-3 h-3 mr-1" /> Flux Flow
                                            </Button>
                                            <Button variant="outline" size="sm" onClick={() => window.open('https://gemini.google.com/app', '_blank')} className="text-xs">
                                                <Zap className="w-3 h-3 mr-1" /> Gemini
                                            </Button>
                                        </div>
                                    </Card>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
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
