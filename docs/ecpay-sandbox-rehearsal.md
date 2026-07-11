# ECPay Sandbox Rehearsal

Use this rehearsal before enabling production mode. Keep `PAYMENT_MODE=sandbox`.

## Payment Success

1. Set `PAYMENT_PROVIDER=ecpay`.
2. Set `PAYMENT_MODE=sandbox`.
3. Configure sandbox `ECPAY_MERCHANT_ID`, `ECPAY_HASH_KEY`, `ECPAY_HASH_IV`.
4. Configure HTTPS or tunnel URLs:
   - `ECPAY_RETURN_URL`
   - `ECPAY_CLIENT_BACK_URL`
   - `ECPAY_ORDER_RESULT_URL`
5. Complete checkout from the storefront.
6. Confirm the app creates `Order.status=pending` and `Payment.status=pending`.
7. Complete ECPay Sandbox payment.
8. Confirm `/api/payments/ecpay/webhook` receives callback.
9. Confirm `Payment.status=paid` and `Order.paymentStatus=paid`.
10. Confirm `PaymentWebhookLog.processingStatus=paid` or `already_processed`.

## Refund Success

1. Confirm the order is paid and has an ECPay payment.
2. Keep `PAYMENT_MODE=sandbox`.
3. Set `ECPAY_REFUND_API_ENABLED=true` only for this sandbox rehearsal.
4. In `/admin/orders/[id]`, submit a refund request.
5. Confirm `PaymentRefund.status=processing` after ECPay accepts the refund API request.
6. Confirm ECPay later calls `ECPAY_REFUND_NOTIFY_URL`.
7. Confirm `/api/payments/ecpay/refund-webhook` verifies `CheckMacValue`.
8. Confirm `PaymentRefund.status=succeeded` when `RefundStatus=1`.

## Duplicate Webhook

1. Replay the same payment webhook payload.
2. Confirm the order remains paid and no duplicate paid transition is created.
3. Replay the same refund webhook payload.
4. Confirm the refund remains succeeded and no duplicate refund state change is created.
5. Confirm every replay still creates an auditable `PaymentWebhookLog` row.

## Manual Reconciliation

1. Export `/admin/orders` for the rehearsal date.
2. Open ECPay Sandbox transaction records.
3. Match `Payment.merchantTradeNo` with ECPay merchant trade number.
4. Match `Order.total` with ECPay payment amount.
5. Match `PaymentRefund.providerRefundId` with ECPay refund trade number.
6. Match `PaymentRefund.amount` with ECPay refund amount.
7. Review all failed `PaymentWebhookLog` rows and resolve before production.
