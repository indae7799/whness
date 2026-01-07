"use client"

import { useState, useEffect } from "react"
import { Loader2, Zap, Calendar, Trash2, Bookmark } from "lucide-react"
import { format } from "date-fns"

export function DraftsManager({ onRestore, onRefreshNeeded }: { onRestore: (draft: any) => void, onRefreshNeeded?: (refresh: () => void) => void }) {
    const [drafts, setDrafts] = useState<any[]>([]);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isBatchRunning, setIsBatchRunning] = useState(false);
    const [scheduleDate, setScheduleDate] = useState<string>(""); // ISO String-ish
    const [logs, setLogs] = useState<string[]>([]);

    useEffect(() => {
        loadDrafts();
        onRefreshNeeded?.(loadDrafts); // Pass refresh function to parent
    }, []);

    const loadDrafts = async () => {
        try {
            const res = await fetch("/api/articles/draft");
            const data = await res.json();
            if (data.drafts) setDrafts(data.drafts);
        } catch (e) {
            console.error("Failed to load drafts", e);
        }
    }

    const toggleSelect = (id: string) => {
        const next = new Set(selectedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedIds(next);
    }

    const handleDelete = async (id?: string) => {
        const targetIds = id ? [id] : Array.from(selectedIds);
        if (targetIds.length === 0) return;

        if (!confirm(`정말로 ${targetIds.length === 1 ? '이 글감을' : '선택한 ' + targetIds.length + '개의 글감을'} 삭제하시겠습니까?`)) return;

        try {
            const res = await fetch(`/api/articles/draft?${id ? `id=${id}` : `ids=${targetIds.join(',')}`}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                // Success
                setDrafts(prev => prev.filter(d => !targetIds.includes(d.id)));
                if (!id) setSelectedIds(new Set());
                else {
                    const next = new Set(selectedIds);
                    next.delete(id);
                    setSelectedIds(next);
                }
            } else {
                alert("삭제 실패");
            }
        } catch (e) {
            console.error(e);
            alert("삭제 중 에러 발생");
        }
    }

    const runBatch = async () => {
        if (selectedIds.size === 0) return alert("선택된 글감이 없습니다.");
        if (isBatchRunning) return;

        setIsBatchRunning(true);
        setLogs(["🚀 배치 작업 시작..."]);

        // Sort items by selections (preserving order? or date?)
        // Let's iterate drafts in order they appear to keep sequence
        const queue = drafts.filter(d => selectedIds.has(d.id));

        for (let i = 0; i < queue.length; i++) {
            const draft = queue[i];
            setLogs(prev => [...prev, `[${i + 1}/${queue.length}] '${draft.title}' 처리 중...`]);

            // 1. Trigger Restore (Loads into main UI)
            await onRestore(draft);

            // Wait a bit for state to sync (React state updates are async)
            await new Promise(r => setTimeout(r, 1000));

            // 2. Perform Publish via API (Simulating the Publisher 'Publish' click)
            // Since the logic is inside WordPressPublisher component, we can't easily click it from here without Ref.
            // REFACTOR: We should strictly move the publish logic to a shared helper or hook. 
            // BUT, for now, we can replicate the publish API call here using the draft data directly.
            // This is actually safer than simulating clicks.

            try {
                // NEW: Upload images separately first, then publish with JSON
                // This avoids Vercel's body size limits

                const uploadImageToWP = async (url: string, type: 'featured' | 'body') => {
                    // Fetch blob from URL
                    const blob = await fetch(url).then(r => r.blob());

                    const formData = new FormData();
                    formData.append("image", blob, `${type}-image.png`);
                    formData.append("type", type);

                    const res = await fetch("/api/wordpress/upload-image", {
                        method: "POST",
                        body: formData
                    });

                    if (!res.ok) {
                        const errData = await res.json();
                        throw new Error(`Image upload failed: ${errData.error || res.status}`);
                    }

                    return await res.json();
                };

                // Find images from draft
                const featured = draft.images.find((img: any) => img.type === 'featured');
                const body = draft.images.find((img: any) => img.type === 'section');

                let featuredMediaId: number | null = null;
                let featuredMediaUrl: string | null = null;
                let bodyMediaUrl: string | null = null;

                // Upload featured image
                if (featured) {
                    setLogs(prev => [...prev, `📸 Uploading featured image...`]);
                    const result = await uploadImageToWP(featured.url, 'featured');
                    featuredMediaId = result.id;
                    featuredMediaUrl = result.url;
                }

                // Upload body image
                if (body) {
                    setLogs(prev => [...prev, `📷 Uploading body image...`]);
                    const result = await uploadImageToWP(body.url, 'body');
                    bodyMediaUrl = result.url;
                }

                // Publish with JSON (small payload)
                const res = await fetch("/api/wordpress/post", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        htmlContent: draft.content,
                        featuredMediaId: featuredMediaId,
                        featuredMediaUrl: featuredMediaUrl,
                        bodyMediaUrl: bodyMediaUrl
                    })
                });

                if (res.ok) {
                    setLogs(prev => [...prev, `✅ '${draft.title}' 발행 성공`]);
                } else {
                    const err = await res.json();
                    setLogs(prev => [...prev, `❌ '${draft.title}' 실패: ${err.error || 'Unknown'}`]);
                }

            } catch (e) {
                setLogs(prev => [...prev, `❌ '${draft.title}' 에러 발생`]);
            }

            // Wait interval if scheduled? (Simulated 5s delay between posts)
            await new Promise(r => setTimeout(r, 5000));
        }

        setLogs(prev => [...prev, "🏁 모든 작업 완료"]);
        setIsBatchRunning(false);
    }

    return (
        <div className="space-y-4 pt-10 border-t border-gray-200 dark:border-zinc-800">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <Bookmark className="w-6 h-6 text-indigo-500" />
                    예약된 글감 (Drafts)
                </h2>
                <div className="flex items-center gap-3">
                    {/* Batch Controls */}
                    <div className="flex items-center gap-2 bg-gray-100 p-1.5 rounded-lg">
                        <Calendar className="w-4 h-4 text-gray-500 ml-2" />
                        <input
                            type="datetime-local"
                            className="bg-transparent text-sm border-none focus:ring-0 w-40"
                            value={scheduleDate}
                            onChange={e => setScheduleDate(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={runBatch}
                        disabled={isBatchRunning || selectedIds.size === 0}
                        className={`text-sm px-4 py-2 rounded-lg font-bold text-white flex items-center gap-2 shadow-sm
                            ${isBatchRunning ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}
                        `}
                    >
                        {isBatchRunning ? <Loader2 className="animate-spin w-4 h-4" /> : <Zap className="w-4 h-4" />}
                        {isBatchRunning ? "발행 중..." : "선택 항목 일괄 발행"}
                    </button>
                    {selectedIds.size > 0 && (
                        <button
                            onClick={() => handleDelete()}
                            className="text-sm px-4 py-2 rounded-lg font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 flex items-center gap-2"
                        >
                            <Trash2 className="w-4 h-4" />
                            선택 삭제
                        </button>
                    )}
                </div>
            </div>

            {logs.length > 0 && (
                <div className="bg-black text-green-400 font-mono text-xs p-3 rounded-lg max-h-32 overflow-y-auto">
                    {logs.map((l, i) => <div key={i}>{l}</div>)}
                </div>
            )}

            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 dark:bg-zinc-800 border-b border-gray-100 dark:border-zinc-700">
                        <tr>
                            <th className="p-4 w-10">
                                <input
                                    type="checkbox"
                                    onChange={(e) => {
                                        if (e.target.checked) setSelectedIds(new Set(drafts.map(d => d.id)));
                                        else setSelectedIds(new Set());
                                    }}
                                    checked={selectedIds.size === drafts.length && drafts.length > 0}
                                />
                            </th>
                            <th className="p-4">제목 (Keyword)</th>
                            <th className="p-4 text-center">이미지</th>
                            <th className="p-4 text-right">작성일</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                        {drafts.map(draft => (
                            <tr key={draft.id} className="hover:bg-gray-50/50 cursor-pointer" onClick={() => onRestore(draft)}>
                                <td className="p-4" onClick={e => e.stopPropagation()}>
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.has(draft.id)}
                                        onChange={() => toggleSelect(draft.id)}
                                    />
                                </td>
                                <td className="p-4 font-medium">{draft.title}</td>
                                <td className="p-4 text-center text-xs text-gray-400">
                                    {draft.images?.length > 0 ? '✅' : '-'}
                                </td>
                                <td className="p-4 text-right text-gray-500">
                                    {format(new Date(draft.createdAt), "MM/dd HH:mm")}
                                </td>
                                <td className="p-4 text-right" onClick={e => e.stopPropagation()}>
                                    <button
                                        onClick={() => handleDelete(draft.id)}
                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {drafts.length === 0 && (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-gray-400">
                                    저장된 글감이 없습니다. 위에서 '예약 저장'을 해보세요.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
