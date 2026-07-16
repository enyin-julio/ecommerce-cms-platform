ALTER TABLE "Page" ADD COLUMN "showInNavigation" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Page" ADD COLUMN "navigationGroup" TEXT;
ALTER TABLE "Page" ADD COLUMN "navigationOrder" INTEGER NOT NULL DEFAULT 0;

CREATE INDEX "Page_merchantId_showInNavigation_navigationGroup_idx" ON "Page"("merchantId", "showInNavigation", "navigationGroup");
