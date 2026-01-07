"use client"

import { useState } from "react"
import { Check, CheckCircle2, FlaskConical, LayoutGrid, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SUPER_CATEGORIES, getSeedsBySuperCategory, Seed } from "@/lib/research/defaultSeeds"

interface SeedSelectorProps {
    mode: 'auto' | 'manual'
    onModeChange: (mode: 'auto' | 'manual') => void
    onSeedsSelected: (seeds: Seed[]) => void
}

export function SeedSelector({ mode, onModeChange, onSeedsSelected }: SeedSelectorProps) {
    const [selectedSuperCats, setSelectedSuperCats] = useState<string[]>([])
    const [selectedSeeds, setSelectedSeeds] = useState<Seed[]>([])
    const [isExpanded, setIsExpanded] = useState(false)

    // 대분류 선택/해제 (전체 시드 포함)
    const handleSuperCatToggle = (superId: string) => {
        let newSuperCats = [...selectedSuperCats]
        let newSeeds = [...selectedSeeds]
        const seedsInCat = getSeedsBySuperCategory(superId)

        if (selectedSuperCats.includes(superId)) {
            // 제거
            newSuperCats = newSuperCats.filter(id => id !== superId)
            newSeeds = newSeeds.filter(s => !seedsInCat.some(sc => sc.term === s.term))
        } else {
            // 추가
            newSuperCats.push(superId)
            // 중복 방지하며 추가
            const existingTerms = new Set(newSeeds.map(s => s.term))
            const seedsToAdd = seedsInCat.filter(s => !existingTerms.has(s.term))
            newSeeds = [...newSeeds, ...seedsToAdd]
        }

        setSelectedSuperCats(newSuperCats)
        setSelectedSeeds(newSeeds)
        onSeedsSelected(newSeeds)
    }

    // 개별 시드 토글
    const handleSeedToggle = (seed: Seed) => {
        const exists = selectedSeeds.some(s => s.term === seed.term)
        let newSeeds = []

        if (exists) {
            newSeeds = selectedSeeds.filter(s => s.term !== seed.term)
        } else {
            newSeeds = [...selectedSeeds, seed]
        }

        setSelectedSeeds(newSeeds)
        onSeedsSelected(newSeeds)
    }

    const resetSelection = () => {
        setSelectedSuperCats([])
        setSelectedSeeds([])
        onSeedsSelected([])
    }

    return (
        <div className="space-y-6">

            {/* Manual Mode UI */}
            {mode === 'manual' && (
                <div className="animate-in fade-in slide-in-from-bottom-2 space-y-6">
                    {/* Super Categories Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {SUPER_CATEGORIES.map((cat) => {
                            const isSelected = selectedSuperCats.includes(cat.id)
                            const seedCount = getSeedsBySuperCategory(cat.id).length

                            return (
                                <button
                                    key={cat.id}
                                    onClick={() => handleSuperCatToggle(cat.id)}
                                    className={`relative p-4 rounded-2xl border-2 text-left transition-all hover:scale-[1.02] active:scale-95 ${isSelected
                                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/10'
                                        : 'border-gray-200 dark:border-zinc-800 hover:border-purple-200 bg-white dark:bg-zinc-900'
                                        }`}
                                >
                                    {isSelected && (
                                        <div className="absolute top-3 right-3 text-purple-600">
                                            <CheckCircle2 className="w-5 h-5 fill-purple-100" />
                                        </div>
                                    )}
                                    <div className="text-xs font-bold text-gray-400 mb-1">{cat.ko}</div>
                                    <div className={`font-bold ${isSelected ? 'text-purple-700 dark:text-purple-300' : 'text-gray-900 dark:text-gray-100'}`}>
                                        {cat.label}
                                    </div>
                                    <div className="mt-2 text-[10px] text-gray-500 flex gap-1">
                                        <Badge variant="secondary" className="h-5 px-1.5 bg-gray-100 dark:bg-zinc-800">
                                            {seedCount} seeds
                                        </Badge>
                                    </div>
                                </button>
                            )
                        })}
                    </div>

                    {/* Selection Summary & Preview */}
                    {selectedSeeds.length > 0 ? (
                        <Card className="p-5 border-purple-100 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold">
                                        {selectedSeeds.length}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-sm">선택된 시드 키워드</h4>
                                        <p className="text-xs text-gray-500">이 키워드들을 기반으로 분석이 시작됩니다.</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="ghost" size="sm" onClick={() => setIsExpanded(!isExpanded)} className="text-xs">
                                        {isExpanded ? "접기" : "자세히 보기"}
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={resetSelection} className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50">
                                        <RotateCcw className="w-3 h-3 mr-1" /> 초기화
                                    </Button>
                                </div>
                            </div>

                            {isExpanded && (
                                <div className="h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {selectedSeeds.map((seed, i) => (
                                            <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-zinc-800/50 border border-transparent hover:border-purple-200 group">
                                                <div className="flex items-center gap-2 overflow-hidden">
                                                    <Badge variant="outline" className="text-[10px] shrink-0 w-16 justify-center">
                                                        {seed.category}
                                                    </Badge>
                                                    <span className="text-sm truncate">{seed.term}</span>
                                                </div>
                                                <button onClick={() => handleSeedToggle(seed)} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 p-1">
                                                    <Check className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </Card>
                    ) : (
                        <div className="text-center py-8 text-gray-400 text-sm border-2 border-dashed border-gray-100 rounded-2xl">
                            위 카테고리를 선택하여 분석할 시드를 추가하세요.
                        </div>
                    )}
                </div>
            )}

            {mode === 'auto' && (
                <div className="text-center py-6 text-gray-500 text-sm bg-gray-50 dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800">
                    <p>가중치 기반으로 최적의 시드를 <span className="font-bold text-blue-600">자동 선택</span>합니다.</p>
                    <p className="text-xs mt-1 text-gray-400">Evergreen 3개 + Trending 2개 자동 조합</p>
                </div>
            )}
        </div>
    )
}
