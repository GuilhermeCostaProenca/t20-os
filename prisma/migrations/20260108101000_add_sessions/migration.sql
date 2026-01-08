-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" VARCHAR(1000),
    "coverUrl" VARCHAR(500),
    "scheduledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Session_campaignId_scheduledAt_idx" ON "Session"("campaignId", "scheduledAt");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
