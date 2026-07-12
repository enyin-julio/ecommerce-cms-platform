# ECPay Production Checklist

Production mode is intentionally disabled by default. Do not enable production payments until this checklist is complete.

## Current Blocker

The project does not yet have an approved ECPay production merchant account. Keep `ENABLE_ECPAY_PRODUCTION=false` until the official production merchant account is approved and the production `ECPAY_MERCHANT_ID`, `ECPAY_HASH_KEY`, and `ECPAY_HASH_IV` are safely configured in Vercel production env.

## Required Production Env Names

Set these in the hosting provider production environment only:

- `PAYMENT_PROVIDER=ecpay`
- `PAYMENT_MODE=production`
- `ENABLE_ECPAY_PRODUCTION=false`
- `ECPAY_MERCHANT_ID`
- `ECPAY_HASH_KEY`
- `ECPAY_HASH_IV`
- `ECPAY_RETURN_URL`
- `ECPAY_CLIENT_BACK_URL`
- `ECPAY_ORDER_RESULT_URL`
- `ECPAY_REFUND_NOTIFY_URL`

Never commit real values. Do not print full keys in logs or support tickets.

## URL Checklist

All production URLs must use HTTPS and the production domain.

- `ReturnURL`: `https://your-domain.example/api/payments/ecpay/webhook`
- `ClientBackURL`: `https://your-domain.example/account/orders`
- `OrderResultURL`: `https://your-domain.example/checkout/success`
- `RefundNotifyURL`: `https://your-domain.example/api/payments/ecpay/refund-webhook`

Configure the final production HTTPS URLs in ECPay back office where applicable. For refund notification, confirm the domain and firewall opening requirements with ECPay before launch.

## Production Gate

The application blocks production ECPay mode unless both are true:

- `PAYMENT_MODE=production`
- `ENABLE_ECPAY_PRODUCTION=true`

Keep `ENABLE_ECPAY_PRODUCTION=false` in Vercel production env until:

- Production database backup is complete.
- Production env values are verified.
- ECPay back office URLs are configured.
- Payment webhook and refund webhook smoke tests are complete.
- Finance reconciliation workflow is assigned to an owner.

## Pre-Launch Verification

1. Run `npm run test:payment:checkmac`.
2. Run `npm run lint`.
3. Run `npm run build`.
4. Run `npm run test:e2e`.
5. Confirm `/api/payments/ecpay/webhook` and `/api/payments/ecpay/refund-webhook` are reachable over HTTPS.
6. Confirm `PaymentWebhookLog` receives failed and successful sandbox callback records.
7. Confirm finance can reconcile `Order`, `Payment`, `PaymentRefund`, and ECPay back office records.

## Still Not Enabled

Production payments and refunds remain blocked while `ENABLE_ECPAY_PRODUCTION=false`. Only change it to `true` after final manual review, production URL confirmation, Vercel env confirmation, production smoke test, and finance reconciliation sign-off.
