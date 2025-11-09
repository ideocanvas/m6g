-- CreateTable
CREATE TABLE "mark6_results" (
    "id" TEXT NOT NULL,
    "drawId" TEXT NOT NULL,
    "drawDate" TIMESTAMP(3) NOT NULL,
    "dateText" TEXT NOT NULL,
    "winningNumbers" INTEGER[],
    "specialNumber" INTEGER NOT NULL,
    "snowballCode" TEXT,
    "snowballNameEn" TEXT,
    "snowballNameCh" TEXT,
    "totalInvestment" BIGINT,
    "jackpot" BIGINT,
    "unitBet" INTEGER,
    "estimatedPrize" BIGINT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mark6_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mark6_generated_combinations" (
    "id" TEXT NOT NULL,
    "generationId" TEXT NOT NULL,
    "sequenceNumber" INTEGER NOT NULL,
    "combinationNumbers" INTEGER[],
    "isDouble" BOOLEAN NOT NULL DEFAULT false,
    "generationMethod" TEXT NOT NULL,
    "selectedNumbers" INTEGER[],
    "luckyNumber" INTEGER,
    "combinationCount" INTEGER,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mark6_generated_combinations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mark6_number_frequency" (
    "id" TEXT NOT NULL,
    "analysisDate" TIMESTAMP(3) NOT NULL,
    "analysisType" TEXT NOT NULL,
    "daysOfHistory" INTEGER NOT NULL,
    "number" INTEGER NOT NULL,
    "frequency" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mark6_number_frequency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mark6_follow_on_patterns" (
    "id" TEXT NOT NULL,
    "analysisDate" TIMESTAMP(3) NOT NULL,
    "daysOfHistory" INTEGER NOT NULL,
    "triggerNumber" INTEGER NOT NULL,
    "followNumber" INTEGER NOT NULL,
    "frequency" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mark6_follow_on_patterns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mark6_api_logs" (
    "id" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "statusCode" INTEGER,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "requestBody" JSONB,
    "responseBody" JSONB,
    "responseTimeMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mark6_api_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "mark6_results_drawId_key" ON "mark6_results"("drawId");
