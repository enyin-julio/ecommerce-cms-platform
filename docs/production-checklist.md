# Production Deployment Checklist

Use this checklist before deploying the ecommerce CMS platform to production.
Do not commit real `.env` files, production credentials, or customer data.

## Required Production Environment

Set these variables in the hosting platform, for example Vercel Project
Settings > Environment Variables.

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
SESSION_SECRET="a-unique-random-secret-with-at-least-32-characters"
NEXT_PUBLIC_SITE_URL="https://your-production-domain.com"
NODE_ENV="production"
STORAGE_PROVIDER="vercel-blob"
ALLOW_PRODUCTION_SEED="false"
```

Required variable notes:

- `DATABASE_URL`: production PostgreSQL connection string. Use the provider's
  pooled connection string if recommended for web runtimes.
- `SESSION_SECRET`: signs admin and customer session cookies. It must be unique
  per environment and at least 32 characters.
- `COOKIE_SECRET`: backward-compatible alias only. Prefer `SESSION_SECRET`.
- `NEXT_PUBLIC_SITE_URL`: canonical public URL for the storefront.
- `STORAGE_PROVIDER`: use `vercel-blob` for Vercel production media uploads.
- Vercel Blob OIDC variables such as `BLOB_STORE_ID`: generated when the Blob
  store is connected to the Vercel project. `BLOB_READ_WRITE_TOKEN` is only a
  legacy fallback for older Blob setups.
- `NODE_ENV`: must be `production`.

Optional reserved variables:

```env
REDIS_URL=""
ELASTICSEARCH_URL=""
COOKIE_SECRET=""
NEXTAUTH_SECRET=""
```

## Cookie And Session Checks

- Admin cookie name: `commerce_admin_session`.
- Customer cookie name: `commerce_customer_session`.
- Cart cookie name: `commerce_cart_id`.
- Cookies must be `httpOnly`.
- Cookies must use `sameSite: "lax"`.
- Cookies must be secure when `NODE_ENV=production`.
- Do not use placeholder secrets or demo secrets.

## Pre-Deployment Verification

Run these locally against the target branch before deploying:

```bash
npm ci
npm run db:validate
npm run db:generate
npm run lint
npm run build
npm run test:e2e
```

For a full local production-style check:

```bash
npm run check:prod
```

## Migration Verification

Before running migrations against production:

1. Confirm the target `DATABASE_URL` points to the production database.
2. Take a fresh database backup.
3. Confirm the backup file exists and is non-empty.
4. Review pending migrations in `prisma/migrations`.
5. Run migrations with:

```bash
npm run db:migrate:deploy
```

Do not use `prisma migrate dev` in production.

## Demo/Test Data Cleanup

Seed data is for local development and demos only. Before production launch:

- Confirm production has no `example.com` demo users.
- Remove `Demo Merchant` and related demo merchant records.
- Remove demo categories, products, CMS pages, media, carts, orders, order
  items, status histories, and stock movements.
- Confirm `ALLOW_PRODUCTION_SEED` is `false` or unset.
- Confirm demo passwords are not present in production secrets or docs.

Known demo accounts:

- `admin@example.com`
- `merchant@example.com`
- `customer@example.com`

## Deployment Approval Checklist

- Production env variables are set and reviewed.
- Database backup completed.
- `npm run build` passed.
- `npm run lint` passed.
- `npm run test:e2e` passed.
- Demo/test data removed.
- Real admin account created through a controlled process.
- HTTPS is enabled.
- Vercel Blob is configured and `/admin/media` upload has been smoke-tested.
