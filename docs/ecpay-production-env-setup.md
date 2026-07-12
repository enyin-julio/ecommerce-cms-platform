# ECPay Production Env Setup

Production ECPay payments are blocked by default. Do not set `ENABLE_ECPAY_PRODUCTION=true` until final manual approval.

## Current Blocker

The project does not yet have an approved ECPay production merchant account.

Do not enable production payment until the official production merchant account is approved and these credentials are available from the ECPay merchant back office:

- `ECPAY_MERCHANT_ID`
- `ECPAY_HASH_KEY`
- `ECPAY_HASH_IV`

The values must be entered only into Vercel production env. Do not commit them, paste them into chat, or save them in project files.

## Required Vercel Production Env

Confirm these variables exist in Vercel production environment. Do not print or paste real values into documents, commits, tickets, or chat.

- `ECPAY_MERCHANT_ID`
- `ECPAY_HASH_KEY`
- `ECPAY_HASH_IV`
- `PAYMENT_PROVIDER=ecpay`
- `PAYMENT_MODE=production`
- `ENABLE_ECPAY_PRODUCTION=false`
- `ECPAY_RETURN_URL`
- `ECPAY_CLIENT_BACK_URL`
- `ECPAY_ORDER_RESULT_URL`
- `ECPAY_REFUND_NOTIFY_URL`

Supporting production env should also exist:

- `DATABASE_URL`
- `SESSION_SECRET`
- `COOKIE_SECRET`
- `NEXT_PUBLIC_SITE_URL`
- `STORAGE_PROVIDER`
- `BLOB_READ_WRITE_TOKEN`

## If Vercel Env Cannot Be Read Locally

Run these commands in PowerShell, then re-check `.env.production.local` without printing secrets:

```powershell
npx.cmd vercel login
npx.cmd vercel link
npx.cmd vercel env pull .env.production.local --environment=production
```

Do not commit `.env.production.local`.

## Vercel Env Add Command Templates

Use these commands as templates only. Enter values interactively in the Vercel CLI prompt. Do not paste real keys into this file.

```powershell
npx.cmd vercel env add ECPAY_MERCHANT_ID production
npx.cmd vercel env add ECPAY_HASH_KEY production
npx.cmd vercel env add ECPAY_HASH_IV production
npx.cmd vercel env add PAYMENT_PROVIDER production
npx.cmd vercel env add PAYMENT_MODE production
npx.cmd vercel env add ENABLE_ECPAY_PRODUCTION production
npx.cmd vercel env add ECPAY_RETURN_URL production
npx.cmd vercel env add ECPAY_CLIENT_BACK_URL production
npx.cmd vercel env add ECPAY_ORDER_RESULT_URL production
npx.cmd vercel env add ECPAY_REFUND_NOTIFY_URL production
```

Expected non-secret values:

```text
PAYMENT_PROVIDER=ecpay
PAYMENT_MODE=production
ENABLE_ECPAY_PRODUCTION=false
ECPAY_RETURN_URL=https://www.aih.tw/api/payments/ecpay/webhook
ECPAY_CLIENT_BACK_URL=https://www.aih.tw/account/orders
ECPAY_ORDER_RESULT_URL=https://www.aih.tw/checkout/success
ECPAY_REFUND_NOTIFY_URL=https://www.aih.tw/api/payments/ecpay/refund-webhook
```

## Production Secret Rules

- Production `ECPAY_MERCHANT_ID`, `ECPAY_HASH_KEY`, and `ECPAY_HASH_IV` must come from the official ECPay merchant back office.
- Do not hard-code ECPay keys in source code.
- Do not reuse production keys in preview, sandbox, or local environments.
- Do not print complete keys in logs.
- Keep `ENABLE_ECPAY_PRODUCTION=false` until the final review is signed off.

## Local Verification Without Printing Secrets

Check presence only:

- `ECPAY_MERCHANT_ID`: present / missing
- `ECPAY_HASH_KEY`: present / missing
- `ECPAY_HASH_IV`: present / missing
- `PAYMENT_PROVIDER`: should be `ecpay`
- `PAYMENT_MODE`: should be `production`
- `ENABLE_ECPAY_PRODUCTION`: should remain `false`
- URL variables: should use `https://www.aih.tw`

If any value is missing or still points to localhost/preview, do not proceed to production approval.
