# ECPay Sandbox Payment Test

This project supports mock payments for automated local E2E tests and ECPay Sandbox for manual payment verification. Do not use production payment credentials in this phase.

The CheckMacValue flow should follow the official ECPay AIO documentation:

- Exclude only `CheckMacValue` from the source parameters.
- Sort parameters alphabetically by key.
- Prefix with `HashKey` and suffix with `HashIV`.
- URL encode using the ECPay-compatible conversion table.
- Convert to lowercase.
- SHA256 hash.
- Convert the final hash to uppercase.

Run the local official-example check before Sandbox verification:

```bash
npm run test:payment:checkmac
```

## Required Environment

Set these values in a local or preview environment dedicated to sandbox testing:

- `PAYMENT_PROVIDER=ecpay`
- `PAYMENT_MODE=sandbox`
- `ECPAY_MERCHANT_ID`
- `ECPAY_HASH_KEY`
- `ECPAY_HASH_IV`
- `ECPAY_RETURN_URL=https://your-domain.example/api/payments/ecpay/webhook`
- `ECPAY_CLIENT_BACK_URL=https://your-domain.example/account/orders`
- `ECPAY_ORDER_RESULT_URL=https://your-domain.example/checkout/success`

Keep automated CI and Playwright tests on `PAYMENT_PROVIDER=mock` unless the test is explicitly designed to leave the site and use ECPay Sandbox.

## Happy Path: pending to paid

1. Start the app with the ECPay sandbox env above.
2. Add a published product with stock to the cart.
3. Complete checkout.
4. Confirm the created order remains `pending` with `paymentStatus=pending`.
5. Confirm the app redirects to `/checkout/payment/[paymentId]`.
6. Confirm that page submits a form to ECPay Sandbox.
7. Complete the sandbox payment.
8. Confirm ECPay calls `/api/payments/ecpay/webhook`.
9. Confirm the matching `Payment` is updated to `paid`.
10. Confirm the matching `Order` is updated to `status=paid` and `paymentStatus=paid`.
11. Confirm `/admin/orders/[id]` shows provider, merchant trade number, transaction number, and paid time.
12. Confirm `PaymentWebhookLog` has a valid-signature entry with a successful processing status.

## Duplicate Webhook Idempotency

1. Capture one valid ECPay sandbox webhook payload from logs or a request inspector.
2. Send the exact same payload to `/api/payments/ecpay/webhook` twice.
3. Confirm both responses are accepted only after a valid CheckMacValue.
4. Confirm the order remains paid.
5. Confirm only one payment success status transition is written for that order.
6. Confirm stock is not deducted again. Stock is deducted when the order is created, not when the payment webhook is received.
7. Confirm `PaymentWebhookLog` stores both callback attempts and shows the duplicate as already processed.

## Failed or Cancelled Payment

1. Start checkout with ECPay Sandbox.
2. Cancel or fail the sandbox payment.
3. Confirm the order does not become paid.
4. If ECPay sends a failed callback, confirm the matching `Payment` is marked `failed`.
5. If the callback message indicates cancellation, confirm the matching `Payment` is marked `cancelled`.
6. If the callback message indicates expiry, confirm the matching `Payment` is marked `expired`.
7. Confirm no credit card data is stored in the database.

## Production Readiness Notes

- Verify the CheckMacValue implementation against the current official ECPay AIO documentation before production.
- Use only production credentials in production Vercel env values.
- Add alerting for failed webhook validation before enabling real payments.
- Add a manual finance reconciliation process for the first production release.
