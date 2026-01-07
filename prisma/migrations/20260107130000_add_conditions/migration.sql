-- CreateTable
CREATE TABLE "Condition" (
    "id" TEXT NOT NULL,
    "rulesetId" VARCHAR(50) NOT NULL,
    "key" VARCHAR(80) NOT NULL,
    "name" VARCHAR(180) NOT NULL,
    "description" VARCHAR(500),
    "effectsJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Condition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppliedCondition" (
    "id" TEXT NOT NULL,
    "combatId" TEXT NOT NULL,
    "targetCombatantId" TEXT NOT NULL,
    "conditionId" TEXT NOT NULL,
    "sourceEventId" TEXT,
    "expiresAtTurn" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AppliedCondition_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Condition_rulesetId_key_key" ON "Condition"("rulesetId", "key");

-- CreateIndex
CREATE INDEX "Condition_rulesetId_idx" ON "Condition"("rulesetId");

-- CreateIndex
CREATE INDEX "AppliedCondition_combatId_idx" ON "AppliedCondition"("combatId");

-- CreateIndex
CREATE INDEX "AppliedCondition_targetCombatantId_idx" ON "AppliedCondition"("targetCombatantId");

-- CreateIndex
CREATE INDEX "AppliedCondition_conditionId_idx" ON "AppliedCondition"("conditionId");

-- CreateIndex
CREATE INDEX "AppliedCondition_sourceEventId_idx" ON "AppliedCondition"("sourceEventId");

-- AddForeignKey
ALTER TABLE "AppliedCondition" ADD CONSTRAINT "AppliedCondition_combatId_fkey" FOREIGN KEY ("combatId") REFERENCES "Combat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppliedCondition" ADD CONSTRAINT "AppliedCondition_targetCombatantId_fkey" FOREIGN KEY ("targetCombatantId") REFERENCES "Combatant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppliedCondition" ADD CONSTRAINT "AppliedCondition_conditionId_fkey" FOREIGN KEY ("conditionId") REFERENCES "Condition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppliedCondition" ADD CONSTRAINT "AppliedCondition_sourceEventId_fkey" FOREIGN KEY ("sourceEventId") REFERENCES "CombatEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
