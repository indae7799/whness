
"use client"

import { useState, useEffect } from "react"
import { Battery, Zap, AlertTriangle, ShieldCheck } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"

interface QuotaInfo {
    modelId: string
    name: string
    rpdUsed: number
    rpdTotal: number
    tpmUsed: number
    tpmTotal: number
    resetTime: string
}

export function ModelQuotaDashboard() {
    const [quotas, setQuotas] = useState<QuotaInfo[]>([])

    useEffect(() => {
        // Sync with local storage or fetch from API
        const loadQuotas = () => {
            const saved = localStorage.getItem('gemini_quotas_v2')
            if (saved) {
                setQuotas(JSON.parse(saved))
            } else {
                const initial = [
                    {
                        modelId: 'google/gemini-3-flash-preview:free',
                        name: 'Gemini 3 Flash Preview',
                        rpdUsed: 12,
                        rpdTotal: 1500,
                        tpmUsed: 45000,
                        tpmTotal: 1000000,
                        resetTime: '09:00 AM (KST)'
                    },
                    {
                        modelId: 'google/gemini-2.0-flash-exp:free',
                        name: 'Gemini 2.0 Flash Exp',
                        rpdUsed: 5,
                        rpdTotal: 1500,
                        tpmUsed: 12000,
                        tpmTotal: 1000000,
                        resetTime: '09:00 AM (KST)'
                    }
                ]
                setQuotas(initial)
                localStorage.setItem('gemini_quotas_v2', JSON.stringify(initial))
            }
        }
        loadQuotas()

        // Listen for internal events (if any)
        window.addEventListener('storage', loadQuotas)
        return () => window.removeEventListener('storage', loadQuotas)
    }, [])

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quotas.map((q) => (
                <div key={q.modelId} className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <Zap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100">{q.name}</h3>
                        </div>
                        <Badge variant="outline" className="text-[10px] bg-green-50 text-green-700 border-green-200 px-1.5 py-0.5">
                            Active
                        </Badge>
                    </div>

                    <div className="space-y-3">
                        <div className="space-y-1">
                            <div className="flex justify-between text-[10px]">
                                <span className="text-gray-500 flex items-center gap-1">
                                    <Battery className="w-3 h-3" /> RPD
                                </span>
                                <span className="text-gray-900 dark:text-gray-100 font-bold">
                                    {q.rpdUsed} / {q.rpdTotal}
                                </span>
                            </div>
                            <Progress value={(q.rpdUsed / q.rpdTotal) * 100} className="h-1.5 bg-gray-100 dark:bg-zinc-800" />
                        </div>

                        <div className="space-y-1">
                            <div className="flex justify-between text-[10px]">
                                <span className="text-gray-500 flex items-center gap-1">
                                    <Zap className="w-3 h-3" /> TPM
                                </span>
                                <span className="text-gray-900 dark:text-gray-100 font-bold">
                                    {(q.tpmUsed / 1000).toFixed(0)}k / 1M
                                </span>
                            </div>
                            <Progress value={(q.tpmUsed / q.tpmTotal) * 100} className="h-1.5 bg-gray-100 dark:bg-zinc-800" />
                        </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-gray-100 dark:border-zinc-800 flex items-center justify-between">
                        <span className="text-[9px] text-gray-400">Resets: {q.resetTime}</span>
                        {q.rpdUsed > 1000 && (
                            <span className="text-[9px] text-orange-500 flex items-center gap-1">
                                <AlertTriangle className="w-2.5 h-2.5" /> Low
                            </span>
                        )}
                    </div>
                </div>
            ))}
        </div>
    )
}
