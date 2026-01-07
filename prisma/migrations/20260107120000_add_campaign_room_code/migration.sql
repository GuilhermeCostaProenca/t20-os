-- Add roomCode to Campaign
ALTER TABLE "Campaign" ADD COLUMN "roomCode" VARCHAR(12);

UPDATE "Campaign"
SET "roomCode" = UPPER(SUBSTRING(MD5(id), 1, 8))
WHERE "roomCode" IS NULL;

ALTER TABLE "Campaign" ALTER COLUMN "roomCode" SET NOT NULL;

CREATE UNIQUE INDEX "Campaign_roomCode_key" ON "Campaign"("roomCode");
