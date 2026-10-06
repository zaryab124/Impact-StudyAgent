-- CreateEnum
CREATE TYPE "GranularScope" AS ENUM ('SUBTOPIC', 'HEADING', 'EXERCISE_QUESTION');

-- CreateTable
CREATE TABLE "SyllabusGranularItem" (
    "id" TEXT NOT NULL,
    "syllabusTopicItemId" TEXT NOT NULL,
    "scope" "GranularScope" NOT NULL,
    "identifier" TEXT NOT NULL,
    "title" TEXT,
    "isIncluded" BOOLEAN NOT NULL,
    "eligibility" "EligibilityStatus" NOT NULL,
    "sourceDocument" TEXT,
    "sourcePage" INTEGER,
    "sourceReference" TEXT,
    "effectiveDate" TIMESTAMP(3),
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "verifiedBy" TEXT,
    "verificationNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SyllabusGranularItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SyllabusGranularItem_syllabusTopicItemId_idx" ON "SyllabusGranularItem"("syllabusTopicItemId");

-- CreateIndex
CREATE INDEX "SyllabusGranularItem_scope_identifier_idx" ON "SyllabusGranularItem"("scope", "identifier");

-- CreateIndex
CREATE INDEX "SyllabusGranularItem_eligibility_idx" ON "SyllabusGranularItem"("eligibility");

-- CreateIndex
CREATE UNIQUE INDEX "SyllabusGranularItem_syllabusTopicItemId_scope_identifier_key" ON "SyllabusGranularItem"("syllabusTopicItemId", "scope", "identifier");

-- AddForeignKey
ALTER TABLE "SyllabusGranularItem" ADD CONSTRAINT "SyllabusGranularItem_syllabusTopicItemId_fkey" FOREIGN KEY ("syllabusTopicItemId") REFERENCES "SyllabusTopicItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
