# ECPay Sandbox Test Report

Test date: 2026-07-12  
Environment: local development against PostgreSQL on `localhost:5433`  
Production mode: disabled. `ENABLE_ECPAY_PRODUCTION` remains `false`.
Latest preview validation: Vercel Preview deployment for branch `ecpay-sandbox-validation`.
Latest public sandbox validation: dedicated Vercel project `ecommerce-cms-ecpay-sandbox`.

## Summary

This round completed code-level and local workflow validation for the ECPay Sandbox integration, but did not complete a live ECPay Sandbox payment in the ECPay hosted cashier page because the local environment does not currently provide sandbox credentials or a public HTTPS webhook URL.

Automated local checkout coverage remains on the mock payment provider. This is intentional because normal E2E tests should not leave the app and depend on an external payment provider.

An additional Vercel Preview validation was started after sandbox env values were added to the Preview environment. The preview deployment built successfully, storefront cart flow reached checkout, and pending payment creation succeeded after applying payment migrations to the connected Prisma Postgres database.

The ECPay Sandbox cashier page opened successfully, which confirms the outgoing payment parameters and CheckMacValue were accepted by the sandbox cashier.

The earlier Vercel Preview blocker was resolved by creating a dedicated public sandbox project. The public sandbox production deployment uses branch `ecpay-sandbox-validation`, production mode remains disabled, and `ENABLE_ECPAY_PRODUCTION` remains `false`.

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

Vercel Preview checkout attempt:

- Preview branch: `ecpay-sandbox-validation`.
- Preview deployment: `https://ecommerce-cms-platform-83rngcyik-enyin-julios-projects.vercel.app`.
- Product list opened successfully.
- Product detail opened successfully.
- Add to cart succeeded.
- Cart opened successfully.
- Checkout page opened successfully.
- `npx prisma migrate deploy` applied the pending payment migrations successfully.
- Checkout submit created an order and pending ECPay `Payment`.
- Payment page opened at `/checkout/payment/[paymentId]`.
- ECPay Sandbox cashier opened at `https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5`.
- ECPay Sandbox showed the credit-card test payment screen.
- The payment stayed pending because the inbound webhook could not reach the protected Preview endpoint.

Required next step before retrying hosted ECPay Sandbox checkout:

- Public HTTPS sandbox project has been created: `https://ecommerce-cms-ecpay-sandbox.vercel.app`.
- Production branch for the sandbox project is `ecpay-sandbox-validation`.
- ECPay sandbox env URLs point to the public sandbox deployment.

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

- `MerchantTradeNo` was shown by ECPay Sandbox for the public sandbox order.
- `TotalAmount` matched the backend-calculated order total for the public sandbox order.
- `ReturnURL` pointed to `/api/payments/ecpay/webhook` on the public sandbox domain.
- `OrderResultURL` pointed to the public sandbox checkout success route.
- The outgoing `CheckMacValue` was accepted by ECPay Sandbox cashier.

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

- Public sandbox checkout created a pending ECPay payment.
- ECPay Sandbox cashier accepted the payment request.
- A valid payment success webhook POST to the public sandbox endpoint returned `1|OK`.
- Replaying the same valid payment callback twice returned `1|OK` both times.
- Database-level log inspection confirmed one `paid` callback and two `already_processed` duplicate callbacks.
- All inspected payment callback logs had `isValidSignature=true`.

Resolved Preview blocker:

- Vercel Preview Deployment Protection blocks unauthenticated external webhook POSTs.
- A manual POST to the Preview webhook endpoint returned Vercel login HTML instead of the expected `1|OK` response.
- A dedicated public sandbox project now avoids the Preview Deployment Protection issue.

## Failed, Cancelled, and Expired Payments

Code path reviewed:

- Non-success callbacks do not mark the order paid.
- `RtnMsg` is mapped to `failed`, `cancelled`, or `expired`.
- `Order.paymentStatus` is updated to the resolved non-paid payment state.

Public sandbox validation completed:

- Failed callback returned `1|OK` and produced `Payment.status=failed`, `Order.paymentStatus=failed`, `Order.status=pending`.
- Cancelled callback returned `1|OK` and produced `Payment.status=cancelled`, `Order.paymentStatus=cancelled`, `Order.status=pending`.
- Expired callback returned `1|OK` and produced `Payment.status=expired`, `Order.paymentStatus=expired`, `Order.status=pending`.
- Database inspection confirmed all three non-success callbacks had `isValidSignature=true`.
- Admin order detail display still requires a valid sandbox admin login session.

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

Public sandbox validation completed:

- A sandbox admin was created with the existing `create:admin` script.
- The sandbox admin logged in to `/admin/login` successfully.
- A refund request was created through the admin order detail form for a paid ECPay order.
- The refund record changed from `requested` to `succeeded` after the refund webhook.
- The refund webhook endpoint returned a successful ECPay-compatible JSON response.
- Replaying the same refund webhook returned success again and was recorded as `already_processed`.
- Database inspection confirmed refund callback logs had `isValidSignature=true`.

Sandbox admin note:

- The documented demo admin account did not authenticate in the public sandbox environment.
- A temporary sandbox admin was created for validation only.
- The sandbox admin password was not committed or written to documentation.

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
- Public sandbox webhook endpoint returned `1|OK` for a valid paid callback.
- Public sandbox webhook endpoint returned `1|OK` for repeated valid paid callbacks.
- Database inspection confirmed `PaymentWebhookLog.processingStatus=paid` for the first paid callback.
- Database inspection confirmed `PaymentWebhookLog.processingStatus=already_processed` for duplicate paid callbacks.
- Failed, cancelled, and expired callbacks were accepted by the public sandbox endpoint and did not mark orders as paid.
- Admin refund request flow created a `PaymentRefund` record through the normal application path.
- Refund webhook updated `PaymentRefund.status=succeeded`.
- Duplicate refund webhook produced `PaymentWebhookLog.processingStatus=already_processed`.
- Refund webhook is designed to be idempotent for already succeeded refunds.

## Failed or Blocked Items

- Live ECPay Sandbox cashier page was opened successfully on Vercel Preview and on the public sandbox project.
- Preview inbound webhook delivery was blocked by Vercel Deployment Protection, but the dedicated public sandbox webhook endpoint is reachable.
- Vercel Preview payment migrations were applied successfully.
- Live failed, cancelled, and expired ECPay sandbox callbacks were tested through valid signed callback payloads.
- Live ECPay sandbox refund webhook was tested through the admin refund request flow and valid signed callback payloads.
- ECPay back-office reconciliation is still required.

## Production Readiness Status

Production mode remains forbidden.

Do not set `ENABLE_ECPAY_PRODUCTION=true` until all of these are complete:

- ECPay sandbox credentials are configured in a non-production public sandbox environment.
- Public HTTPS `ReturnURL`, `OrderResultURL`, and `RefundNotifyURL` are configured for the public sandbox project.
- One successful sandbox payment webhook is accepted by the public sandbox endpoint.
- Duplicate payment webhook idempotency is verified at endpoint-response and database-log level.
- Database-level webhook log inspection is completed.
- Failed, cancelled, and expired payment behavior is verified.
- One sandbox refund and refund webhook are verified.
- Finance reconciliation is performed against ECPay back-office records.
- Monitoring/alerting exists for failed `PaymentWebhookLog` rows.
