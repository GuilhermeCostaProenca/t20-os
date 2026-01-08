-- CreateTable
CREATE TABLE "Npc" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "type" VARCHAR(12) NOT NULL DEFAULT 'npc',
    "hpMax" INTEGER NOT NULL DEFAULT 1,
    "defenseFinal" INTEGER NOT NULL DEFAULT 10,
    "damageFormula" VARCHAR(50) NOT NULL DEFAULT '1d6',
    "description" VARCHAR(1000),
    "tags" VARCHAR(500),
    "imageUrl" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Npc_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Npc_campaignId_idx" ON "Npc"("campaignId");

-- AddForeignKey
ALTER TABLE "Npc" ADD CONSTRAINT "Npc_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
