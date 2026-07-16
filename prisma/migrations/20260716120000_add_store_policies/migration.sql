CREATE TABLE "StorePolicy" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "privacyPolicy" TEXT,
    "serviceTerms" TEXT,
    "reservationTerms" TEXT,
    "returnRefundPolicy" TEXT,
    "paymentShippingPolicy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StorePolicy_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StorePolicy_merchantId_key" ON "StorePolicy"("merchantId");

ALTER TABLE "StorePolicy" ADD CONSTRAINT "StorePolicy_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
