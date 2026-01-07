-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "system" VARCHAR(40) NOT NULL DEFAULT 'TORMENTA_20',
    "rulesetId" VARCHAR(50) NOT NULL DEFAULT 'tormenta20',
    "description" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Character" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "role" VARCHAR(120),
    "level" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Character_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reveal" (
    "id" TEXT NOT NULL,
    "roomCode" VARCHAR(12) NOT NULL,
    "type" VARCHAR(12) NOT NULL,
    "title" VARCHAR(180) NOT NULL,
    "content" JSONB NOT NULL,
    "imageUrl" VARCHAR(500),
    "visibility" VARCHAR(16) NOT NULL DEFAULT 'players',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "Reveal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CharacterSheet" (
    "id" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "for" INTEGER NOT NULL DEFAULT 10,
    "des" INTEGER NOT NULL DEFAULT 10,
    "con" INTEGER NOT NULL DEFAULT 10,
    "int" INTEGER NOT NULL DEFAULT 10,
    "sab" INTEGER NOT NULL DEFAULT 10,
    "car" INTEGER NOT NULL DEFAULT 10,
    "pvCurrent" INTEGER NOT NULL DEFAULT 0,
    "pvMax" INTEGER NOT NULL DEFAULT 0,
    "pmCurrent" INTEGER NOT NULL DEFAULT 0,
    "pmMax" INTEGER NOT NULL DEFAULT 0,
    "attackBonus" INTEGER NOT NULL DEFAULT 0,
    "damageFormula" TEXT NOT NULL DEFAULT '1d6',
    "critRange" INTEGER NOT NULL DEFAULT 20,
    "critMultiplier" INTEGER NOT NULL DEFAULT 2,
    "defenseFinal" INTEGER NOT NULL DEFAULT 10,
    "notes" TEXT,

    CONSTRAINT "CharacterSheet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Combat" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "round" INTEGER NOT NULL DEFAULT 1,
    "turnIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Combat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Combatant" (
    "id" TEXT NOT NULL,
    "combatId" TEXT NOT NULL,
    "kind" VARCHAR(16) NOT NULL,
    "refId" VARCHAR(120) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "initiative" INTEGER NOT NULL DEFAULT 0,
    "hpCurrent" INTEGER NOT NULL DEFAULT 0,
    "hpMax" INTEGER NOT NULL DEFAULT 0,
    "mpCurrent" INTEGER NOT NULL DEFAULT 0,
    "mpMax" INTEGER NOT NULL DEFAULT 0,
    "isPlayerVisible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Combatant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CombatEvent" (
    "id" TEXT NOT NULL,
    "combatId" TEXT NOT NULL,
    "ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actorName" VARCHAR(200) NOT NULL,
    "type" VARCHAR(16) NOT NULL,
    "payloadJson" JSONB NOT NULL,
    "visibility" VARCHAR(12) NOT NULL DEFAULT 'PLAYERS',

    CONSTRAINT "CombatEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Character_campaignId_idx" ON "Character"("campaignId");

-- CreateIndex
CREATE INDEX "Reveal_roomCode_createdAt_idx" ON "Reveal"("roomCode", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CharacterSheet_characterId_key" ON "CharacterSheet"("characterId");

-- CreateIndex
CREATE UNIQUE INDEX "Combat_campaignId_key" ON "Combat"("campaignId");

-- CreateIndex
CREATE INDEX "Combatant_combatId_idx" ON "Combatant"("combatId");

-- CreateIndex
CREATE INDEX "CombatEvent_combatId_ts_idx" ON "CombatEvent"("combatId", "ts");

-- AddForeignKey
ALTER TABLE "Character" ADD CONSTRAINT "Character_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterSheet" ADD CONSTRAINT "CharacterSheet_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Combat" ADD CONSTRAINT "Combat_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Combatant" ADD CONSTRAINT "Combatant_combatId_fkey" FOREIGN KEY ("combatId") REFERENCES "Combat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CombatEvent" ADD CONSTRAINT "CombatEvent_combatId_fkey" FOREIGN KEY ("combatId") REFERENCES "Combat"("id") ON DELETE CASCADE ON UPDATE CASCADE;
