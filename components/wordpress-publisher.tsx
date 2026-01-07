"use client"
import { useState, useEffect } from "react"
import { Send, Image as ImageIcon, CheckCircle2, AlertCircle, UploadCloud, Save as SaveIcon, Copy } from "lucide-react"
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
    onDraftSaved?: () => void;
    focusKeyword?: string; // NEW: The keyword used for thumbnail title, to be sent to Rank Math
}

export function WordPressPublisher({ defaultBodyImage, getFeaturedImage, initialHtmlContent, initialBodyImageSrc, onHtmlChange, onDraftSaved, focusKeyword }: WordPressPublisherProps) {
    const [htmlContent, setHtmlContent] = useState("")
    const [bodyImageFile, setBodyImageFile] = useState<File | null>(null)
    const [isPublishing, setIsPublishing] = useState(false)
    const [result, setResult] = useState<{ success: boolean; link?: string; error?: string } | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [copied, setCopied] = useState(false) // NEW State for copy feedback

    // NEW: Track existing Supabase URLs (to avoid re-uploading)
    const [existingBodyImageUrl, setExistingBodyImageUrl] = useState<string | null>(null)
    const [userChangedBodyImage, setUserChangedBodyImage] = useState(false)

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
            // Store the existing URL so we don't re-upload
            setExistingBodyImageUrl(initialBodyImageSrc);
            setUserChangedBodyImage(false);
            // Don't fetch and convert to File anymore - we'll use URL directly
        }
    }, [initialBodyImageSrc]);

    // Sync default body image if provided & user hasn't selected manual one
    useEffect(() => {
        if (defaultBodyImage) {
            setBodyImageFile(defaultBodyImage)
            setUserChangedBodyImage(true) // This is a new image
            setExistingBodyImageUrl(null)
            const reader = new FileReader()
            reader.onload = (ev) => {
                setPreviewUrl(ev.target?.result as string)
            }
            reader.readAsDataURL(defaultBodyImage)
        }
    }, [defaultBodyImage])

    const handleCopyHtml = async () => {
        if (!htmlContent) return;
        try {
            await navigator.clipboard.writeText(htmlContent);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy', err);
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setBodyImageFile(file)
            setUserChangedBodyImage(true) // User manually selected a new image
            setExistingBodyImageUrl(null)
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
            // Generate a simple title from H1 or timestamp
            let title = "Draft " + new Date().toLocaleString();
            const h1Match = htmlContent.match(/<h1[^>]*>(.*?)<\/h1>/i);
            if (h1Match && h1Match[1]) {
                title = h1Match[1].replace(/<[^>]*>/g, "");
            }

            // Get images
            let featuredBlob: Blob | null = null;
            if (getFeaturedImage) featuredBlob = await getFeaturedImage();
            const finalBodyImage = bodyImageFile || defaultBodyImage;

            // Upload images directly to Supabase from client-side (avoids Vercel 4.5MB limit)
            let thumbnailUrl: string | null = null;
            let bodyImageUrl: string | null = null;

            const timestamp = Date.now();
            const userId = "default-user";

            // Helper: Upload to Supabase directly from client
            const uploadToSupabase = async (file: Blob | File, subDir: string, fileName: string): Promise<string | null> => {
                const { createClient } = await import('@supabase/supabase-js');
                const supabase = createClient(
                    process.env.NEXT_PUBLIC_SUPABASE_URL!,
                    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
                );
                const bucketName = process.env.NEXT_PUBLIC_SUPABASE_BUCKET || "whness-blog";
                const path = `${subDir}/${userId}/${timestamp}-${fileName}`;

                const arrayBuffer = await file.arrayBuffer();
                const { error: uploadError } = await supabase.storage.from(bucketName).upload(path, arrayBuffer, {
                    contentType: file.type || "image/png",
                    upsert: false
                });

                if (uploadError) {
                    console.error(`[Client] Supabase upload error (${path}):`, uploadError.message);
                    throw new Error(`Supabase Upload Error: ${uploadError.message}`);
                }

                const { data: publicUrlData } = supabase.storage.from(bucketName).getPublicUrl(path);
                return publicUrlData.publicUrl;
            };

            // Upload thumbnail (always upload as it's generated fresh)
            if (featuredBlob) {
                console.log("[Client] Uploading thumbnail to Supabase...");
                thumbnailUrl = await uploadToSupabase(featuredBlob, "thumbnails", "thumb.png");
                console.log("[Client] Thumbnail uploaded:", thumbnailUrl);
            }

            // For body image: Use existing URL if not changed, otherwise upload new
            if (existingBodyImageUrl && !userChangedBodyImage) {
                // Image wasn't changed - reuse existing Supabase URL (NO re-upload!)
                console.log("[Client] Reusing existing body image URL:", existingBodyImageUrl);
                bodyImageUrl = existingBodyImageUrl;
            } else if (finalBodyImage) {
                // New image or user changed it - upload to Supabase
                console.log("[Client] Uploading new body image to Supabase...");
                const fileName = finalBodyImage instanceof File ? finalBodyImage.name : "body.png";
                bodyImageUrl = await uploadToSupabase(finalBodyImage, "raw", fileName);
                console.log("[Client] Body image uploaded:", bodyImageUrl);
            }

            // Send only URLs to API (small payload, no 413 error)
            const res = await fetch("/api/articles/draft", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    title,
                    htmlContent,
                    thumbnailUrl,
                    bodyImageUrl
                })
            });

            if (res.ok) {
                alert("성공적으로 저장되었습니다! (하단 저장 목록 확인)");
                setResult({ success: true, link: "#drafts", error: undefined });
                onDraftSaved?.();
            } else {
                const errorData = await res.json();
                alert(`저장 실패: ${errorData.error || "알 수 없는 오류"}`);
            }
        } catch (e: any) {
            console.error(e);
            alert(`저장 중 오류 발생: ${e.message || "Unknown error"}`);
        } finally {
            setIsPublishing(false);
        }
    }

    const handlePublish = async () => {
        console.log("[Client] Publish button clicked");

        // Validate
        if (!htmlContent) {
            alert("⚠️ 본문(HTML)이 비어있습니다. 먼저 글을 생성해주세요.");
            return;
        }

        if (!confirm("정말로 워드프레스에 발행하시겠습니까? (이미지와 본문이 업로드됩니다)")) return;

        setIsPublishing(true)
        setResult(null)

        try {
            // Helper function to upload a single image
            const uploadImageToWP = async (file: File | Blob, type: 'featured' | 'body') => {
                const formData = new FormData();
                formData.append("image", file, `${type}-image.png`);
                formData.append("type", type);

                // SEO: Add Alt Text
                const altText = type === 'featured'
                    ? (focusKeyword || "Blog Featured Image")
                    : `${focusKeyword || "Blog Info"} - Detailed View`;

                formData.append("alt_text", altText);

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

            // 1. Get Featured Image (Async from Top Component)
            let featuredBlob: Blob | null = null;
            if (getFeaturedImage) {
                try {
                    console.log("[Client] Retrieving featured image...");
                    featuredBlob = await getFeaturedImage();
                } catch (err) {
                    console.error("[Client] Failed to get featured image:", err);
                    // Continue without it? Or fail? Let's warn.
                }
            }

            // 2. Get Body Image (Manual or Default)
            const finalBodyImage = bodyImageFile || defaultBodyImage;

            if (!featuredBlob && !finalBodyImage) {
                alert("🚫 이미지가 없습니다!\n\n상단의 '썸네일 생성'을 완료했는지, 또는 하단에 본문 이미지가 있는지 확인해주세요.\n이미지 없이 발행할 수 없습니다.");
                setIsPublishing(false);
                return;
            }

            // 3. Upload images SEPARATELY first (to avoid body size limits)
            let featuredMediaId: number | null = null;
            let featuredMediaUrl: string | null = null;
            let bodyMediaUrl: string | null = null;

            if (featuredBlob) {
                console.log("[Client] Uploading featured image...");
                const featuredResult = await uploadImageToWP(featuredBlob, 'featured');
                featuredMediaId = featuredResult.id;
                featuredMediaUrl = featuredResult.url;
                console.log("[Client] Featured image uploaded:", featuredMediaUrl);
            }

            if (finalBodyImage) {
                console.log("[Client] Uploading body image...");
                const bodyResult = await uploadImageToWP(finalBodyImage, 'body');
                bodyMediaUrl = bodyResult.url;
                console.log("[Client] Body image uploaded:", bodyMediaUrl);
            }

            // 4. Clean Content & Insert Body Image
            let cleanHtml = htmlContent.replace(/<!--\s*\[IMAGE_PROMPT_START\][\s\S]*?\[IMAGE_PROMPT_END\]\s*-->/g, "").trim();

            if (bodyMediaUrl) {
                const imgTag = `<figure class="wp-block-image"><img src="${bodyMediaUrl}" alt="${focusKeyword} - Detail" class="whness-body-image" /></figure>`;
                if (cleanHtml.includes("[INSERT_IMAGE_HERE]")) {
                    cleanHtml = cleanHtml.replace("[INSERT_IMAGE_HERE]", imgTag);
                } else {
                    // If no placeholder, insert after the first H2 (Intelligent Placement)
                    const firstH2Index = cleanHtml.indexOf("</h2>");
                    if (firstH2Index !== -1) {
                        cleanHtml = cleanHtml.slice(0, firstH2Index + 5) + imgTag + cleanHtml.slice(firstH2Index + 5);
                    } else {
                        // Fallback: Append to top
                        cleanHtml = imgTag + cleanHtml;
                    }
                }
            }

            // 5. Publish post with JSON (small payload - no images)
            const res = await fetch("/api/wordpress/post", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    htmlContent: cleanHtml,
                    featuredMediaId: featuredMediaId,
                    featuredMediaUrl: featuredMediaUrl,
                    bodyMediaUrl: bodyMediaUrl,
                    focusKeyword: focusKeyword || "" // Pass thumbnail title as focus keyword
                })
            })

            const data = await res.json()

            if (res.ok && data.success) {
                setResult({ success: true, link: data.link })
                setHtmlContent("")
                setBodyImageFile(null)
            } else {
                setResult({ success: false, error: data.error || "알 수 없는 오류" })
            }

        } catch (e: any) {
            console.error("[Client] Publish error:", e);
            setResult({ success: false, error: e.message || "네트워크 오류 발생" })
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

            <div className="grid grid-cols-1 gap-6">

                {/* Left: HTML Input (Full Width) */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <Label htmlFor="wp-content" className="font-semibold text-gray-700 dark:text-gray-300">
                            1. HTML 본문 붙여넣기 (Ctrl+V)
                        </Label>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleCopyHtml}
                            className="text-xs h-7 px-2 text-gray-500 hover:text-blue-600"
                            disabled={!htmlContent}
                        >
                            {copied ? (
                                <span className="flex items-center gap-1 text-green-600 font-bold">
                                    <CheckCircle2 className="w-3 h-3" /> 복사됨!
                                </span>
                            ) : (
                                <span className="flex items-center gap-1">
                                    <Copy className="w-3 h-3" /> 전체 복사
                                </span>
                            )}
                        </Button>
                    </div>
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

                {/* Right: Action Buttons (2 Columns) */}
                <div className="grid grid-cols-2 gap-4">
                    {/* Publish Button */}
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
                                워드프레스 발행하기
                            </span>
                        )}
                    </Button>

                    {/* Save Draft Button */}
                    <Button
                        variant="outline"
                        onClick={handleSaveDraft}
                        disabled={isPublishing}
                        className="w-full h-12 border-blue-200 text-blue-700 hover:bg-blue-50 transition-colors"
                    >
                        <SaveIcon className="w-4 h-4 mr-2" />
                        예약 저장 (DB Save)
                    </Button>
                </div>

                <div className="text-center">
                    <p className="text-[10px] text-gray-400">
                        *대표 이미지는 상단 썸네일로, 본문 이미지는 별도 선택된 이미지로 자동 설정됩니다.
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
        </Card>
    )
}
