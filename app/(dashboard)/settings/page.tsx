"use client"

import { useState } from "react"
import { Save, Globe, Key, Server, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function SettingsPage() {
    const [isSaving, setIsSaving] = useState(false)
    const [saveSuccess, setSaveSuccess] = useState(false)

    const [wpSettings, setWpSettings] = useState({
        baseUrl: "",
        username: "",
        appPassword: ""
    })

    const [aiSettings, setAiSettings] = useState({
        openaiKey: "",
        model: "gpt-4o"
    })

    const handleSave = async () => {
        setIsSaving(true)
        // In production, this would save to database or encrypted storage
        // For now, just simulate save
        await new Promise(resolve => setTimeout(resolve, 1000))
        setSaveSuccess(true)
        setIsSaving(false)
        setTimeout(() => setSaveSuccess(false), 3000)
    }

    return (
        <div className="space-y-8 max-w-2xl mx-auto py-8">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-50">설정</h1>
                <p className="text-gray-500 dark:text-gray-400">
                    WordPress 연결 및 AI 설정을 관리합니다.
                </p>
            </div>

            {/* WordPress Settings */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-black">
                <h3 className="font-semibold text-lg mb-6 flex items-center gap-2">
                    <Globe size={20} />
                    WordPress 연결
                </h3>

                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium mb-2 block">사이트 URL</label>
                        <Input
                            value={wpSettings.baseUrl}
                            onChange={(e) => setWpSettings({ ...wpSettings, baseUrl: e.target.value })}
                            placeholder="https://your-site.com"
                        />
                        <p className="text-xs text-gray-400 mt-1">WordPress 사이트 주소 (https:// 포함)</p>
                    </div>

                    <div>
                        <label className="text-sm font-medium mb-2 block">사용자명</label>
                        <Input
                            value={wpSettings.username}
                            onChange={(e) => setWpSettings({ ...wpSettings, username: e.target.value })}
                            placeholder="admin"
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium mb-2 block">애플리케이션 비밀번호</label>
                        <Input
                            type="password"
                            value={wpSettings.appPassword}
                            onChange={(e) => setWpSettings({ ...wpSettings, appPassword: e.target.value })}
                            placeholder="xxxx xxxx xxxx xxxx xxxx xxxx"
                        />
                        <p className="text-xs text-gray-400 mt-1">
                            WordPress 관리자 → 사용자 → 애플리케이션 비밀번호에서 생성
                        </p>
                    </div>
                </div>
            </div>

            {/* AI Settings */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-black">
                <h3 className="font-semibold text-lg mb-6 flex items-center gap-2">
                    <Key size={20} />
                    AI 설정
                </h3>

                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium mb-2 block">OpenAI API Key</label>
                        <Input
                            type="password"
                            value={aiSettings.openaiKey}
                            onChange={(e) => setAiSettings({ ...aiSettings, openaiKey: e.target.value })}
                            placeholder="sk-..."
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium mb-2 block">모델</label>
                        <select
                            className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                            value={aiSettings.model}
                            onChange={(e) => setAiSettings({ ...aiSettings, model: e.target.value })}
                        >
                            <option value="gpt-4o">GPT-4o (추천)</option>
                            <option value="gpt-4-turbo">GPT-4 Turbo</option>
                            <option value="gpt-3.5-turbo">GPT-3.5 Turbo (저렴)</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end gap-4">
                {saveSuccess && (
                    <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle size={18} />
                        저장되었습니다
                    </div>
                )}
                <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? "저장 중..." : <><Save size={18} className="mr-2" /> 설정 저장</>}
                </Button>
            </div>
        </div>
    )
}
