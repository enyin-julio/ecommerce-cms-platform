# ECPay Production Final Review

This checklist is the final manual review before enabling ECPay production payments.

Production mode must remain disabled until every manual item below is confirmed. Do not change `ENABLE_ECPAY_PRODUCTION` to `true` from this document alone.

## Current Production Account Status

As of the latest setup review, the project does not yet have an approved ECPay production merchant account.

This means production ECPay payment cannot be enabled yet because the following official production credentials are not available:

- `ECPAY_MERCHANT_ID`
- `ECPAY_HASH_KEY`
- `ECPAY_HASH_IV`

Until the official ECPay production merchant account is approved and these credentials are added to Vercel production env, keep:

```text
ENABLE_ECPAY_PRODUCTION=false
```

The non-secret production URL and mode variables may remain prepared in Vercel, but live collection must stay blocked.

## Waiting For Production Merchant Account Mode

The current operating mode is waiting for an official ECPay production merchant account.

Current status:

- Official ECPay production merchant account: not yet available.
- Production `ECPAY_MERCHANT_ID`: not yet filled.
- Production `ECPAY_HASH_KEY`: not yet filled.
- Production `ECPAY_HASH_IV`: not yet filled.
- Production collection: prohibited.
- Production guard: must block payment when `PAYMENT_MODE=production` and `ENABLE_ECPAY_PRODUCTION` is not `true`.

The application should show this clear guard error when production mode is requested before approval:

```text
ECPay production is not enabled
```

Only after the official production merchant account is approved and the three production credentials are safely added to Vercel production env may this project enter production enablement review.

## Current Rule

- `PAYMENT_PROVIDER=ecpay` may be configured for production.
- `PAYMENT_MODE=production` may be prepared in Vercel production env.
- `ENABLE_ECPAY_PRODUCTION=false` must remain the default until final human approval.
- No production ECPay keys may be committed, printed in logs, pasted into documents, or used in preview/test environments.

## ECPay Back Office Reconciliation

Use the official ECPay merchant back office only. Confirm the browser URL, HTTPS certificate, and account identity before comparing transactions.

### Payment Transaction Review

For each production payment test or first live transaction, compare these fields between ECPay and this system:

| Review item | ECPay back office | Local database / admin |
| --- | --- | --- |
| Merchant order number | `MerchantTradeNo` | `Payment.merchantTradeNo` |
| ECPay transaction number | `TradeNo` | `Payment.transactionId` and `Order.paymentTransactionId` |
| Payment amount | Trade amount | `Payment.amount` and `Order.total` |
| Payment status | Paid / failed / cancelled result | `Payment.status` and `Order.paymentStatus` |
| Payment time | Payment date/time | `Payment.paidAt` and `Order.paidAt` |
| Provider | ECPay | `Payment.provider` and `Order.paymentProvider` |
| Callback result | ReturnURL callback result | `PaymentWebhookLog.processingStatus` |
| Signature result | CheckMacValue valid | `PaymentWebhookLog.isValidSignature=true` |

Payment reconciliation steps:

1. Open the ECPay official merchant back office.
2. Search by `MerchantTradeNo`.
3. Confirm the matching `TradeNo`.
4. Confirm the paid amount exactly matches the backend-calculated `Order.total`.
5. Confirm local `Payment.status=paid`.
6. Confirm local `Order.paymentStatus=paid`.
7. Confirm local `Order.status=paid` only after a valid signed callback.
8. Confirm duplicate callbacks are logged as already processed and do not change totals or stock again.

If any amount, transaction number, or signature result does not match, keep the order on hold and do not ship.

### Refund Transaction Review

For each refund, compare these fields between ECPay and this system:

| Review item | ECPay back office | Local database / admin |
| --- | --- | --- |
| Original merchant order number | `MerchantTradeNo` | `Payment.merchantTradeNo` |
| Original ECPay transaction number | `TradeNo` | `Payment.transactionId` |
| Merchant refund number | `MerchantRefundNo` / refund number | `PaymentRefund.providerRefundId` or provider response |
| Refund amount | Refund amount | `PaymentRefund.amount` |
| Refund status | Refund success / failure | `PaymentRefund.status` |
| Refund processed time | Refund date/time | `PaymentRefund.processedAt` |
| Refund callback result | RefundNotifyURL result | `PaymentWebhookLog.processingStatus` |
| Signature result | CheckMacValue valid | `PaymentWebhookLog.isValidSignature=true` |

Refund reconciliation steps:

1. Confirm the original order is paid before refunding.
2. Search ECPay by `MerchantTradeNo` and `TradeNo`.
3. Compare the refund amount with `PaymentRefund.amount`.
4. Confirm the refund notification was received by `RefundNotifyURL`.
5. Confirm CheckMacValue validation passed.
6. Confirm duplicate refund notifications are logged as already processed.
7. Confirm no duplicate refund is created for the same refund request.

If a refund exists in ECPay but not locally, pause fulfillment/accounting and reconcile manually before further refund actions.

### Amount Comparison Rules

- Backend order totals are the source of truth.
- Do not trust browser-submitted totals.
- Compare integer TWD amounts exactly.
- `Order.total` must equal the sum of `OrderItem.price * OrderItem.quantity`.
- `Payment.amount` must equal `Order.total`.
- ECPay trade amount must equal `Payment.amount`.
- Refund amount must not exceed the paid amount.
- Partial refund totals must not exceed the original payment amount.

## Database Field Review

Before enabling production, manually inspect at least one successful sandbox payment and one sandbox refund against these local fields.

### Order

- `Order.orderNumber`
- `Order.total`
- `Order.status`
- `Order.paymentStatus`
- `Order.paymentProvider`
- `Order.paymentTransactionId`
- `Order.paidAt`
- `Order.updatedAt`

### Payment

- `Payment.orderId`
- `Payment.provider`
- `Payment.mode`
- `Payment.merchantTradeNo`
- `Payment.transactionId`
- `Payment.amount`
- `Payment.status`
- `Payment.paidAt`
- `Payment.rawPayload`
- `Payment.updatedAt`

### Refund

- `PaymentRefund.paymentId`
- `PaymentRefund.amount`
- `PaymentRefund.reason`
- `PaymentRefund.status`
- `PaymentRefund.providerRefundId`
- `PaymentRefund.providerResponse`
- `PaymentRefund.processedAt`
- `PaymentRefund.updatedAt`

### Webhook Log

- `PaymentWebhookLog.provider`
- `PaymentWebhookLog.eventType`
- `PaymentWebhookLog.isValidSignature`
- `PaymentWebhookLog.processingStatus`
- `PaymentWebhookLog.receivedPayload`
- `PaymentWebhookLog.createdAt`

Webhook logs must not contain full production secrets, HashKey, HashIV, access tokens, or database URLs.

## Official URL Final Confirmation

All production URLs must use the official HTTPS domain. Do not use localhost, preview deployment URLs, temporary Vercel URLs, or unverified domains.

Recommended production domain:

- `https://www.aih.tw`

Confirm these URLs before enabling production:

| Purpose | Env name | Expected production URL |
| --- | --- | --- |
| Payment server callback | `ECPAY_RETURN_URL` | `https://www.aih.tw/api/payments/ecpay/webhook` |
| Customer back URL | `ECPAY_CLIENT_BACK_URL` | `https://www.aih.tw/account/orders` |
| Payment result page | `ECPAY_ORDER_RESULT_URL` | `https://www.aih.tw/checkout/success` |
| Refund notification | `ECPAY_REFUND_NOTIFY_URL` | `https://www.aih.tw/api/payments/ecpay/refund-webhook` |

Manual URL checks:

- Official domain resolves correctly.
- HTTPS certificate is valid.
- `aih.tw` redirects to the intended canonical domain.
- `www.aih.tw` is connected to the Vercel production deployment.
- ReturnURL endpoint is reachable by ECPay server POST.
- RefundNotifyURL endpoint is reachable by ECPay server POST.
- URLs are configured in the ECPay official merchant back office when required.
- Firewalls, WAF, or access protection do not block ECPay server callbacks.

## Vercel Production Env Checklist

Confirm these variables exist in Vercel production environment. Do not display or copy their values into reports.

- `ECPAY_MERCHANT_ID`
- `ECPAY_HASH_KEY`
- `ECPAY_HASH_IV`
- `ECPAY_RETURN_URL`
- `ECPAY_CLIENT_BACK_URL`
- `ECPAY_ORDER_RESULT_URL`
- `ECPAY_REFUND_NOTIFY_URL`
- `PAYMENT_PROVIDER=ecpay`
- `PAYMENT_MODE=production`
- `ENABLE_ECPAY_PRODUCTION=false`

Supporting production env should also be present and safe:

- `DATABASE_URL`
- `SESSION_SECRET`
- `COOKIE_SECRET`
- `NEXT_PUBLIC_SITE_URL=https://www.aih.tw`
- `STORAGE_PROVIDER=vercel-blob`
- `BLOB_READ_WRITE_TOKEN`

Secret checks:

- Secrets are not empty.
- Secrets are not placeholder values such as `default`, `changeme`, `test`, `demo`, `secret`, or `123456`.
- Production secrets are not reused in preview, local, or sandbox projects.

## Production Switch Rule

Only allow a human operator to set `ENABLE_ECPAY_PRODUCTION=true` after all of these are complete:

- ECPay official production merchant account has been approved.
- ECPay official production merchant account is active.
- Production ECPay keys are placed in Vercel production env.
- Production keys are not present in local, preview, sandbox, docs, commits, or logs.
- Official HTTPS domain is confirmed.
- ReturnURL is confirmed.
- ClientBackURL is confirmed.
- OrderResultURL is confirmed.
- RefundNotifyURL is confirmed.
- ECPay back office URL settings are confirmed.
- Production database backup is completed.
- Production deployment uses the intended commit.
- Production smoke test passes.
- Manual payment reconciliation is understood by operations staff.
- Manual refund reconciliation is understood by operations staff.

After enabling `ENABLE_ECPAY_PRODUCTION=true`:

1. Redeploy production.
2. Create a controlled low-risk transaction only with explicit business approval.
3. Confirm ECPay back office transaction details.
4. Confirm local `Order`, `Payment`, and `PaymentWebhookLog` fields.
5. Confirm no secret values appear in logs.
6. Keep production monitoring open during the first live payment window.

## Production Smoke Test Checklist

Run this checklist before asking for final approval. Do not run a real production card charge unless the business owner has explicitly approved it.

Storefront:

- [ ] Home page opens.
- [ ] Product list opens.
- [ ] Product detail opens.
- [ ] Product image loads.
- [ ] Cart opens.
- [ ] Cart quantity can be adjusted.
- [ ] Checkout opens.

Customer:

- [ ] Customer can sign in.
- [ ] Reload keeps the customer session.
- [ ] Customer order list opens.
- [ ] Customer order detail opens.

Admin:

- [ ] Admin login opens.
- [ ] Admin can sign in.
- [ ] Order list opens.
- [ ] Order detail opens.
- [ ] Payment status is visible.
- [ ] Refund status is visible.
- [ ] Webhook log information is visible or queryable by operations.
- [ ] CSV export works.

ECPay readiness:

- [ ] Checkout creates an order with backend-calculated amount.
- [ ] ECPay payment record is created with `pending` status.
- [ ] ReturnURL updates only after valid CheckMacValue.
- [ ] RefundNotifyURL updates only after valid CheckMacValue.
- [ ] Duplicate payment callback is treated as already processed.
- [ ] Duplicate refund callback is treated as already processed.
- [ ] Reconciliation data is available for `Order`, `Payment`, `PaymentRefund`, and `PaymentWebhookLog`.

## Safety Reminders

- Do not commit ECPay production keys.
- Do not print full HashKey or HashIV in logs.
- Do not use production keys in sandbox, preview, or local testing.
- Do not use sandbox keys in production.
- Do not paste production secrets into documents, chat, tickets, screenshots, or screenshots shared externally.
- Do not trust fake ECPay login pages or copied payment links.
- Always verify the official ECPay merchant back office domain before entering credentials.
- Do not manually mark orders as paid unless finance and engineering have reconciled the transaction.
- Do not ship orders when payment amount, status, signature, or transaction number is inconsistent.

## Final Sign-Off

Use this section for manual review before production enablement.

| Item | Owner | Status | Notes |
| --- | --- | --- | --- |
| Production ECPay merchant account confirmed |  | Pending |  |
| Production keys configured in Vercel production env |  | Pending |  |
| Official HTTPS domain confirmed |  | Pending |  |
| ReturnURL confirmed |  | Pending |  |
| ClientBackURL confirmed |  | Pending |  |
| OrderResultURL confirmed |  | Pending |  |
| RefundNotifyURL confirmed |  | Pending |  |
| Production database backup completed |  | Pending |  |
| Production smoke test completed |  | Pending |  |
| Payment reconciliation procedure confirmed |  | Pending |  |
| Refund reconciliation procedure confirmed |  | Pending |  |
| Logs checked for secret exposure |  | Pending |  |
| Final approval to enable production payments |  | Pending |  |

Until every item is complete, production mode remains blocked.
