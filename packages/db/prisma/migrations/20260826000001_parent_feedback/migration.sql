-- CreateTable
CREATE TABLE "parent_feedback" (
    "id" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "rating" TEXT NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "parent_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "parent_feedback_parentId_idx" ON "parent_feedback"("parentId");

-- AddForeignKey
ALTER TABLE "parent_feedback" ADD CONSTRAINT "parent_feedback_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
