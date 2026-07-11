# ECPay Sandbox Test Report

Test date: 2026-07-12  
Environment: local development against PostgreSQL on `localhost:5433`  
Production mode: disabled. `ENABLE_ECPAY_PRODUCTION` remains `false`.

## Summary

This round completed code-level and local workflow validation for the ECPay Sandbox integration, but did not complete a live ECPay Sandbox payment in the ECPay hosted cashier page because the local environment does not currently provide sandbox credentials or a public HTTPS webhook URL.

Automated local checkout coverage remains on the mock payment provider. This is intentional because normal E2E tests should not leave the app and depend on an external payment provider.

## Environment Check

Detected local env files:

- `.env`
- `.env.local`
- `.env.production.local`

The local files did not expose detectable ECPay sandbox keys for:

- `ECPAY_MERCHANT_ID`
- `ECPAY_HASH_KEY`
- `ECPAY_HASH_IV`

Do not write real sandbox or production credentials into this report or commit them to Git.

## Automated Checks Completed

- `npx prisma validate`: passed.
- `npx prisma generate`: passed.
- `npm run test:payment:checkmac`: passed.
- `npm run build`: passed.
- `npm run test:e2e` with `E2E_PORT=3001`: passed, 11/11.

The CheckMacValue test verifies:

- ECPay AIO outgoing payment CheckMacValue example.
- Payment callback CheckMacValue round trip.
- Refund callback CheckMacValue round trip.
- AES Data encryption/decryption helper round trip.

## Checkout Order Creation

Automated E2E coverage with the mock provider passed:

- Checkout creates an order.
- Backend recalculates totals from cart and products.
- Customer can view the order from `/account/orders`.
- Admin can view the order from `/admin/orders`.
- Admin can update order status.
- Admin can export CSV.

ECPay-specific live checkout was not completed in this round because sandbox env values and a public HTTPS callback URL were not available.

Expected ECPay Sandbox behavior to verify manually:

- Order status remains `pending` after checkout creates the payment.
- `Payment.status` remains `pending`.
- A `Payment` record is created with provider `ecpay`.
- Checkout redirects to `/checkout/payment/[paymentId]`.
- The payment page posts to `https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5`.

## ECPay Payment Page Validation

Code inspection confirms the ECPay provider prepares these fields:

- `MerchantID`
- `MerchantTradeNo`
- `MerchantTradeDate`
- `PaymentType=aio`
- `TotalAmount`
- `TradeDesc`
- `ItemName`
- `ReturnURL`
- `ChoosePayment=ALL`
- `EncryptType=1`
- optional `ClientBackURL`
- optional `OrderResultURL`
- `CheckMacValue`

Manual sandbox validation still required:

- Confirm `MerchantTradeNo` matches the local `Payment.merchantTradeNo`.
- Confirm `TotalAmount` matches backend-calculated `Order.total`.
- Confirm `ReturnURL` points to `/api/payments/ecpay/webhook`.
- Confirm `OrderResultURL` points to the intended checkout result page.
- Confirm the outgoing `CheckMacValue` matches the ECPay sandbox cashier acceptance.

## Payment Success Webhook

Code path reviewed:

- Endpoint: `POST /api/payments/ecpay/webhook`.
- Verifies `CheckMacValue` before updating payment data.
- Validates `MerchantTradeNo`.
- Validates callback amount against backend `Order.total`.
- Updates `Payment.status` to `paid` on success.
- Updates `Order.status` and `Order.paymentStatus` to `paid` on success.
- Writes `PaymentWebhookLog`.

Duplicate webhook handling:

- If payment and order are already paid, the webhook returns an `already_processed` result.
- Stock is not deducted by the webhook; stock is deducted during order creation, so duplicate payment callbacks should not deduct stock again.

Manual sandbox validation still required:

- Complete one ECPay Sandbox payment.
- Confirm ECPay calls the configured `ReturnURL`.
- Submit the same valid callback payload twice.
- Confirm the second log is recorded as already processed and no duplicate paid transition is created.

## Failed, Cancelled, and Expired Payments

Code path reviewed:

- Non-success callbacks do not mark the order paid.
- `RtnMsg` is mapped to `failed`, `cancelled`, or `expired`.
- `Order.paymentStatus` is updated to the resolved non-paid payment state.

Manual sandbox validation still required:

- Cancel a sandbox payment and confirm the order does not become paid.
- Simulate or capture a failed callback and confirm `Payment.status=failed`.
- Simulate or capture an expired callback and confirm `Payment.status=expired`.
- Confirm the admin order detail page shows the payment status.

## Refund Flow

Code path reviewed:

- Admin refund action calls `createEcpaySandboxRefund`.
- Refunds are allowed only for paid ECPay orders.
- Refund amount must be greater than zero.
- Total requested, processing, and succeeded refunds cannot exceed paid amount.
- Production refund remains guarded by `ENABLE_ECPAY_PRODUCTION`.
- If sandbox refund API is not explicitly enabled, the refund request is recorded without calling ECPay.
- Refund notification endpoint: `POST /api/payments/ecpay/refund-webhook`.
- Refund webhook verifies CheckMacValue.
- Refund webhook can decrypt or parse `Data`.
- Refund webhook updates `PaymentRefund.status` to `succeeded`.
- Repeated refund webhook for an already succeeded refund returns `already_processed`.

Manual sandbox validation still required:

- Enable sandbox refund API only in a sandbox environment.
- Request a refund for a paid sandbox order.
- Confirm ECPay refund response is recorded.
- Confirm ECPay refund webhook updates the matching `PaymentRefund`.
- Send the same refund webhook twice and confirm the second call is idempotent.

## Reconciliation Exercise

Local reconciliation runbook updated in `docs/payment-reconciliation.md`.

Manual reconciliation still required after one live sandbox transaction:

- Compare local `Order.id`.
- Compare local `Payment.merchantTradeNo`.
- Compare local `Payment.transactionId` with ECPay `TradeNo`.
- Compare local `Order.total` with ECPay amount.
- Compare local `PaymentRefund.amount` and status with ECPay refund record.
- Review `PaymentWebhookLog` for each payment and refund callback.

## Passed Items

- Production mode remains disabled.
- Prisma schema validation passed.
- Prisma Client generation passed.
- CheckMacValue and AES helper tests passed.
- Local build passed.
- Local E2E suite passed, 11/11.
- Mock payment success and failure workflows remain healthy.
- Server-side amount recalculation is used in checkout service.
- ECPay webhook code verifies CheckMacValue and amount before marking paid.
- Duplicate paid webhook is designed to be idempotent.
- Refund webhook is designed to be idempotent for already succeeded refunds.

## Failed or Blocked Items

- Live ECPay Sandbox cashier page was not tested because sandbox credentials were not available in local env.
- Live ECPay payment webhook was not tested because no public HTTPS webhook URL was configured for this local run.
- Live failed, cancelled, and expired ECPay sandbox callbacks were not tested.
- Live ECPay sandbox refund API and refund webhook were not tested.
- ECPay back-office reconciliation was not completed because no live sandbox transaction was created in this run.

## Production Readiness Status

Production mode remains forbidden.

Do not set `ENABLE_ECPAY_PRODUCTION=true` until all of these are complete:

- ECPay sandbox credentials are configured in a non-production environment.
- Public HTTPS `ReturnURL`, `OrderResultURL`, and `RefundNotifyURL` are configured.
- One successful sandbox payment is completed.
- Duplicate payment webhook idempotency is verified.
- Failed, cancelled, and expired payment behavior is verified.
- One sandbox refund and refund webhook are verified.
- Finance reconciliation is performed against ECPay back-office records.
- Monitoring/alerting exists for failed `PaymentWebhookLog` rows.
