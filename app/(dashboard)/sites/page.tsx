"use client"

import { useState } from "react"
import { Globe, Plus, Trash2, Check, ExternalLink, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface Site {
    id: string
    name: string
    url: string
    isConnected: boolean
    postsCount: number
}

export default function SitesPage() {
    const [sites, setSites] = useState<Site[]>([
        {
            id: "1",
            name: "Whness",
            url: "https://www.whness.com",
            isConnected: true,
            postsCount: 0
        }
    ])

    const [showAddForm, setShowAddForm] = useState(false)
    const [newSite, setNewSite] = useState({ name: "", url: "", username: "", appPassword: "" })

    const handleAddSite = () => {
        if (!newSite.url) return

        setSites([...sites, {
            id: Date.now().toString(),
            name: newSite.name || new URL(newSite.url).hostname,
            url: newSite.url,
            isConnected: false,
            postsCount: 0
        }])

        setNewSite({ name: "", url: "", username: "", appPassword: "" })
        setShowAddForm(false)
    }

    const handleRemoveSite = (id: string) => {
        if (confirm("이 사이트를 정말 삭제하시겠습니까?")) {
            setSites(sites.filter(s => s.id !== id))
        }
    }

    return (
        <div className="space-y-8 max-w-4xl mx-auto py-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-50 flex items-center gap-3">
                        <Globe className="text-blue-600" />
                        사이트 관리
                    </h1>
                    <p className="mt-2 text-gray-500 dark:text-gray-400">
                        여러 WordPress 사이트를 연결하고 관리합니다.
                    </p>
                </div>

                <Button onClick={() => setShowAddForm(true)}>
                    <Plus size={18} className="mr-2" /> 사이트 추가
                </Button>
            </div>

            {/* Add Site Form */}
            {showAddForm && (
                <div className="rounded-xl border border-blue-200 bg-blue-50 p-6 dark:border-blue-800 dark:bg-blue-900/20">
                    <h3 className="font-semibold text-lg mb-4">새 사이트 추가</h3>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <label className="text-sm font-medium mb-2 block">사이트 이름</label>
                            <Input
                                value={newSite.name}
                                onChange={(e) => setNewSite({ ...newSite, name: e.target.value })}
                                placeholder="내 블로그"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-2 block">사이트 URL</label>
                            <Input
                                value={newSite.url}
                                onChange={(e) => setNewSite({ ...newSite, url: e.target.value })}
                                placeholder="https://example.com"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-2 block">WordPress 사용자명</label>
                            <Input
                                value={newSite.username}
                                onChange={(e) => setNewSite({ ...newSite, username: e.target.value })}
                                placeholder="admin"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-2 block">애플리케이션 비밀번호</label>
                            <Input
                                type="password"
                                value={newSite.appPassword}
                                onChange={(e) => setNewSite({ ...newSite, appPassword: e.target.value })}
                                placeholder="xxxx xxxx xxxx"
                            />
                        </div>
                    </div>
                    <div className="mt-4 flex gap-2">
                        <Button onClick={handleAddSite}>추가</Button>
                        <Button variant="outline" onClick={() => setShowAddForm(false)}>취소</Button>
                    </div>
                </div>
            )}

            {/* Sites List */}
            <div className="space-y-4">
                {sites.map((site) => (
                    <div
                        key={site.id}
                        className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-black"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className={`h-12 w-12 rounded-full flex items-center justify-center ${site.isConnected
                                        ? "bg-green-100 text-green-600 dark:bg-green-900/30"
                                        : "bg-gray-100 text-gray-400 dark:bg-zinc-800"
                                    }`}>
                                    <Globe size={24} />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg flex items-center gap-2">
                                        {site.name}
                                        {site.isConnected && <Check className="text-green-600" size={18} />}
                                    </h3>
                                    <a
                                        href={site.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                                    >
                                        {site.url} <ExternalLink size={14} />
                                    </a>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="text-right">
                                    <p className="text-2xl font-bold">{site.postsCount}</p>
                                    <p className="text-xs text-gray-400">발행된 글</p>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm">
                                        <Settings size={16} />
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => handleRemoveSite(site.id)}>
                                        <Trash2 size={16} className="text-red-500" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {sites.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                    <Globe size={48} className="mx-auto mb-4 opacity-50" />
                    <p>연결된 사이트가 없습니다.</p>
                    <p className="text-sm mt-2">위의 "사이트 추가" 버튼을 눌러 WordPress 사이트를 연결하세요.</p>
                </div>
            )}
        </div>
    )
}
