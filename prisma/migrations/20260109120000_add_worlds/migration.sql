-- CreateEnum
CREATE TYPE "WorldStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "WorldEventScope" AS ENUM ('MICRO', 'MACRO');

-- CreateEnum
CREATE TYPE "WorldEventVisibility" AS ENUM ('MASTER', 'PLAYERS');

-- CreateEnum
CREATE TYPE "WorldEventType" AS ENUM (
    'ATTACK',
    'DAMAGE',
    'SPELL',
    'SKILL',
    'NOTE',
    'NPC_MENTION',
    'ITEM_MENTION',
    'OVERRIDE',
    'TURN',
    'INITIATIVE',
    'SESSION_START',
    'SESSION_END',
    'LOCATION_DISCOVERY',
    'NPC_DEATH',
    'WORLD_CHANGE',
    'CONDITION_APPLIED',
    'CONDITION_REMOVED',
    'ROLL'
);

-- CreateTable
CREATE TABLE "World" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" VARCHAR(1000),
    "coverImage" VARCHAR(500),
    "status" "WorldStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "World_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorldEvent" (
    "id" TEXT NOT NULL,
    "worldId" TEXT NOT NULL,
    "campaignId" TEXT,
    "sessionId" TEXT,
    "combatId" TEXT,
    "type" "WorldEventType" NOT NULL,
    "scope" "WorldEventScope" NOT NULL,
    "ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actorId" VARCHAR(120),
    "targetId" VARCHAR(120),
    "visibility" "WorldEventVisibility" NOT NULL DEFAULT 'PLAYERS',
    "breakdown" JSONB,
    "meta" JSONB,
    "text" VARCHAR(500),

    CONSTRAINT "WorldEvent_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Campaign" ADD COLUMN "worldId" TEXT;

-- Seed Worlds from existing campaigns
INSERT INTO "World" ("id", "title", "description", "coverImage", "createdAt", "updatedAt")
SELECT "id", "name", "description", NULL, "createdAt", "updatedAt"
FROM "Campaign";

-- Attach campaigns to the newly created worlds
UPDATE "Campaign"
SET "worldId" = "id"
WHERE "worldId" IS NULL;

-- AlterTable
ALTER TABLE "Campaign" ALTER COLUMN "worldId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "Campaign_worldId_idx" ON "Campaign"("worldId");

-- CreateIndex
CREATE INDEX "WorldEvent_worldId_ts_idx" ON "WorldEvent"("worldId", "ts");

-- CreateIndex
CREATE INDEX "WorldEvent_campaignId_ts_idx" ON "WorldEvent"("campaignId", "ts");

-- CreateIndex
CREATE INDEX "WorldEvent_type_idx" ON "WorldEvent"("type");

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_worldId_fkey" FOREIGN KEY ("worldId") REFERENCES "World"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorldEvent" ADD CONSTRAINT "WorldEvent_worldId_fkey" FOREIGN KEY ("worldId") REFERENCES "World"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorldEvent" ADD CONSTRAINT "WorldEvent_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;
