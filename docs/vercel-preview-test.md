# Vercel Preview Deployment Test

Use this runbook to verify a Vercel Preview deployment before promoting the
same branch to production. Preview must use separate database, session, and Blob
credentials from production.

## 1. Connect Vercel To GitHub

1. Log in to Vercel.
2. Click **Add New > Project**.
3. Import the GitHub repository.
4. Keep Framework Preset as **Next.js**.
5. Confirm Install Command:

```bash
npm ci
```

6. Confirm Build Command:

```bash
npm run build
```

7. Open **Settings > Git** and confirm pull requests create Preview
   deployments.

## 2. Configure Preview Environment Variables

In Vercel, open **Project Settings > Environment Variables** and add Preview
values for:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/PREVIEW_DATABASE?schema=public"
SESSION_SECRET="preview-only-random-secret-at-least-32-characters"
NEXT_PUBLIC_SITE_URL="https://your-preview-domain.vercel.app"
NODE_ENV="production"
STORAGE_PROVIDER="vercel-blob"
ALLOW_PRODUCTION_SEED="false"
```

Backward-compatible aliases are optional:

```env
COOKIE_SECRET=""
NEXTAUTH_SECRET=""
```

Use a different `SESSION_SECRET`, `DATABASE_URL`, and Blob store connection
from production. Never point Preview at the production database.

## 3. PostgreSQL Provider Setup

Recommended Preview database options:

- Prisma Postgres: simple Prisma-first setup.
- Neon: useful for branch databases and preview environments.
- Supabase: good dashboard and managed Postgres tools.
- Railway: simple managed Postgres for staging-style environments.

Preview checklist:

- Create a separate Preview database.
- Copy the Preview connection string into Vercel `DATABASE_URL`.
- Use pooled/serverless connection string if the provider recommends it.
- Run migrations with `npm run db:migrate:deploy`, not `prisma migrate dev`.
- Do not seed demo data into production. Demo seed is acceptable only for a
  disposable Preview database.

## 4. Blob Store Setup

1. In Vercel, open **Storage**.
2. Create or connect a **Blob** store for Preview testing.
3. Connect it to the project for Preview.
4. Confirm Vercel generated Blob OIDC variables such as `BLOB_STORE_ID`.
5. Set `STORAGE_PROVIDER=vercel-blob`.
6. Redeploy the Preview deployment after changing env values.

The media library should store public Blob URLs in `Media.url`, Blob pathnames
in `Media.pathname`, and `vercel-blob` in `Media.provider`.

## 5. Deployment Before-Test Commands

Run locally before opening or updating the pull request:

```bash
npm run lint
npm run build
npm run test:e2e
```

For a production-like database migration check:

```bash
npm run db:validate
npm run db:generate
npm run db:migrate:deploy
```

Only run `db:migrate:deploy` against the intended Preview database.

## 6. Preview Smoke Test

After Vercel finishes the Preview deployment, test the Preview URL:

1. Open homepage.
   - Expected: page loads without server error.
2. Open `/products`.
   - Expected: product list loads.
3. Open one product detail page.
   - Expected: product name, price, stock, and add-to-cart button are visible.
4. Open `/admin/login`.
   - Expected: login form loads.
5. Log in as a Preview admin.
   - Expected: admin dashboard loads.
6. Open `/admin/media` and upload a JPG, PNG, or WebP under 5MB.
   - Expected: upload succeeds and the media URL is a Vercel Blob URL.
7. Create or edit a product and select/paste the uploaded Blob URL as image.
   - Expected: product list and product detail show the image.
8. Add a product to cart and submit `/checkout`.
   - Expected: order success page shows an order id.
9. Open `/admin/orders`.
   - Expected: the test order appears.
10. Export CSV from `/admin/orders`.
    - Expected: CSV downloads and contains only authorized order data.
11. Log in as a customer and open `/account/orders`.
    - Expected: the customer sees only their own orders.

## 7. Production Promotion Gate

Before promoting the same branch to production:

- Preview smoke test passed.
- `npm run lint` passed.
- `npm run build` passed.
- `npm run test:e2e` passed.
- Production database backup is complete.
- Production env variables are reviewed.
- Production Blob store and token are configured.
- Real production admin creation plan is ready.
- Demo/test data will not be seeded into production.
