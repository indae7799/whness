"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Search, Plus, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface SeedInputFormProps {
    onResearchComplete?: (results: any[]) => void
}

const formSchema = z.object({
    seeds: z.array(z.string()).min(1, "최소 1개의 시드 키워드가 필요합니다."),
    sources: z.array(z.string()).min(1, "최소 1개의 소스를 선택해주세요."),
})

export default function SeedInputForm({ onResearchComplete }: SeedInputFormProps) {
    const [seeds, setSeeds] = useState<string[]>([])
    const [currentSeed, setCurrentSeed] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleAddSeed = (e?: React.FormEvent) => {
        e?.preventDefault()
        if (currentSeed.trim() && !seeds.includes(currentSeed.trim())) {
            if (seeds.length >= 5) return
            setSeeds([...seeds, currentSeed.trim()])
            setCurrentSeed("")
        }
    }

    const handleRemoveSeed = (seedToRemove: string) => {
        setSeeds(seeds.filter((s) => s !== seedToRemove))
    }

    const onStartResearch = async () => {
        if (seeds.length === 0) return
        setIsSubmitting(true)

        try {
            const response = await fetch("/api/research", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ seeds, sources: [] }) // sources not yet tracked in state fully
            })

            const data = await response.json()
            console.log("Research Result:", data)

            if (data.keywords && onResearchComplete) {
                onResearchComplete(data.keywords)
            }
            alert("리서치가 완료되었습니다! (콘솔 확인)")
        } catch (error) {
            console.error(error)
            alert("리서치 중 오류가 발생했습니다.")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-black">
            <div className="space-y-6">
                <div>
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-900 dark:text-gray-100">
                        시드 키워드 입력
                    </label>
                    <p className="text-[0.8rem] text-muted-foreground mt-2 text-gray-500">
                        리서치를 시작할 주제나 키워드를 입력하세요. (최대 5개)
                    </p>

                    <div className="mt-3 flex gap-2">
                        <Input
                            value={currentSeed}
                            onChange={(e) => setCurrentSeed(e.target.value)}
                            placeholder="예: 다이어트 식단, 20대 재테크..."
                            onKeyDown={(e) => {
                                if (e.key === "Enter") handleAddSeed()
                            }}
                            className="dark:bg-zinc-900 dark:border-zinc-700"
                        />
                        <Button onClick={handleAddSeed} type="button" variant="secondary">
                            <Plus size={18} />
                            추가
                        </Button>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                        {seeds.map((seed, idx) => (
                            <span
                                key={idx}
                                className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                            >
                                {seed}
                                <button
                                    onClick={() => handleRemoveSeed(seed)}
                                    className="ml-1 rounded-full hover:bg-blue-200 dark:hover:bg-blue-800"
                                >
                                    ×
                                </button>
                            </span>
                        ))}
                        {seeds.length === 0 && (
                            <span className="text-sm text-gray-400">입력된 키워드가 없습니다.</span>
                        )}
                    </div>
                </div>

                <div>
                    <label className="text-sm font-medium leading-none text-gray-900 dark:text-gray-100">
                        리서치 소스 선택
                    </label>
                    <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {["Reddit", "Google Trends", "StackExchange", "Wikipedia"].map((source) => (
                            <div
                                key={source}
                                className="flex items-center space-x-2 rounded-lg border border-gray-200 p-3 dark:border-zinc-800"
                            >
                                <input
                                    type="checkbox"
                                    id={source}
                                    defaultChecked
                                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <label htmlFor={source} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    {source}
                                </label>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="pt-4">
                    <Button
                        className="w-full h-12 text-lg gap-2"
                        onClick={onStartResearch}
                        disabled={seeds.length === 0 || isSubmitting}
                    >
                        {isSubmitting ? (
                            "리서치 진행 중..."
                        ) : (
                            <>
                                <Sparkles size={20} />
                                자동 리서치 시작하기
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    )
}
