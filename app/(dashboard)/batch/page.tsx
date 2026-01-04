"use client"

import { useState } from "react"
import { Upload, Play, Pause, FileText, CheckCircle, XCircle, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface BatchJob {
    id: string
    keyword: string
    status: "pending" | "processing" | "completed" | "failed"
    progress: number
}

export default function BatchPage() {
    const [keywords, setKeywords] = useState("")
    const [jobs, setJobs] = useState<BatchJob[]>([])
    const [isRunning, setIsRunning] = useState(false)

    const handleStartBatch = async () => {
        const keywordList = keywords.split("\n").filter(k => k.trim())
        if (keywordList.length === 0) {
            alert("키워드를 입력해주세요.")
            return
        }

        const newJobs: BatchJob[] = keywordList.map((kw, i) => ({
            id: `batch-${Date.now()}-${i}`,
            keyword: kw.trim(),
            status: "pending",
            progress: 0
        }))

        setJobs(newJobs)
        setIsRunning(true)

        // Simulate batch processing
        for (let i = 0; i < newJobs.length; i++) {
            setJobs(prev => prev.map((job, idx) =>
                idx === i ? { ...job, status: "processing" } : job
            ))

            // Simulate processing time
            await new Promise(resolve => setTimeout(resolve, 2000))

            setJobs(prev => prev.map((job, idx) =>
                idx === i ? { ...job, status: "completed", progress: 100 } : job
            ))
        }

        setIsRunning(false)
    }

    const getStatusIcon = (status: BatchJob["status"]) => {
        switch (status) {
            case "pending": return <Clock className="text-gray-400" size={18} />
            case "processing": return <div className="animate-spin"><Clock className="text-blue-600" size={18} /></div>
            case "completed": return <CheckCircle className="text-green-600" size={18} />
            case "failed": return <XCircle className="text-red-600" size={18} />
        }
    }

    return (
        <div className="space-y-8 max-w-4xl mx-auto py-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-50 flex items-center gap-3">
                    <FileText className="text-orange-600" />
                    일괄 처리 (Batch Processing)
                </h1>
                <p className="mt-2 text-gray-500 dark:text-gray-400">
                    여러 키워드를 한 번에 입력하여 대량의 콘텐츠를 생성합니다.
                </p>
            </div>

            {/* Input Section */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-black">
                <h3 className="font-semibold text-lg mb-4">키워드 입력</h3>
                <p className="text-sm text-gray-500 mb-4">한 줄에 하나의 키워드를 입력하세요.</p>

                <textarea
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                    placeholder="예:
medicare advantage plans 2025
best health insurance for seniors
how to apply for medicaid"
                    className="w-full h-40 p-3 rounded-lg border border-gray-200 resize-none dark:border-zinc-700 dark:bg-zinc-900"
                    disabled={isRunning}
                />

                <div className="mt-4 flex items-center justify-between">
                    <p className="text-sm text-gray-400">
                        {keywords.split("\n").filter(k => k.trim()).length}개 키워드
                    </p>
                    <Button onClick={handleStartBatch} disabled={isRunning}>
                        {isRunning ? (
                            <><Pause size={18} className="mr-2" /> 처리 중...</>
                        ) : (
                            <><Play size={18} className="mr-2" /> 일괄 생성 시작</>
                        )}
                    </Button>
                </div>
            </div>

            {/* Job Queue */}
            {jobs.length > 0 && (
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-black">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-lg">처리 현황</h3>
                        <span className="text-sm text-gray-500">
                            {jobs.filter(j => j.status === "completed").length} / {jobs.length} 완료
                        </span>
                    </div>

                    <div className="space-y-3">
                        {jobs.map((job) => (
                            <div
                                key={job.id}
                                className={`flex items-center justify-between p-4 rounded-lg ${job.status === "processing" ? "bg-blue-50 dark:bg-blue-900/20" :
                                        job.status === "completed" ? "bg-green-50 dark:bg-green-900/20" :
                                            job.status === "failed" ? "bg-red-50 dark:bg-red-900/20" :
                                                "bg-gray-50 dark:bg-zinc-900"
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    {getStatusIcon(job.status)}
                                    <span className="font-medium">{job.keyword}</span>
                                </div>
                                <span className={`text-sm ${job.status === "completed" ? "text-green-600" :
                                        job.status === "failed" ? "text-red-600" :
                                            job.status === "processing" ? "text-blue-600" :
                                                "text-gray-500"
                                    }`}>
                                    {job.status === "pending" && "대기 중"}
                                    {job.status === "processing" && "생성 중..."}
                                    {job.status === "completed" && "완료"}
                                    {job.status === "failed" && "실패"}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
