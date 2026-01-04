import { PrismaClient } from "@prisma/client"
import { notFound } from "next/navigation"
import { marked } from "marked"

const prisma = new PrismaClient()

interface PreviewPageProps {
    params: Promise<{
        id: string
    }>
}

export default async function ArticlePreviewPage({ params }: PreviewPageProps) {
    const { id } = await params

    const article = await prisma.article.findUnique({
        where: { id },
        include: { images: true }
    })

    if (!article) {
        notFound()
    }

    // Convert markdown to HTML
    const htmlContent = article.content
        ? await marked(article.content, { breaks: true, gfm: true })
        : ''

    return (
        <div className="min-h-screen bg-white dark:bg-gray-950">
            {/* Header Bar */}
            <div className="sticky top-0 z-10 bg-white/95 dark:bg-gray-900/95 backdrop-blur border-b">
                <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <a href="/auto" className="text-sm text-blue-600 hover:underline">← Back to Auto Mode</a>
                        <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-1 rounded">
                            DRAFT PREVIEW
                        </span>
                    </div>
                    <div className="text-sm">
                        <span className="text-gray-500">SEO Score: </span>
                        <span className="font-bold text-green-600">{article.estimatedScore || 85}/100</span>
                    </div>
                </div>
            </div>

            {/* SEO Meta Info Banner */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b">
                <div className="max-w-4xl mx-auto px-6 py-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                        <div className="text-gray-500 text-xs mb-1">Focus Keyword</div>
                        <div className="font-semibold text-blue-700">🔑 {article.focusKeyword}</div>
                    </div>
                    <div>
                        <div className="text-gray-500 text-xs mb-1">Word Count</div>
                        <div className="font-semibold">{article.wordCount?.toLocaleString() || '-'} words</div>
                    </div>
                    <div className="col-span-2">
                        <div className="text-gray-500 text-xs mb-1">Meta Description</div>
                        <div className="text-gray-700 text-xs">{article.metaDesc || 'Not set'}</div>
                    </div>
                </div>
            </div>

            {/* Main Article Content */}
            <article className="max-w-4xl mx-auto px-6 py-12">
                {/* Featured Image */}
                {article.images?.[0]?.url && (
                    <figure className="mb-10">
                        <img
                            src={article.images[0].url}
                            alt={article.images[0].altText || article.title}
                            className="w-full rounded-2xl shadow-xl object-cover max-h-[500px]"
                        />
                        {article.images[0].altText && (
                            <figcaption className="text-center text-sm text-gray-500 mt-3">
                                {article.images[0].altText}
                            </figcaption>
                        )}
                    </figure>
                )}

                {/* Article Body - Proper Typography */}
                <div
                    className="
                        prose prose-lg dark:prose-invert max-w-none font-sans
                        
                        /* Headings - Dark Navy (#1e293b / slate-800) */
                        prose-headings:font-sans prose-headings:text-slate-800 dark:prose-headings:text-slate-100
                        
                        /* H1: 38px */
                        prose-h1:text-[38px] prose-h1:leading-tight prose-h1:font-bold 
                        prose-h1:mb-8 prose-h1:pb-4 prose-h1:border-b prose-h1:border-slate-200
                        
                        /* H2: 28px, Large Top Margin */
                        prose-h2:text-[28px] prose-h2:font-bold 
                        prose-h2:mt-16 prose-h2:mb-4
                        
                        /* H3: 22px, Smaller Margins */
                        prose-h3:text-[22px] prose-h3:font-semibold 
                        prose-h3:mt-8 prose-h3:mb-2
                        
                        /* Paragraphs */
                        prose-p:text-slate-600 dark:prose-p:text-slate-300 
                        prose-p:leading-7 prose-p:mb-5 prose-p:text-[18px]
                        
                        /* Lists */
                        prose-ul:my-4 prose-ul:list-disc prose-ul:pl-6 prose-ul:space-y-1
                        prose-ol:my-4 prose-ol:list-decimal prose-ol:pl-6 prose-ol:space-y-1
                        prose-li:text-slate-600 prose-li:text-[18px]
                        
                        /* Tables */
                        prose-table:w-full prose-table:my-8 prose-table:border-collapse prose-table:text-[16px]
                        prose-thead:bg-slate-50 dark:prose-thead:bg-slate-800
                        prose-th:border prose-th:border-slate-300 prose-th:px-4 prose-th:py-3 prose-th:text-slate-800
                        prose-td:border prose-td:border-slate-300 prose-td:px-4 prose-td:py-3 prose-td:text-slate-600
                        
                        /* Images */
                        prose-img:rounded-xl prose-img:shadow-md prose-img:my-8 prose-img:w-full
                    "
                    dangerouslySetInnerHTML={{ __html: htmlContent }}
                />
            </article>

            {/* Footer */}
            <div className="border-t bg-gray-50 dark:bg-gray-900 px-6 py-8">
                <div className="max-w-4xl mx-auto text-center">
                    <p className="text-sm text-gray-500 mb-4">
                        📝 This is a draft preview. Review and publish from Auto Mode.
                    </p>
                    <a
                        href="/auto"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                        Go to Auto Mode
                    </a>
                </div>
            </div>
        </div>
    )
}
