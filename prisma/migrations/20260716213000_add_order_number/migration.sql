-- Add a customer-facing order number while keeping the internal cuid primary key.
ALTER TABLE "Order" ADD COLUMN "orderNumber" TEXT;

CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");
