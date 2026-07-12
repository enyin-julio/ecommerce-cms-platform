# Go-Live And Operations Checklist

Use this checklist before launch, after redeploys, and after environment
variable changes.

## Storefront

- [ ] Homepage opens.
- [ ] Product list opens.
- [ ] Product detail opens.
- [ ] CMS landing page opens.
- [ ] CMS content page opens.
- [ ] Mobile layout is readable and usable.

## Cart And Checkout

- [ ] Product can be added to cart.
- [ ] Cart page shows line items and totals.
- [ ] Quantity can be updated.
- [ ] Item can be removed.
- [ ] Checkout opens.
- [ ] TEST order can be created without real payment.
- [ ] TEST order appears in admin.

## Admin

- [ ] `/admin/login` opens.
- [ ] Production admin can log in.
- [ ] Customer account cannot enter admin.
- [ ] Merchant account only sees merchant-owned data.
- [ ] Product management opens.
- [ ] Media library opens.
- [ ] CMS page management opens.
- [ ] Order list opens.
- [ ] Order detail opens.
- [ ] Order status can be updated according to status flow rules.

## Media

- [ ] Vercel Blob Store connected to project is public for storefront images.
- [ ] Production env includes Blob variables.
- [ ] `STORAGE_PROVIDER=vercel-blob`.
- [ ] JPG upload succeeds.
- [ ] PNG upload succeeds.
- [ ] WebP upload succeeds if needed.
- [ ] Uploaded image URL opens in a browser.

## CSV Export

- [ ] `/admin/orders` export button opens field choices.
- [ ] CSV downloads successfully.
- [ ] CSV respects current filters.
- [ ] Merchant export only contains merchant-owned order data.

## Customer Account

- [ ] Customer can log in.
- [ ] Login persists after refresh.
- [ ] `/account` opens.
- [ ] `/account/orders` shows only the signed-in customer's orders.
- [ ] Logout redirects to `/login`.
- [ ] After logout, `/account` redirects to login.

## Environment And Safety

- [ ] `DATABASE_URL` points to production PostgreSQL.
- [ ] `SESSION_SECRET` is non-empty, strong, and not a placeholder.
- [ ] `COOKIE_SECRET` is non-empty, strong, and not a placeholder.
- [ ] `NEXT_PUBLIC_SITE_URL` is the production URL.
- [ ] `ALLOW_PRODUCTION_SEED=false`.
- [ ] Demo/test accounts are not used for real operations.
- [ ] Production database backup exists before migration.
- [ ] Latest deployment was redeployed after env changes.

## ECPay Production Readiness

- [ ] Official ECPay production merchant account is approved.
- [ ] Production `ECPAY_MERCHANT_ID` is configured in Vercel production env.
- [ ] Production `ECPAY_HASH_KEY` is configured in Vercel production env.
- [ ] Production `ECPAY_HASH_IV` is configured in Vercel production env.
- [ ] `PAYMENT_PROVIDER=ecpay`.
- [ ] `PAYMENT_MODE=production`.
- [ ] `ENABLE_ECPAY_PRODUCTION=false` until final manual approval.
- [ ] ReturnURL is confirmed.
- [ ] ClientBackURL is confirmed.
- [ ] OrderResultURL is confirmed.
- [ ] RefundNotifyURL is confirmed.
- [ ] Payment reconciliation procedure is assigned to an owner.
- [ ] Refund reconciliation procedure is assigned to an owner.

Do not enable production ECPay collection until every item above is complete.
