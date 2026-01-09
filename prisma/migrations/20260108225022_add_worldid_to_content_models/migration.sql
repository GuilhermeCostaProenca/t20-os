-- Step 1: Add nullable columns first
ALTER TABLE "Character" ADD COLUMN "worldId" TEXT;
ALTER TABLE "Npc" ADD COLUMN "worldId" TEXT;
ALTER TABLE "RulesetDocument" ADD COLUMN "worldId" TEXT;
ALTER TABLE "Session" ADD COLUMN "worldId" TEXT;
ALTER TABLE "SessionSummary" ADD COLUMN "worldId" TEXT;

-- Step 2: Create default world if no worlds exist
DO $$
DECLARE
    default_world_id TEXT;
    world_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO world_count FROM "World";
    IF world_count = 0 THEN
        -- Generate a CUID-like ID
        default_world_id := 'cl' || substr(md5(random()::text || clock_timestamp()::text), 1, 24);
        INSERT INTO "World" ("id", "title", "description", "status", "createdAt", "updatedAt")
        VALUES (default_world_id, 'Mundo Padrão', 'Mundo criado automaticamente para migração', 'ACTIVE', NOW(), NOW());
    ELSE
        -- Get first world ID
        SELECT "id" INTO default_world_id FROM "World" ORDER BY "createdAt" ASC LIMIT 1;
    END IF;

    -- Step 3: Backfill Character.worldId from campaign.worldId
    UPDATE "Character"
    SET "worldId" = (
        SELECT c."worldId"
        FROM "Campaign" c
        WHERE c."id" = "Character"."campaignId"
        LIMIT 1
    )
    WHERE "worldId" IS NULL;

    -- If any Character still has null worldId (shouldn't happen, but fallback)
    UPDATE "Character"
    SET "worldId" = default_world_id
    WHERE "worldId" IS NULL;

    -- Step 4: Backfill Npc.worldId from campaign.worldId
    UPDATE "Npc"
    SET "worldId" = (
        SELECT c."worldId"
        FROM "Campaign" c
        WHERE c."id" = "Npc"."campaignId"
        LIMIT 1
    )
    WHERE "worldId" IS NULL;

    -- If any Npc still has null worldId (shouldn't happen, but fallback)
    UPDATE "Npc"
    SET "worldId" = default_world_id
    WHERE "worldId" IS NULL;

    -- Step 5: Backfill Session.worldId from campaign.worldId
    UPDATE "Session"
    SET "worldId" = (
        SELECT c."worldId"
        FROM "Campaign" c
        WHERE c."id" = "Session"."campaignId"
        LIMIT 1
    )
    WHERE "worldId" IS NULL;

    -- If any Session still has null worldId (shouldn't happen, but fallback)
    UPDATE "Session"
    SET "worldId" = default_world_id
    WHERE "worldId" IS NULL;

    -- Step 6: Backfill SessionSummary.worldId from campaign.worldId or session.campaignId
    UPDATE "SessionSummary"
    SET "worldId" = (
        SELECT c."worldId"
        FROM "Campaign" c
        WHERE c."id" = "SessionSummary"."campaignId"
        LIMIT 1
    )
    WHERE "worldId" IS NULL AND "campaignId" IS NOT NULL;

    -- Fallback for SessionSummary without campaignId: try to get from Session
    UPDATE "SessionSummary"
    SET "worldId" = (
        SELECT s."worldId"
        FROM "Session" s
        WHERE s."id" = "SessionSummary"."sessionId"
        LIMIT 1
    )
    WHERE "worldId" IS NULL;

    -- Final fallback for SessionSummary
    UPDATE "SessionSummary"
    SET "worldId" = default_world_id
    WHERE "worldId" IS NULL;

    -- Step 7: Backfill RulesetDocument.worldId with default (no campaign relation)
    UPDATE "RulesetDocument"
    SET "worldId" = default_world_id
    WHERE "worldId" IS NULL;
END $$;

-- Step 8: Make columns NOT NULL
ALTER TABLE "Character" ALTER COLUMN "worldId" SET NOT NULL;
ALTER TABLE "Npc" ALTER COLUMN "worldId" SET NOT NULL;
ALTER TABLE "RulesetDocument" ALTER COLUMN "worldId" SET NOT NULL;
ALTER TABLE "Session" ALTER COLUMN "worldId" SET NOT NULL;
ALTER TABLE "SessionSummary" ALTER COLUMN "worldId" SET NOT NULL;

-- Step 9: Create indexes
CREATE INDEX "Character_worldId_idx" ON "Character"("worldId");
CREATE INDEX "Npc_worldId_idx" ON "Npc"("worldId");
CREATE INDEX "RulesetDocument_worldId_idx" ON "RulesetDocument"("worldId");
CREATE INDEX "Session_worldId_idx" ON "Session"("worldId");
CREATE INDEX "SessionSummary_worldId_idx" ON "SessionSummary"("worldId");

-- Step 10: Add foreign keys
ALTER TABLE "Character" ADD CONSTRAINT "Character_worldId_fkey" FOREIGN KEY ("worldId") REFERENCES "World"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Npc" ADD CONSTRAINT "Npc_worldId_fkey" FOREIGN KEY ("worldId") REFERENCES "World"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RulesetDocument" ADD CONSTRAINT "RulesetDocument_worldId_fkey" FOREIGN KEY ("worldId") REFERENCES "World"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Session" ADD CONSTRAINT "Session_worldId_fkey" FOREIGN KEY ("worldId") REFERENCES "World"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SessionSummary" ADD CONSTRAINT "SessionSummary_worldId_fkey" FOREIGN KEY ("worldId") REFERENCES "World"("id") ON DELETE CASCADE ON UPDATE CASCADE;
