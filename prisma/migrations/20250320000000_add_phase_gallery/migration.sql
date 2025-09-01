-- CreateTable for PhaseGallery join table
CREATE TABLE "_PhaseGallery" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_PhaseGallery_AB_unique" ON "_PhaseGallery"("A", "B");

-- CreateIndex
CREATE INDEX "_PhaseGallery_B_index" ON "_PhaseGallery"("B");

-- AddForeignKey
ALTER TABLE "_PhaseGallery" ADD CONSTRAINT "_PhaseGallery_A_fkey" FOREIGN KEY ("A") REFERENCES "media"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PhaseGallery" ADD CONSTRAINT "_PhaseGallery_B_fkey" FOREIGN KEY ("B") REFERENCES "project_phase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Rename the existing relation for compatibility
ALTER TABLE "project_phase" DROP CONSTRAINT IF EXISTS "project_phase_mediaId_fkey";

-- Re-add the constraint with the new relation name
ALTER TABLE "project_phase" ADD CONSTRAINT "project_phase_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE CASCADE;