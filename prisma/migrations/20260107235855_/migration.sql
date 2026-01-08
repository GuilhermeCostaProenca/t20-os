-- AlterTable
ALTER TABLE "CharacterSheet" ADD COLUMN     "ancestry" VARCHAR(120),
ADD COLUMN     "attacks" JSONB,
ADD COLUMN     "className" VARCHAR(120),
ADD COLUMN     "defenseFort" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "defenseRef" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "defenseWill" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "deity" VARCHAR(120),
ADD COLUMN     "sheetRulesetId" VARCHAR(50) NOT NULL DEFAULT 'tormenta20',
ADD COLUMN     "skills" JSONB,
ADD COLUMN     "spells" JSONB;

-- CreateTable
CREATE TABLE "RulesetDocument" (
    "id" TEXT NOT NULL,
    "rulesetId" VARCHAR(50) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "type" VARCHAR(32) NOT NULL,
    "filePath" VARCHAR(500) NOT NULL,
    "storageKey" VARCHAR(500) NOT NULL,
    "pages" INTEGER,
    "textIndex" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RulesetDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionSummary" (
    "id" TEXT NOT NULL,
    "sessionId" VARCHAR(120) NOT NULL,
    "campaignId" VARCHAR(120),
    "summary" TEXT NOT NULL,
    "highlights" JSONB,
    "npcs" JSONB,
    "items" JSONB,
    "hooks" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SessionSummary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActionRequest" (
    "id" TEXT NOT NULL,
    "campaignId" VARCHAR(120) NOT NULL,
    "combatId" VARCHAR(120),
    "roomCode" VARCHAR(16),
    "actorId" VARCHAR(120) NOT NULL,
    "targetId" VARCHAR(120) NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "payload" JSONB NOT NULL,
    "status" VARCHAR(16) NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActionRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RulesetDocument_rulesetId_createdAt_idx" ON "RulesetDocument"("rulesetId", "createdAt");

-- CreateIndex
CREATE INDEX "RulesetDocument_title_idx" ON "RulesetDocument"("title");

-- CreateIndex
CREATE INDEX "SessionSummary_sessionId_idx" ON "SessionSummary"("sessionId");

-- CreateIndex
CREATE INDEX "SessionSummary_campaignId_createdAt_idx" ON "SessionSummary"("campaignId", "createdAt");

-- CreateIndex
CREATE INDEX "ActionRequest_campaignId_status_createdAt_idx" ON "ActionRequest"("campaignId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "ActionRequest_roomCode_status_createdAt_idx" ON "ActionRequest"("roomCode", "status", "createdAt");
