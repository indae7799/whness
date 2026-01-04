-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "currentPeriodStart" TIMESTAMP(3) NOT NULL,
    "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WordPressSite" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "siteUrl" TEXT NOT NULL,
    "siteName" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "appPassword" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSync" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WordPressSite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResearchJob" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "seeds" JSONB NOT NULL,
    "sources" JSONB NOT NULL,
    "persona" JSONB NOT NULL,
    "status" TEXT NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "currentTask" TEXT,
    "researchData" JSONB,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResearchJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Keyword" (
    "id" TEXT NOT NULL,
    "researchJobId" TEXT NOT NULL,
    "phrase" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "searchVolume" INTEGER,
    "competition" DOUBLE PRECISION NOT NULL,
    "relevance" DOUBLE PRECISION NOT NULL,
    "trending" TEXT NOT NULL,
    "redditPosts" INTEGER NOT NULL DEFAULT 0,
    "sePosts" INTEGER NOT NULL DEFAULT 0,
    "snippetChance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "selected" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Keyword_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Article" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "siteId" TEXT,
    "researchJobId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "focusKeyword" TEXT NOT NULL,
    "metaTitle" TEXT NOT NULL,
    "metaDesc" TEXT NOT NULL,
    "wordCount" INTEGER NOT NULL,
    "h2Count" INTEGER NOT NULL,
    "h3Count" INTEGER NOT NULL,
    "keywordDensity" DOUBLE PRECISION NOT NULL,
    "rankMathScore" INTEGER,
    "estimatedScore" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "scheduledFor" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "wpPostId" INTEGER,
    "wpPostUrl" TEXT,
    "error" TEXT,
    "persona" JSONB NOT NULL,
    "referenceInfo" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Article_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Image" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "path" TEXT,
    "altText" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "revisedPrompt" TEXT,
    "wpMediaId" INTEGER,
    "position" TEXT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "size" INTEGER,
    "format" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Image_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsageStats" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "articlesThisMonth" INTEGER NOT NULL DEFAULT 0,
    "articlesLimit" INTEGER NOT NULL DEFAULT 5,
    "imagesThisMonth" INTEGER NOT NULL DEFAULT 0,
    "imagesLimit" INTEGER NOT NULL DEFAULT 5,
    "totalArticles" INTEGER NOT NULL DEFAULT 0,
    "totalImages" INTEGER NOT NULL DEFAULT 0,
    "totalWordCount" INTEGER NOT NULL DEFAULT 0,
    "costThisMonth" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastResetAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UsageStats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CostLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "model" TEXT,
    "inputTokens" INTEGER,
    "outputTokens" INTEGER,
    "cost" DOUBLE PRECISION NOT NULL,
    "articleId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CostLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutomationJob" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "articlesCount" INTEGER NOT NULL,
    "publishType" TEXT NOT NULL,
    "scheduleInterval" INTEGER,
    "category" TEXT,
    "status" TEXT NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "articlesGenerated" INTEGER NOT NULL DEFAULT 0,
    "articlesPublished" INTEGER NOT NULL DEFAULT 0,
    "articlesFailed" INTEGER NOT NULL DEFAULT 0,
    "totalCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AutomationJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_userId_key" ON "Subscription"("userId");

-- CreateIndex
CREATE INDEX "WordPressSite_userId_idx" ON "WordPressSite"("userId");

-- CreateIndex
CREATE INDEX "ResearchJob_userId_status_idx" ON "ResearchJob"("userId", "status");

-- CreateIndex
CREATE INDEX "ResearchJob_createdAt_idx" ON "ResearchJob"("createdAt");

-- CreateIndex
CREATE INDEX "Keyword_researchJobId_score_idx" ON "Keyword"("researchJobId", "score");

-- CreateIndex
CREATE INDEX "Keyword_phrase_idx" ON "Keyword"("phrase");

-- CreateIndex
CREATE UNIQUE INDEX "Article_researchJobId_key" ON "Article"("researchJobId");

-- CreateIndex
CREATE INDEX "Article_userId_status_idx" ON "Article"("userId", "status");

-- CreateIndex
CREATE INDEX "Article_createdAt_idx" ON "Article"("createdAt");

-- CreateIndex
CREATE INDEX "Image_articleId_idx" ON "Image"("articleId");

-- CreateIndex
CREATE UNIQUE INDEX "UsageStats_userId_key" ON "UsageStats"("userId");

-- CreateIndex
CREATE INDEX "CostLog_userId_createdAt_idx" ON "CostLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "CostLog_type_idx" ON "CostLog"("type");

-- CreateIndex
CREATE INDEX "AutomationJob_userId_status_idx" ON "AutomationJob"("userId", "status");

-- CreateIndex
CREATE INDEX "AutomationJob_createdAt_idx" ON "AutomationJob"("createdAt");

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WordPressSite" ADD CONSTRAINT "WordPressSite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Keyword" ADD CONSTRAINT "Keyword_researchJobId_fkey" FOREIGN KEY ("researchJobId") REFERENCES "ResearchJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "WordPressSite"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_researchJobId_fkey" FOREIGN KEY ("researchJobId") REFERENCES "ResearchJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Image" ADD CONSTRAINT "Image_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsageStats" ADD CONSTRAINT "UsageStats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutomationJob" ADD CONSTRAINT "AutomationJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
