# Production Smoke Test Report

## Test Summary

- Test date: 2026-07-12 Asia/Taipei
- Production URL: `https://www.aih.tw`
- Production deployment commit: `c824aea`
- Branch: `main`
- Payment mode: waiting for official ECPay production merchant account
- Production ECPay collection: disabled
- Production payment guard: active

No secrets, passwords, database URLs, ECPay keys, or customer private data are recorded in this report.

## Passed

Storefront:

- Homepage opens: `https://www.aih.tw`
- Product list opens: `https://www.aih.tw/products`
- Product detail opens: `https://www.aih.tw/products/test-smoke-product`
- Product can be added to cart.
- Cart opens and shows the test product and total.
- Checkout page opens.

Checkout safety:

- Checkout no longer crashes when production ECPay is disabled.
- Submitting checkout while `PAYMENT_MODE=production` and `ENABLE_ECPAY_PRODUCTION=false` redirects to:
  `https://www.aih.tw/checkout?error=payment-not-enabled`
- Checkout displays a clear message:
  `正式付款尚未啟用。目前仍在等待綠界正式商店帳號審核，請先不要建立正式付款訂單。`
- No real payment is triggered.

Admin:

- `/admin/login` opens.
- Unauthenticated `/admin` access redirects to `/admin/login`.

Local verification:

- `npm.cmd run build` passed.
- `npm.cmd run test:payment:checkmac` passed.
- `npm.cmd run test:e2e` passed with 11 tests.

Vercel:

- `main` was updated to commit `dec9b8d`.
- Follow-up checkout guard fix was deployed from commit `c824aea`.
- Vercel production deployment for `c824aea` is Ready.

## Fixed During This Smoke Test

Checkout production guard issue:

- Before the fix, checkout could render the form, but submitting while ECPay production was disabled caused the application error page.
- The order flow also risked creating a pending order before the payment provider rejected production mode.
- The fix now checks ECPay production availability before creating the order, deducting stock, or clearing the cart.
- The checkout action redirects to a friendly checkout error state instead of showing a generic system error.

Files changed:

- `src/modules/cart/cart.service.ts`
- `src/app/cart/actions.ts`
- `src/app/checkout/page.tsx`

## Failed Or Incomplete

No blocking production smoke test failure remains for the tested public flow.

Items not fully tested because they require production credentials or manual operator access:

- Production admin login with a real admin account.
- Media upload to Vercel Blob from production admin.
- CSV export from production admin.
- Order status update from production admin.
- ECPay production payment.
- ECPay production refund.

## Cleanup Required Before Real Operations

Production currently contains test operational data:

- A visible `TEST Smoke 商品`.
- A `TEST SMOKE` category.
- At least one smoke-test cart/order attempt may have reduced test stock before the checkout guard fix was deployed.

Before real customer operations:

- Remove or unpublish smoke-test products and categories.
- Remove or clearly archive smoke-test orders.
- Confirm no demo/test accounts are used for real operations.
- Confirm production `ALLOW_PRODUCTION_SEED=false`.

## ECPay Status

The project is still waiting for an official ECPay production merchant account.

Keep:

```text
ENABLE_ECPAY_PRODUCTION=false
```

Do not enable production ECPay collection until:

- The official ECPay production merchant account is approved.
- Production `ECPAY_MERCHANT_ID`, `ECPAY_HASH_KEY`, and `ECPAY_HASH_IV` are safely configured in Vercel production env.
- ReturnURL, ClientBackURL, OrderResultURL, and RefundNotifyURL are configured in the official ECPay back office.
- Production smoke test and reconciliation review are completed.

## Next Recommended Step

Clean production test data through the admin dashboard, then rerun a reduced production smoke test:

- Homepage
- Product list
- Product detail
- Cart
- Checkout disabled-payment guard
- Admin login
- Media upload
- Order list
- CSV export
