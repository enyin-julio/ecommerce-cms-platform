# Ecommerce CMS Platform

Modular monolith MVP for brand websites, product catalogs, ecommerce storefronts, and an editable merchant admin.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Prisma ORM
- PostgreSQL
- Cookie-based admin session for the MVP
- Reserved abstractions for Redis, Elasticsearch, payment providers, and shipping providers

## Quick Start

```bash
npm install
cp .env.example .env
docker compose up -d
npx prisma migrate dev
npx prisma db seed
npm run dev
```

On Windows, start Docker Desktop before running `docker compose up -d`.

Open:

- Storefront: `http://localhost:3000`
- Admin: `http://localhost:3000/admin/login`

## Local Development Flow

PostgreSQL local flow:

```bash
docker compose up -d
npm install
npm run db:validate
npm run db:generate
npx prisma migrate dev
npm run db:seed
npm run dev
```

SQLite fallback flow when Docker is unavailable:

```bash
npm install
npm run sqlite:generate
npm run sqlite:reset
npm run sqlite:seed
npm run dev
```

Before opening a pull request or deploying, run:

```bash
npm run check:prod
```

## Required Environment Variables

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/ecommerce_cms"
SESSION_SECRET="replace-with-a-unique-random-secret-at-least-32-characters"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
NODE_ENV="development"
STORAGE_PROVIDER="local"
BLOB_READ_WRITE_TOKEN=""
COOKIE_SECRET=""
NEXTAUTH_SECRET=""
SQLITE_DATABASE_URL="file:./dev.db"
REDIS_URL=""
ELASTICSEARCH_URL=""
ALLOW_PRODUCTION_SEED="false"
```

Production required variables:

- `DATABASE_URL`: PostgreSQL connection string.
- `SESSION_SECRET`: unique secret for signing admin and customer session cookies. Use at least 32 random characters.
- `NEXT_PUBLIC_SITE_URL`: public site URL, for example `https://example.com`.
- `NODE_ENV`: set to `production` in production.
- `STORAGE_PROVIDER`: use `local` for development uploads, or `vercel-blob` for Vercel production media storage.
- `BLOB_READ_WRITE_TOKEN`: optional legacy fallback for older Vercel Blob setups. Prefer Vercel-managed OIDC env vars such as `BLOB_STORE_ID` when the Blob store is connected to the Vercel project.

`COOKIE_SECRET` and `NEXTAUTH_SECRET` are supported only as backward-compatible
aliases. Prefer `SESSION_SECRET` for new environments. Never use placeholder
values in staging or production.

## Docker PostgreSQL

The local Docker setup exposes PostgreSQL on host port `5433` to avoid conflicts
with an existing Windows PostgreSQL service on `5432`.

```bash
docker compose up -d
docker ps
```

The expected port mapping is:

```text
0.0.0.0:5433->5432/tcp
```

If Prisma cannot reach the database, confirm Docker Desktop is running and that
`DATABASE_URL` points to `localhost:5433`.

## Session Cookie Security

Admin and customer session cookies are signed server-side and configured with:

- `httpOnly: true`
- `sameSite: "lax"`
- `secure: true` when `NODE_ENV=production`

If `SESSION_SECRET` is missing, too short, or left as a placeholder, session
creation and verification will fail instead of silently using a default secret.

## SQLite Local Fallback

When Docker Desktop is not available, use the SQLite fallback for local
development and demos. This keeps the PostgreSQL schema and migrations intact,
but generates Prisma Client from `prisma/schema.sqlite.prisma`.

```bash
npm run sqlite:generate
npm run sqlite:reset
npm run sqlite:seed
npm run dev
```

The SQLite database file is created at `prisma/dev.db`.

To switch back to PostgreSQL Prisma Client later, run:

```bash
npx prisma generate
```

## Test Accounts

- Admin: `admin@example.com` / `Admin123!`
- Merchant: `merchant@example.com` / `Merchant123!`
- Customer seed account: `customer@example.com` / `Customer123!`

Customer accounts can sign in from `/login` and view member pages under `/account`.

## MVP Feature Checklist

- Public homepage, brand page, product list, product detail
- CMS landing pages and content pages
- Guest cart stored through a secure cookie cart id
- Checkout form and order creation
- Stock validation and stock movement history
- Admin login, logout, middleware protection, and RBAC
- Product CRUD with stock and publish controls
- CMS page CRUD with publish controls
- Order search, filters, pagination, detail view, status updates, history, and CSV export
- CSV export field selection with RBAC-safe data access
- Product SKU as a dedicated unique field
- Admin media library with local uploads and Vercel Blob production storage
- Customer register/login, member profile, and customer order lookup

## Useful Routes

- `/products`
- `/products/daily-canvas-tote`
- `/cart`
- `/checkout`
- `/login`
- `/register`
- `/account`
- `/account/orders`
- `/order-lookup`
- `/landing/summer-launch`
- `/pages/materials-guide`
- `/admin/products`
- `/admin/pages`
- `/admin/media`
- `/admin/orders`
- `/admin/orders/export`

## Validation Commands

```bash
npm run db:validate
npm run db:generate
npx prisma migrate dev
npm run db:seed
npm test
npm run test:e2e
npm run build
npm run lint
```

`npx prisma migrate dev` requires PostgreSQL to be reachable at `DATABASE_URL`.
For SQLite local fallback, use `npm run sqlite:reset` instead of Prisma
migrations.

## Automated Tests

The MVP smoke test suite uses Node's built-in test runner and the SQLite local
fallback. Running `npm test` will regenerate the SQLite Prisma Client, rebuild
`prisma/dev.db`, run seed data, and verify:

- Admin, merchant, and customer seed accounts
- Merchant-owned data isolation
- Product publish toggle
- CMS page publish toggle
- Media metadata persistence
- Checkout order creation, stock deduction, and cart cleanup
- Customer order lookup scoped to the signed-in customer
- Guest order lookup scoped to guest orders only
- Order cancellation, stock restore, and status history
- Merchant-scoped CSV export data

The Playwright E2E suite uses PostgreSQL through `DATABASE_URL` and runs:

```bash
npm run test:e2e
```

Before the browser tests start, Playwright runs Prisma validate, generate,
migrate, and seed. It then starts the local Next.js app at
`http://localhost:3000` and verifies:

- Admin and merchant backend login
- Customer registration, login, and member center access
- Product detail, add to cart, checkout, and order creation
- Customer order lookup under `/account/orders`
- Admin order search, detail view, status update, and CSV export

Additional Playwright commands:

```bash
npm run test:e2e:ui
npm run test:e2e:headed
```

The expanded E2E suite also covers:

- Customer accounts cannot enter `/admin`
- Merchant RBAC isolation for products, CMS pages, media, and orders
- Admin can see records across merchants
- Product create, edit, publish, and unpublish
- CMS page create, edit, publish, and unpublish
- Media image upload

## GitHub Actions E2E CI

The workflow at `.github/workflows/e2e.yml` runs Playwright on every pull
request and push to `main`. CI starts a PostgreSQL 16 service and sets:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ecommerce_cms"
SESSION_SECRET="ci-only-secret-for-e2e-tests-at-least-32-characters"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
NODE_ENV="test"
STORAGE_PROVIDER="local"
BLOB_READ_WRITE_TOKEN=""
```

CI steps:

```bash
npm ci
npx playwright install --with-deps chromium
npm run db:generate
npm run db:migrate:deploy
npm run db:seed
npm run build
npm run test:e2e
```

The Playwright global setup also validates Prisma, generates Prisma Client,
applies migrations, seeds test data, and starts the local Next.js server for
the browser tests. In CI it uses `prisma migrate deploy`; locally it uses
`prisma migrate dev`.

## Deployment Notes

- Read [Production Checklist](docs/production-checklist.md) before deployment.
- Read [Database Runbook](docs/database-runbook.md) before production migrations.
- Read [Vercel Preview Deployment Test](docs/vercel-preview-test.md) before
  promoting a Preview deployment.
- Run `npm run build` before deployment.
- Run Prisma migrations against the production database before starting the app.
- Set a strong `SESSION_SECRET`.
- Do not commit `.env`, production customer data, or credentials.
- Use HTTPS in production so secure cookies work correctly.
- This MVP does not connect real payment or shipping providers.
- Do not run `npm run build` while `npm run dev` is still running on Windows.
  Stop the dev server first to avoid stale `.next` cache issues.
- Do not run `npx prisma db seed` against production unless the database is
  disposable. The seed script refuses to run when `NODE_ENV=production` unless
  `ALLOW_PRODUCTION_SEED=true` is explicitly set.

## Production Deployment Flow

Read the full [Vercel Deployment SOP](docs/vercel-deployment.md) before a real
Vercel deployment.
Use [Vercel Preview Deployment Test](docs/vercel-preview-test.md) for pull
request or staging-like Preview verification.
Use [Vercel Preview Smoke Test](docs/vercel-preview-smoke-test.md) immediately
after a Preview deployment is available.

1. Set production environment variables in the hosting platform.
2. Take a fresh PostgreSQL backup.
3. Verify the backup can be listed with `pg_restore --list`.
4. Run migrations with:

```bash
npm run db:migrate:deploy
```

5. Build and verify:

```bash
npm run build
npm run test:e2e
```

6. Deploy the application.
7. Create the first production admin if needed:

```bash
npm run create:admin
```

8. Verify admin login, storefront products, CMS pages, checkout, orders, and CSV export.

```bash
npm run check:smoke-note
```

Then follow the [Smoke Test Checklist](docs/smoke-test.md).

## Vercel Preview Deployment Flow

Before creating a Vercel Preview deployment:

1. Make sure the project is inside a Git repository and can be pushed to
   GitHub.
2. Confirm `.env` and `.env*.local` are ignored and not committed.
3. Confirm `.env.example` contains safe examples only.
4. Push the branch to GitHub or open a pull request.
5. In Vercel, connect the GitHub repository.
6. Set Preview environment variables:
   - `DATABASE_URL`
   - `SESSION_SECRET`
   - `NEXT_PUBLIC_SITE_URL`
   - `NODE_ENV=production`
   - `STORAGE_PROVIDER=vercel-blob`
   - Vercel Blob OIDC variables, for example `BLOB_STORE_ID`
   - `ALLOW_PRODUCTION_SEED=false`
7. Use a separate Preview PostgreSQL database and a separate Preview Blob store or connection.
8. Run Preview migrations with `npm run db:migrate:deploy`.
9. Wait for Vercel Preview deployment to finish.
10. Run [Vercel Preview Smoke Test](docs/vercel-preview-smoke-test.md).

Before pushing, run locally:

```bash
npm run lint
npm run build
npm run test:e2e
```

## Vercel And PostgreSQL Env Setup

Detailed steps are in [Vercel Deployment SOP](docs/vercel-deployment.md).

In Vercel:

1. Open Project Settings.
2. Go to Environment Variables.
3. Add production values for:
   - `DATABASE_URL`
   - `SESSION_SECRET`
   - `NEXT_PUBLIC_SITE_URL`
   - `NODE_ENV`
   - `STORAGE_PROVIDER`
   - Vercel Blob OIDC variables, for example `BLOB_STORE_ID`
   - `ALLOW_PRODUCTION_SEED`
4. Use separate values for Preview and Production.
5. Redeploy after changing environment variables.

For managed PostgreSQL:

- Use the provider connection string for `DATABASE_URL`.
- Prefer pooled connection strings if the provider recommends them for serverless.
- Keep backup/restore credentials outside the repository.

For Vercel Blob media storage:

- Local development uses `STORAGE_PROVIDER=local` and writes files to
  `public/uploads`.
- Production on Vercel should use `STORAGE_PROVIDER=vercel-blob`.
- Create or connect a Blob store in Vercel. New Vercel projects should use the
  generated OIDC variables such as `BLOB_STORE_ID`; `BLOB_READ_WRITE_TOKEN` is
  only a legacy fallback.
- The admin media library accepts JPG, PNG, and WebP images up to 5MB.

## Troubleshooting

- Prisma cannot connect: confirm `DATABASE_URL`, host, port, database name, and that PostgreSQL is running.
- `P1001` connection error: check Docker/PostgreSQL port mapping and whether `localhost:5433` or `localhost:5432` is correct.
- Session login fails: confirm `SESSION_SECRET` is set, unique, and at least 32 characters.
- Secure cookies do not work in production: confirm HTTPS and `NODE_ENV=production`.
- Prisma config says env loading is skipped: this is expected with `prisma.config.ts`; the config imports `dotenv/config` for local `.env`.
- Playwright browser missing: run `npx playwright install chromium`.
- Windows build has stale `.next`: stop dev server before `npm run build`.

## Deployment Scripts

```bash
npm run db:validate
npm run db:generate
npm run db:migrate:deploy
npm run db:seed
npm run create:admin
npm run check:smoke-note
npm run check:prod
```

`create:admin` creates or updates a production admin from `ADMIN_EMAIL`,
`ADMIN_NAME`, and `ADMIN_PASSWORD`, or prompts interactively. Do not hardcode or
commit admin passwords.

## Demo Data Cleanup

The seed data is demo/test data only. It uses `example.com` accounts and
`Demo` naming so it can be identified before production launch.

Demo accounts:

- `admin@example.com`
- `merchant@example.com`
- `customer@example.com`

Before production launch:

1. Create real admin and merchant users through a controlled production process.
2. Remove all demo users, demo merchant records, demo products, demo pages,
   demo media, carts, and orders from the production database.
3. Confirm `ALLOW_PRODUCTION_SEED` is not set to `true`.
4. Confirm production `.env` does not include demo passwords or placeholder
   secrets.

For production, prefer starting from an empty migrated database and creating
real records intentionally instead of seeding demo data.

## Prisma Configuration

Prisma CLI settings live in `prisma.config.ts`. The project no longer uses the
deprecated `package.json#prisma` seed configuration. Current Prisma major
version remains 6.x; do not upgrade to Prisma 7 without a separate breaking
change review.

## Not Yet Implemented

- Real payment gateway integration
- Real shipping/logistics integration
- Visual CMS block editor
- Media deletion and advanced media organization
- Redis cache backend and Elasticsearch product search backend
