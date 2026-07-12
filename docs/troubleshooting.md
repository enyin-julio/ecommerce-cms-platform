# Troubleshooting

This guide summarizes common production and local issues. Do not expose raw
database errors, secrets, stack traces, or token values to customers.

## PostgreSQL And Prisma

### `P1001` Or Cannot Reach Database

Common causes:

- PostgreSQL is not running.
- `DATABASE_URL` uses the wrong host or port.
- Docker PostgreSQL is mapped to a different host port.
- Vercel or local environment variables were not loaded.

Local checks:

```bash
docker ps
npm run db:validate
npm run db:generate
```

Local Docker default in this project maps PostgreSQL to host port `5433`.
Production should use the managed PostgreSQL provider connection string.

### Migration Fails

Rules:

- Local development can use `npx prisma migrate dev`.
- Production must use `npm run db:migrate:deploy`.
- Back up production PostgreSQL before running migrations.
- Do not delete migration folders to fix production drift without a written
  recovery plan.

If migration fails in production:

1. Stop further deploys.
2. Save the full error output privately.
3. Confirm database backup exists.
4. Check pending migrations locally.
5. Decide whether to fix forward or restore from backup.

## Vercel Environment Variables

Required production values:

- `DATABASE_URL`
- `SESSION_SECRET`
- `COOKIE_SECRET`
- `NEXT_PUBLIC_SITE_URL`
- `NODE_ENV=production`
- `STORAGE_PROVIDER=vercel-blob`
- Vercel Blob connection variables such as `BLOB_STORE_ID`
- `BLOB_READ_WRITE_TOKEN` when using token-based Blob writes

After changing Vercel env values, redeploy the production deployment. Existing
serverless functions do not automatically pick up changed env values until a new
deployment is created.

Never print or paste production secrets into issue trackers, screenshots, or
public chat.

## Blob Upload Fails

Check these items:

1. The Blob Store connected to the project is `Public` when storefront images
   must be directly visible.
2. `STORAGE_PROVIDER` is `vercel-blob` in production.
3. The project has Blob environment variables for Production and Preview.
4. Read-write token access is enabled when the app needs to upload files.
5. The uploaded file is JPG, PNG, or WebP.
6. The uploaded file is 5MB or smaller.

Known symptom:

```text
Vercel Blob: Cannot use public access on a private store.
```

Fix:

- Connect a public Blob Store to the Vercel project.
- Ensure Blob env vars are attached to Production.
- Redeploy the application.
- Retry `/admin/media` upload.

## Customer Session Drops Login

Check these items:

- `SESSION_SECRET` is set and not a placeholder.
- `COOKIE_SECRET` is set if the deployment expects it.
- Production site is served over HTTPS.
- `NODE_ENV=production` so secure cookie behavior matches production.
- Account and order pages are dynamic and not cached as static pages.
- Logout clears the customer session cookie.

Expected cookie behavior:

- `httpOnly: true`
- `sameSite: "lax"`
- `secure: true` in production
- `path: "/"`
- Reasonable max age

## Build Fails

Run:

```bash
npm run lint
npm run build
```

Common causes:

- A local Next.js dev server is still running on Windows and locking files.
- Prisma Client was generated for the wrong schema.
- Required env variables are missing during build.
- TypeScript errors in server actions or route handlers.

If Prisma Client seems stale:

```bash
npm run db:generate
```

On Windows, stop active `npm run dev` processes before rebuilding if `.next`
errors appear.

## E2E Test Fails

Run:

```bash
npm run test:e2e
```

Common causes:

- PostgreSQL is not reachable at `DATABASE_URL`.
- Browser binaries are missing. Run `npx playwright install chromium`.
- Seed data did not run.
- Port `3000` is already in use.
- A test selector changed after UI edits.

The E2E suite should not use production accounts, production passwords, or real
customer data.

## ECPay Production Is Not Enabled

Expected guard message:

```text
ECPay production is not enabled
```

This is intentional when `PAYMENT_MODE=production` but `ENABLE_ECPAY_PRODUCTION` is not `true`.

Do not bypass this guard. It means one or more production approval steps are not complete, such as:

- Official ECPay production merchant account is not approved.
- Production `ECPAY_MERCHANT_ID`, `ECPAY_HASH_KEY`, or `ECPAY_HASH_IV` is missing.
- Production callback URLs have not been confirmed.
- Production smoke test or reconciliation review has not been completed.

Keep `ENABLE_ECPAY_PRODUCTION=false` until final manual approval.
