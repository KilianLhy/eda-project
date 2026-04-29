-- CreateTable
CREATE TABLE "FailedMessage" (
    "id" TEXT NOT NULL,
    "channelName" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "context" JSONB NOT NULL,
    "error" TEXT NOT NULL,
    "failedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FailedMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FailedMessage_failedAt_idx" ON "FailedMessage"("failedAt");
