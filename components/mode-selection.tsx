"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Sparkles, PenTool, ArrowRight, Check, Zap, MousePointerClick } from "lucide-react"
import { cn } from "@/lib/utils"

interface ModeSelectionProps {
    onSelectMode: (mode: "manual" | "auto") => void
}

export function ModeSelection({ onSelectMode }: ModeSelectionProps) {
    const [hoveredMode, setHoveredMode] = useState<"manual" | "auto" | null>(null)

    return (
        <div className="w-full max-w-6xl mx-auto py-8 lg:py-16 px-4">
            <div className="text-center mb-16 space-y-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 dark:from-white dark:via-gray-200 dark:to-white pb-2">
                        Choose Your Workflow
                    </h2>
                    <p className="text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto font-medium">
                        콘텐츠 제작 방식을 선택하세요. AI가 당신의 워크플로우를 가속화합니다.
                    </p>
                </motion.div>
            </div>

            <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
                {/* Manual Mode Card */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    onHoverStart={() => setHoveredMode("manual")}
                    onHoverEnd={() => setHoveredMode(null)}
                    onClick={() => onSelectMode("manual")}
                    className={cn(
                        "relative group cursor-pointer rounded-[2rem] p-1 transition-all duration-300",
                        "bg-gradient-to-b from-gray-200 to-gray-100 dark:from-zinc-800 dark:to-zinc-900",
                        "hover:shadow-2xl hover:shadow-blue-900/10 dark:hover:shadow-blue-900/20"
                    )}
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-[2rem] blur-xl -z-10" />

                    <div className="h-full bg-white dark:bg-black rounded-[1.8rem] p-8 lg:p-10 relative overflow-hidden">
                        {/* Decorative background blobs */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 dark:bg-blue-900/10 rounded-full blur-3xl -mr-32 -mt-32 transition-transform group-hover:scale-110 duration-500" />

                        <div className="relative z-10 flex flex-col h-full">
                            <div className="mb-8">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/30 mb-6 group-hover:scale-110 transition-transform duration-300">
                                    <PenTool className="text-white w-8 h-8" />
                                </div>
                                <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                    Manual Control
                                </h3>
                                <p className="text-gray-500 dark:text-gray-400 text-lg leading-relaxed">
                                    키워드부터 페르소나까지, 모든 요소를<br />직접 설계하고 제어하고 싶다면.
                                </p>
                            </div>

                            <div className="space-y-4 mb-8 flex-grow">
                                <FeatureItem icon={MousePointerClick} text="키워드 & 소스 직접 선택" />
                                <FeatureItem icon={Zap} text="AI 코파일럿 실시간 보조" />
                                <FeatureItem icon={Check} text="커스텀 페르소나 적용" />
                            </div>

                            <button className="w-full py-4 rounded-xl bg-gray-50 dark:bg-zinc-900 text-gray-900 dark:text-white font-bold text-lg group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 flex items-center justify-center gap-2">
                                수동 모드 시작
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </div>
                </motion.div>

                {/* Auto Mode Card */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    onHoverStart={() => setHoveredMode("auto")}
                    onHoverEnd={() => setHoveredMode(null)}
                    onClick={() => onSelectMode("auto")}
                    className={cn(
                        "relative group cursor-pointer rounded-[2rem] p-1 transition-all duration-300",
                        "bg-gradient-to-b from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30",
                        "hover:shadow-2xl hover:shadow-purple-900/20"
                    )}
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-[2rem] blur-xl -z-10" />

                    <div className="h-full bg-white dark:bg-black rounded-[1.8rem] p-8 lg:p-10 relative overflow-hidden">
                        {/* Decorative background blobs */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-50 dark:bg-purple-900/10 rounded-full blur-3xl -mr-32 -mt-32 transition-transform group-hover:scale-110 duration-500" />
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-pink-50 dark:bg-pink-900/10 rounded-full blur-3xl -ml-24 -mb-24 transition-transform group-hover:scale-110 duration-500" />

                        <div className="relative z-10 flex flex-col h-full">
                            <div className="mb-8">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30 group-hover:scale-110 transition-transform duration-300">
                                        <Sparkles className="text-white w-8 h-8 animate-pulse" />
                                    </div>
                                    <span className="px-4 py-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs font-bold tracking-wider uppercase shadow-lg shadow-indigo-500/20">
                                        Signature
                                    </span>
                                </div>
                                <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-indigo-600 group-hover:to-pink-600 transition-all">
                                    Full Auto Pilot
                                </h3>
                                <p className="text-gray-500 dark:text-gray-400 text-lg leading-relaxed">
                                    설정 한 번으로 리서치부터 발행까지.<br />AI가 24시간 블로그를 운영합니다.
                                </p>
                            </div>

                            <div className="space-y-4 mb-8 flex-grow">
                                <FeatureItem icon={Zap} text="ZERO 클릭 완전 자동화" />
                                <FeatureItem icon={Sparkles} text="DALL-E 3 이미지 자동 생성" />
                                <FeatureItem icon={Check} text="스케줄링 & 배치 발행" />
                            </div>

                            <button className="w-full py-4 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-black font-bold text-lg group-hover:bg-gradient-to-r group-hover:from-indigo-600 group-hover:to-pink-600 group-hover:text-white group-hover:border-transparent transition-all duration-300 flex items-center justify-center gap-2 shadow-lg group-hover:shadow-indigo-500/25">
                                자동화 모드 시작
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    )
}

function FeatureItem({ icon: Icon, text }: { icon: any, text: string }) {
    return (
        <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
            <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                <Icon className="w-3.5 h-3.5" />
            </div>
            <span className="font-medium">{text}</span>
        </div>
    )
}
