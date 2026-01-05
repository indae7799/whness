
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
            const saved = localStorage.getItem('gemini_quotas')
            if (saved) {
                setQuotas(JSON.parse(saved))
            } else {
                const initial = [
                    {
                        modelId: 'google/gemini-3.0-flash:free',
                        name: 'Gemini 3.0 Flash',
                        rpdUsed: 12,
                        rpdTotal: 1500,
                        tpmUsed: 45000,
                        tpmTotal: 1000000,
                        resetTime: '09:00 AM (KST)'
                    },
                    {
                        modelId: 'google/gemini-2.5-flash:free',
                        name: 'Gemini 2.5 Flash',
                        rpdUsed: 5,
                        rpdTotal: 1500,
                        tpmUsed: 12000,
                        tpmTotal: 1000000,
                        resetTime: '09:00 AM (KST)'
                    }
                ]
                setQuotas(initial)
                localStorage.setItem('gemini_quotas', JSON.stringify(initial))
            }
        }
        loadQuotas()

        // Listen for internal events (if any)
        window.addEventListener('storage', loadQuotas)
        return () => window.removeEventListener('storage', loadQuotas)
    }, [])

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {quotas.map((q) => (
                <div key={q.modelId} className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-xl">
                                <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-gray-100">{q.name}</h3>
                                <p className="text-xs text-gray-500">Free Tier Quota (2026)</p>
                            </div>
                        </div>
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            <ShieldCheck className="w-3 h-3 mr-1" /> Active
                        </Badge>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs">
                                <span className="text-gray-500 font-medium flex items-center gap-1">
                                    <Battery className="w-3 h-3" /> Daily Requests (RPD)
                                </span>
                                <span className="text-gray-900 dark:text-gray-100 font-bold">
                                    {q.rpdUsed} / {q.rpdTotal}
                                </span>
                            </div>
                            <Progress value={(q.rpdUsed / q.rpdTotal) * 100} className="h-2 bg-gray-100 dark:bg-zinc-800" />
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between text-xs">
                                <span className="text-gray-500 font-medium flex items-center gap-1">
                                    <Zap className="w-3 h-3" /> Tokens Per Minute (TPM)
                                </span>
                                <span className="text-gray-900 dark:text-gray-100 font-bold">
                                    {(q.tpmUsed / 1000).toFixed(0)}k / 1M
                                </span>
                            </div>
                            <Progress value={(q.tpmUsed / q.tpmTotal) * 100} className="h-2 bg-gray-100 dark:bg-zinc-800" />
                        </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-zinc-800 flex items-center justify-between">
                        <span className="text-[10px] text-gray-400">Resets At: {q.resetTime}</span>
                        {q.rpdUsed > 1000 && (
                            <span className="text-[10px] text-orange-500 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" /> Warning: Low Limit
                            </span>
                        )}
                    </div>
                </div>
            ))}
        </div>
    )
}
