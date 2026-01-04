"use client"

import React, { useState, useRef, useEffect, useImperativeHandle, forwardRef } from "react"
import { Upload, Download, Type, Image as ImageIcon, RefreshCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"

export interface ThumbnailGeneratorRef {
    getThumbnailBlob: () => Promise<Blob | null>;
}

interface ThumbnailGeneratorProps {
    defaultTitle: string;
    initialImageSrc?: string | null;
    onRawImageChange?: (file: File) => void;
}

export const ThumbnailGenerator = forwardRef<ThumbnailGeneratorRef, ThumbnailGeneratorProps>(({ defaultTitle, initialImageSrc, onRawImageChange }, ref) => {
    const [title, setTitle] = useState(defaultTitle)
    const [image, setImage] = useState<string | null>(null)
    const [isDarkText, setIsDarkText] = useState(false)
    const canvasRef = useRef<HTMLCanvasElement>(null)

    // Sync initial image (Restore Draft)
    useEffect(() => {
        if (initialImageSrc) {
            setImage(initialImageSrc);
        }
    }, [initialImageSrc]);

    // Expose method to parent
    useImperativeHandle(ref, () => ({
        getThumbnailBlob: () => {
            return new Promise((resolve) => {
                const canvas = canvasRef.current;
                if (!canvas) {
                    resolve(null);
                    return;
                }
                canvas.toBlob((blob) => {
                    resolve(blob);
                }, 'image/png');
            });
        }
    }));

    useEffect(() => {
        if (defaultTitle) setTitle(defaultTitle)
    }, [defaultTitle])

    // Base Redraw is handled by the useEffect near the drawCanvas definition

    const handleFile = (file: File) => {
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader()
            reader.onload = (event) => {
                setImage(event.target?.result as string)
            }
            reader.readAsDataURL(file)

            // Notify parent
            if (onRawImageChange) {
                onRawImageChange(file);
            }
        }
    }

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) handleFile(file);
    }

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        e.stopPropagation()
        const file = e.dataTransfer.files?.[0]
        if (file) handleFile(file);
    }

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        e.stopPropagation()
    }

    const renderId = useRef(0)

    const drawCanvas = () => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        // Increment render ID to "cancel" previous async loads
        const currentRenderId = ++renderId.current

        // 0. Set Canvas Size (This also clears it)
        canvas.width = 1920
        canvas.height = 1080
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        // 1. Draw Background
        if (image) {
            const img = new Image()
            img.crossOrigin = "anonymous"
            img.src = image
            img.onload = () => {
                // If a newer render has started, abort this one
                if (currentRenderId !== renderId.current) return

                const ratio = Math.max(canvas.width / img.width, canvas.height / img.height)
                const centerShift_x = (canvas.width - img.width * ratio) / 2
                const centerShift_y = (canvas.height - img.height * ratio) / 2

                // Important: Clear one more time right before drawing in sync with frame
                ctx.clearRect(0, 0, canvas.width, canvas.height)
                ctx.drawImage(img, 0, 0, img.width, img.height, centerShift_x, centerShift_y, img.width * ratio, img.height * ratio)
                applyOverlayAndText(ctx, canvas.width, canvas.height)
            }
        } else {
            // Placeholder Gradient
            const grd = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
            grd.addColorStop(0, "#eef2f3")
            grd.addColorStop(1, "#8e9eab")
            ctx.fillStyle = grd
            ctx.fillRect(0, 0, canvas.width, canvas.height)
            applyOverlayAndText(ctx, canvas.width, canvas.height)
        }
    }

    const applyOverlayAndText = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
        const gradient = ctx.createLinearGradient(0, height * 0.3, 0, height)
        if (isDarkText) {
            gradient.addColorStop(0, "rgba(255, 255, 255, 0)")
            gradient.addColorStop(0.8, "rgba(255, 255, 255, 0.9)")
            gradient.addColorStop(1, "rgba(255, 255, 255, 1)")
        } else {
            gradient.addColorStop(0, "rgba(0, 0, 0, 0)")
            gradient.addColorStop(0.8, "rgba(0, 0, 0, 0.8)")
            gradient.addColorStop(1, "rgba(0, 0, 0, 0.9)")
        }

        ctx.fillStyle = gradient
        ctx.fillRect(0, height * 0.3, width, height * 0.7)

        ctx.fillStyle = isDarkText ? "#111827" : "#FFFFFF"
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"

        const fontSize = 120
        ctx.font = `800 ${fontSize}px 'Inter', sans-serif`

        const words = title.split(" ")
        const maxWidth = width * 0.8
        let line = ""
        const lines = []

        for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + " "
            const metrics = ctx.measureText(testLine)
            const testWidth = metrics.width
            if (testWidth > maxWidth && n > 0) {
                lines.push(line)
                line = words[n] + " "
            } else {
                line = testLine
            }
        }
        lines.push(line)

        const lineHeight = fontSize * 1.2
        const totalTextHeight = lines.length * lineHeight
        let startY = height - (totalTextHeight / 2) - 100 // Center adjustment

        lines.forEach((l, i) => {
            ctx.fillText(l.trim(), width / 2, startY + (i * lineHeight))
        })

        ctx.font = `600 40px 'Inter', sans-serif`
        ctx.fillStyle = isDarkText ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.5)"
        ctx.fillText("WHNESS BLOG", width / 2, startY - 80)
    }

    // Single source of drawing trigger
    useEffect(() => {
        drawCanvas()
    }, [image, title, isDarkText])

    const downloadThumbnail = () => {
        const canvas = canvasRef.current
        if (canvas) {
            const link = document.createElement("a")
            link.download = `thumbnail-${title.slice(0, 10)}.png`
            link.href = canvas.toDataURL("image/png")
            link.click()
        }
    }

    return (
        <Card className="h-full flex flex-col">
            <CardContent
                className="flex-1 flex flex-col justify-center min-h-0 pt-6 pb-2 relative"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
            >
                <div className="relative aspect-video w-full bg-slate-100 rounded-lg overflow-hidden border shadow-inner group hover:border-blue-400 transition-colors">
                    <canvas
                        ref={canvasRef}
                        className="w-full h-full object-cover"
                    />
                    {!image && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 pointer-events-none">
                            <Upload className="w-12 h-12 mb-2 opacity-50" />
                            <span className="text-sm">Drag & Drop Image Here</span>
                        </div>
                    )}
                </div>
            </CardContent>

            <CardFooter className="flex-col space-y-4 pt-2">
                <div className="w-full">
                    <Label className="text-sm font-medium mb-1.5 block">Thumbnail Title</Label>
                    <div className="flex gap-2">
                        <Input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Enter blog title..."
                            className="font-medium"
                        />
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setIsDarkText(!isDarkText)}
                            title="Toggle Text Color"
                        >
                            <RefreshCcw className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 w-full">
                    <div className="relative">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <Button variant="outline" className="w-full">
                            <Upload className="w-4 h-4 mr-2" />
                            Select Image
                        </Button>
                    </div>
                    <Button onClick={downloadThumbnail} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                        <Download className="w-4 h-4 mr-2" />
                        Download PNG
                    </Button>
                </div>
            </CardFooter>
        </Card>
    )
})

ThumbnailGenerator.displayName = "ThumbnailGenerator"
