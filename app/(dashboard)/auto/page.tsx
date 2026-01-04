"use client"

import { AutoModeSettings } from "@/components/auto-mode-settings"

export default function AutoModePage() {
    return (
        <div className="min-h-screen bg-gray-50/50 dark:bg-black/20 p-6 md:p-8">
            <div className="max-w-5xl mx-auto">
                <AutoModeSettings />
            </div>
        </div>
    )
}
