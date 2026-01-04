"use client"

import { useState, useEffect } from "react"
import { Send, Image as ImageIcon, CheckCircle2, AlertCircle, UploadCloud, Save as SaveIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"

interface WordPressPublisherProps {
    defaultBodyImage?: File | null;
    getFeaturedImage?: () => Promise<Blob | null>;
    initialHtmlContent?: string;
    initialBodyImageSrc?: string | null;
    onHtmlChange?: (html: string) => void;
}

export function WordPressPublisher({ defaultBodyImage, getFeaturedImage, initialHtmlContent, initialBodyImageSrc, onHtmlChange }: WordPressPublisherProps) {
    const [htmlContent, setHtmlContent] = useState("")
    const [bodyImageFile, setBodyImageFile] = useState<File | null>(null)
    const [isPublishing, setIsPublishing] = useState(false)
    const [result, setResult] = useState<{ success: boolean; link?: string; error?: string } | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)

    // Sync initial content
    useEffect(() => {
        if (initialHtmlContent) {
            setHtmlContent(initialHtmlContent);
        }
    }, [initialHtmlContent]);

    // Sync initial body image URL (Restore Draft)
    useEffect(() => {
        if (initialBodyImageSrc) {
            setPreviewUrl(initialBodyImageSrc);
            // Note: We cannot set bodyImageFile (File) from a URL easily without fetching.
            // If the user publishes WITHOUT changing this image, we need logic to handle "Use Remote URL" 
            // OR we fetch it here to create a File/Blob.
            // Fetching it here is safer for the existing 'FormData' logic.
            fetch(initialBodyImageSrc)
                .then(res => res.blob())
                .then(blob => {
                    const file = new File([blob], "restored-body.png", { type: blob.type });
                    setBodyImageFile(file);
                })
                .catch(err => console.error("Failed to restore body image file", err));
        }
    }, [initialBodyImageSrc]);

    // Sync default body image if provided & user hasn't selected manual one
    useEffect(() => {
        if (defaultBodyImage) {
            setBodyImageFile(defaultBodyImage)
            const reader = new FileReader()
            reader.onload = (ev) => {
                setPreviewUrl(ev.target?.result as string)
            }
            reader.readAsDataURL(defaultBodyImage)
        }
    }, [defaultBodyImage])

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setBodyImageFile(file)
            const reader = new FileReader()
            reader.onload = (ev) => {
                setPreviewUrl(ev.target?.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    const handleSaveDraft = async () => {
        if (!htmlContent) {
            alert("본문을 입력해주세요.");
            return;
        }

        setIsPublishing(true);
        try {
            const formData = new FormData();

            // Generate a simple title from H1 or timestamp
            let title = "Draft " + new Date().toLocaleString();
            const h1Match = htmlContent.match(/<h1[^>]*>(.*?)<\/h1>/i);
            if (h1Match && h1Match[1]) {
                title = h1Match[1].replace(/<[^>]*>/g, "");
            }
            formData.append("title", title);
            formData.append("htmlContent", htmlContent);

            // Images
            let featuredBlob: Blob | null = null;
            if (getFeaturedImage) featuredBlob = await getFeaturedImage();

            const finalBodyImage = bodyImageFile || defaultBodyImage;

            if (featuredBlob) formData.append("thumbnailImage", featuredBlob, "thumb.png");
            if (finalBodyImage) formData.append("bodyImage", finalBodyImage, finalBodyImage.name);

            const res = await fetch("/api/articles/draft", {
                method: "POST",
                body: formData
            });

            if (res.ok) {
                alert("성공적으로 저장되었습니다! (하단 저장 목록 확인)");
                setResult({ success: true, link: "#drafts", error: undefined }); // Pseudo success
            } else {
                alert("저장 실패");
            }
        } catch (e) {
            console.error(e);
            alert("저장 중 오류 발생");
        } finally {
            setIsPublishing(false);
        }
    }

    const handlePublish = async () => {
        // Validate
        if (!htmlContent) {
            alert("본문(HTML)을 입력해주세요.");
            return;
        }

        if (!confirm("정말로 워드프레스에 발행하시겠습니까?")) return;

        setIsPublishing(true)
        setResult(null)

        try {
            // 1. Get Featured Image (Async from Top Component)
            let featuredBlob: Blob | null = null;
            if (getFeaturedImage) {
                featuredBlob = await getFeaturedImage();
            }

            // 2. Get Body Image (Manual or Default)
            const finalBodyImage = bodyImageFile || defaultBodyImage;

            if (!featuredBlob && !finalBodyImage) {
                alert("이미지가 없습니다. 상단에서 썸네일을 생성하거나 하단에서 이미지를 업로드해주세요.");
                setIsPublishing(false);
                return;
            }

            // Clean Content - Remove internal image prompt comments
            const cleanHtml = htmlContent.replace(/<!--\s*\[IMAGE_PROMPT_START\][\s\S]*?\[IMAGE_PROMPT_END\]\s*-->/g, "").trim();

            const formData = new FormData()
            formData.append("htmlContent", cleanHtml)

            if (featuredBlob) {
                formData.append("featuredImage", featuredBlob, "thumbnail-featured.png");
            }

            if (finalBodyImage) {
                formData.append("bodyImage", finalBodyImage, finalBodyImage.name);
            }

            const res = await fetch("/api/wordpress/post", {
                method: "POST",
                body: formData
            })

            const data = await res.json()

            if (res.ok && data.success) {
                setResult({ success: true, link: data.link })
                setHtmlContent("")
                setBodyImageFile(null)
            } else {
                setResult({ success: false, error: data.error || "알 수 없는 오류" })
            }

        } catch (e) {
            setResult({ success: false, error: "네트워크 오류 발생" })
        } finally {
            setIsPublishing(false)
        }
    }

    return (
        <Card className="p-6 bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800 shadow-sm mt-8 border-t-4 border-t-blue-600">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-bold flex items-center gap-2 text-gray-900 dark:text-gray-100">
                        <Send className="w-5 h-5 text-blue-600" />
                        워드프레스 원클릭 발행기
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        HTML 붙여넣기 + 자동 이미지 연결 (상단 썸네일 → 대표이미지 / 원본 → 본문)
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left: HTML Input */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="wp-content" className="font-semibold text-gray-700 dark:text-gray-300">
                            1. HTML 본문 붙여넣기 (Ctrl+V)
                        </Label>
                        <Textarea
                            id="wp-content"
                            placeholder="<!-- META TITLE... --> <html>... 여기에 붙여넣으세요"
                            className="h-64 font-mono text-xs bg-gray-50 dark:bg-zinc-950 resize-none focus:ring-blue-500"
                            value={htmlContent}
                            onChange={(e) => {
                                setHtmlContent(e.target.value);
                                onHtmlChange?.(e.target.value);
                            }}
                        />
                    </div>
                </div>

                {/* Right: Image Upload & Action */}
                <div className="space-y-6">
                    <div className="space-y-2">
                        <Label className="font-semibold text-gray-700 dark:text-gray-300">
                            2. 본문 이미지 (선택사항)
                        </Label>
                        <p className="text-xs text-gray-500 mb-2">
                            *기본값: 상단 썸네일 생성기의 원본 이미지<br />
                            *다른 이미지를 원하면 아래에 업로드하세요.
                        </p>

                        <div className={`
                            relative border-2 border-dashed rounded-xl h-40 flex flex-col items-center justify-center text-center p-4 transition-all
                            ${previewUrl ? 'border-blue-300 bg-blue-50 dark:bg-blue-900/10' : 'border-gray-300 hover:border-blue-400 bg-gray-50 dark:border-zinc-700 dark:bg-zinc-800'}
                        `}>
                            {previewUrl ? (
                                <>
                                    <img src={previewUrl} alt="Preview" className="h-full w-full object-contain rounded-lg opacity-80" />
                                    <div className="absolute inset-0 flex items-center justify-center group">
                                        <div className="bg-black/50 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">Change Image</div>
                                    </div>
                                </>
                            ) : (
                                <div className="pointer-events-none">
                                    <UploadCloud className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                                    <span className="text-sm text-gray-500 block">원본 이미지 드래그<br />또는 클릭</span>
                                </div>
                            )}

                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                        </div>
                    </div>

                    <div className="pt-2 flex flex-col gap-3">
                        <Button
                            onClick={handlePublish}
                            disabled={isPublishing}
                            className={`w-full h-12 text-base font-semibold shadow-lg transition-all ${isPublishing ? 'bg-gray-400' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:scale-[1.02] hover:shadow-blue-500/25'
                                }`}
                        >
                            {isPublishing ? (
                                <span className="flex items-center gap-2">
                                    <UploadCloud className="animate-bounce w-5 h-5" />
                                    발행 중...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    <Send className="w-5 h-5" />
                                    3. 워드프레스 발행하기
                                </span>
                            )}
                        </Button>

                        {/* Save Draft Button */}
                        <Button
                            variant="outline"
                            onClick={handleSaveDraft}
                            disabled={isPublishing}
                            className="w-full h-10 border-blue-200 text-blue-700 hover:bg-blue-50 transition-colors"
                        >
                            <SaveIcon className="w-4 h-4 mr-2" />
                            예약 저장 (DB Save)
                        </Button>

                        <p className="text-[10px] text-center text-gray-400 mt-2">
                            *대표 이미지는 상단 썸네일로 자동 설정됩니다.
                        </p>
                    </div>

                    {/* Result Feedback */}
                    {result && (
                        <div className={`p-4 rounded-lg flex items-start gap-3 text-sm ${result.success ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                            }`}>
                            {result.success ? (
                                <>
                                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                                    <div>
                                        <p className="font-bold">성공!</p>
                                        {result.link === "#drafts" ? (
                                            <p>저장 목록에서 확인하세요.</p>
                                        ) : (
                                            <a href={result.link} target="_blank" rel="noreferrer" className="underline hover:no-underline mt-1 inline-block">
                                                게시글 보러가기 →
                                            </a>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <>
                                    <AlertCircle className="w-5 h-5 shrink-0" />
                                    <div>
                                        <p className="font-bold">오류 발생</p>
                                        <p>{result.error}</p>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                </div>

            </div>
        </Card>
    )
}
