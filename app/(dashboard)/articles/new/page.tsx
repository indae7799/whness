"use client"

import { useState } from "react"
import SeedInputForm from "@/components/seed-input-form"
import KeywordRecommendations, { KeywordData } from "@/components/keyword-recommendations"
import ContentGenerationProgress from "@/components/content-generation-progress"
import { ModeSelection } from "@/components/mode-selection"
import { AutoModeSettings } from "@/components/auto-mode-settings"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function NewArticlePage() {
    // Top level state: mode selection
    const [mode, setMode] = useState<"manual" | "auto" | null>(null)

    // Manual mode steps
    const [step, setStep] = useState<"input" | "selection" | "generating">("input")
    const [researchResults, setResearchResults] = useState<KeywordData[]>([])
    const [selectedKeyword, setSelectedKeyword] = useState<KeywordData | null>(null)

    const handleResearchComplete = (results: KeywordData[]) => {
        setResearchResults(results)
        setStep("selection")
    }

    const handleKeywordSelect = (keyword: KeywordData) => {
        setSelectedKeyword(keyword)
        setStep("generating")
    }

    // Reset everything
    const handleBackToModeSelection = () => {
        setMode(null)
        setStep("input")
        setResearchResults([])
        setSelectedKeyword(null)
    }

    // Wrap in a container that allows the design to breathe
    return (
        <div className="min-h-screen bg-transparent">
            {/* Mode Selection Screen - Full centered */}
            {!mode && (
                <div className="flex flex-col items-center justify-center min-h-[85vh] animate-in fade-in duration-500">
                    <ModeSelection onSelectMode={setMode} />
                </div>
            )}

            {/* Selected Mode Experience */}
            {mode && (
                <div className="w-full max-w-6xl mx-auto py-8 px-4 animate-in slide-in-from-bottom-8 duration-500">
                    {/* Minimal Header */}
                    <div className="mb-8 flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleBackToModeSelection}
                            className="bg-white/50 backdrop-blur-sm dark:bg-black/50 hover:bg-white dark:hover:bg-zinc-800 border border-gray-200 dark:border-zinc-800 rounded-full px-4"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            다른 모드 선택
                        </Button>
                    </div>

                    {mode === "auto" && (
                        <div className="w-full">
                            <AutoModeSettings />
                        </div>
                    )}

                    {mode === "manual" && (
                        <div className="space-y-8 max-w-4xl mx-auto">
                            <div className="space-y-2 text-center sm:text-left mb-12">
                                <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-50 mb-2">
                                    {step === "input" && "Manual Setup"}
                                    {step === "selection" && "Keyword Selection"}
                                    {step === "generating" && "Content Generation"}
                                </h1>
                                <p className="text-lg text-gray-500 dark:text-gray-400">
                                    {step === "input" && "전문적인 분석을 위한 시드 키워드를 입력해주세요."}
                                    {step === "selection" && "AI가 발견한 기회 키워드들입니다. 가장 적합한 것을 선택하세요."}
                                    {step === "generating" && "프리미엄 콘텐츠를 생성하고 있습니다. 잠시만 기다려주세요."}
                                </p>
                            </div>

                            {step === "input" && (
                                <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 border border-gray-100 dark:border-zinc-800 shadow-xl shadow-gray-200/50 dark:shadow-none">
                                    <SeedInputForm onResearchComplete={handleResearchComplete} />
                                </div>
                            )}

                            {step === "selection" && (
                                <div className="max-w-3xl mx-auto">
                                    <KeywordRecommendations
                                        keywords={researchResults}
                                        onSelect={handleKeywordSelect}
                                    />
                                </div>
                            )}

                            {step === "generating" && selectedKeyword && (
                                <ContentGenerationProgress keyword={selectedKeyword} />
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
