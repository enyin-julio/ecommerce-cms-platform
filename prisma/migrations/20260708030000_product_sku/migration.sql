-- AlterTable
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "sku" TEXT;
UPDATE "Product" SET "sku" = "id" WHERE "sku" IS NULL OR "sku" = '';
ALTER TABLE "Product" ALTER COLUMN "sku" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Product_sku_key" ON "Product"("sku");
