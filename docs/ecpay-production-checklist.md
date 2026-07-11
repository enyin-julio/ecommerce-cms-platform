# ECPay Production Checklist

Production mode is intentionally disabled by default. Do not set production keys until this checklist is complete.

## Required Production Env Names

Set these in the hosting provider production environment only:

- `PAYMENT_PROVIDER=ecpay`
- `PAYMENT_MODE=production`
- `ENABLE_ECPAY_PRODUCTION=true`
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

Keep `ENABLE_ECPAY_PRODUCTION=false` until:

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

This codebase has a sandbox-only refund request flow. Production refund API calls must not be enabled until the refund API adapter, approval controls, and live ECPay callback decryption are implemented and verified.
