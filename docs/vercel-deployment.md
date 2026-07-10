# Vercel Deployment SOP

This document describes the practical deployment steps for running the
ecommerce CMS platform on Vercel with a managed PostgreSQL database.

Do not commit production `.env` files, database URLs, passwords, or customer
data to the repository.

## 1. Create The Vercel Project

1. Log in to Vercel.
2. Click **Add New > Project**.
3. Import the GitHub repository for this project.
4. Keep the framework preset as **Next.js**.
5. Confirm the install command is:

```bash
npm ci
```

6. Confirm the build command is:

```bash
npm run build
```

7. Do not deploy production until PostgreSQL and environment variables are set.

## 2. Connect GitHub Repository

Recommended branch setup:

- `main`: Production deployments.
- Pull requests: Preview deployments.

Vercel should automatically create Preview deployments for pull requests. Use
separate Preview environment variables and a separate Preview database when
testing migrations or destructive data workflows.

## 3. Choose PostgreSQL Provider

Any managed PostgreSQL provider that supports Prisma can work. Recommended MVP
options:

| Provider | Best For | Notes |
| --- | --- | --- |
| Prisma Postgres | Prisma-first projects | Simple setup, Prisma-friendly defaults. |
| Neon | Serverless Postgres | Good branching and pooled connection options. |
| Supabase | Postgres plus dashboard tools | Useful if auth/storage features may be adopted later. |
| Railway | Simple app/database hosting | Convenient for small teams and staging environments. |

Recommended default: **Neon** or **Prisma Postgres** for Vercel deployments.

Use the provider's pooled connection string if recommended for serverless
runtimes. Keep direct/admin connection strings for maintenance only.

## 4. Configure Environment Variables

In Vercel:

1. Open the project.
2. Go to **Settings > Environment Variables**.
3. Add values for Production.
4. Add separate values for Preview.
5. Redeploy after changes.

Required production variables:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
SESSION_SECRET="a-unique-random-secret-with-at-least-32-characters"
NEXT_PUBLIC_SITE_URL="https://your-production-domain.com"
NODE_ENV="production"
STORAGE_PROVIDER="vercel-blob"
BLOB_READ_WRITE_TOKEN=""
ALLOW_PRODUCTION_SEED="false"
```

Backward-compatible aliases:

```env
COOKIE_SECRET=""
NEXTAUTH_SECRET=""
```

Prefer `SESSION_SECRET`. Do not use placeholder values.

Optional reserved variables:

```env
REDIS_URL=""
ELASTICSEARCH_URL=""
```

For production media uploads on Vercel, set:

```env
STORAGE_PROVIDER="vercel-blob"
BLOB_READ_WRITE_TOKEN="vercel_blob_read_write_token"
```

Keep `STORAGE_PROVIDER="local"` only for local development. Vercel's runtime
filesystem is ephemeral, so production uploads should use Vercel Blob.

## 5. Production And Preview Differences

Production:

- `NODE_ENV=production`
- Production `DATABASE_URL`
- Production `SESSION_SECRET`
- `NEXT_PUBLIC_SITE_URL=https://your-production-domain.com`
- `STORAGE_PROVIDER=vercel-blob`
- Production `BLOB_READ_WRITE_TOKEN`
- `ALLOW_PRODUCTION_SEED=false`

Preview:

- Use a separate Preview database.
- Use a separate Preview `SESSION_SECRET`.
- Set `NEXT_PUBLIC_SITE_URL` to the Vercel Preview URL or a preview domain.
- Use a separate Preview Blob store or token if testing media uploads.
- Demo seed can be used only if the Preview database is disposable.

Never point Preview deployments at the production database.

## 6. Migration Flow

Production must not use:

```bash
prisma migrate dev
```

Production uses:

```bash
npm run db:migrate:deploy
```

Before production migration:

1. Take a fresh PostgreSQL backup.
2. Verify the backup with `pg_restore --list`.
3. Review pending migration files under `prisma/migrations`.
4. Confirm `DATABASE_URL` points to production.
5. Run:

```bash
npm run db:validate
npm run db:generate
npm run db:migrate:deploy
```

See [Database Runbook](database-runbook.md) for backup, restore, and failure
handling.

## 7. First Production Admin

Do not seed demo users into production. Create the first admin explicitly after
migrations are applied.

Environment variable method:

```bash
ADMIN_EMAIL="owner@example.com" ADMIN_NAME="Owner" ADMIN_PASSWORD="use-a-strong-password" npm run create:admin
```

Interactive method:

```bash
npm run create:admin
```

Password rules:

- At least 12 characters.
- Includes uppercase, lowercase, number, and symbol.
- Never commit the password or paste it into shared logs.

After creating the admin:

1. Remove shell history entries that contain `ADMIN_PASSWORD`.
2. Restrict who can run `npm run create:admin`.
3. Prefer running it from a trusted machine or controlled maintenance shell.
4. Rotate the admin password if it was exposed in terminal history or logs.

## 8. Deploy

Recommended order:

1. Merge the verified branch.
2. Confirm CI passes.
3. Back up production database.
4. Run production migration deploy.
5. Deploy Vercel production.
6. Create the first production admin if needed.
7. Run the smoke test checklist.

## 9. Deployment Verification

Run:

```bash
npm run check:smoke-note
```

Then follow [Smoke Test Checklist](smoke-test.md).

## 10. Vercel Blob Media Storage

Local development:

```env
STORAGE_PROVIDER="local"
```

This stores images under `public/uploads`.

Production on Vercel:

```env
STORAGE_PROVIDER="vercel-blob"
BLOB_READ_WRITE_TOKEN="vercel_blob_read_write_token"
```

Setup steps:

1. In Vercel, open the project.
2. Go to **Storage**.
3. Create or connect a **Blob** store.
4. Copy the read/write token.
5. Add `BLOB_READ_WRITE_TOKEN` in **Settings > Environment Variables** for
   Production and, if needed, Preview.
6. Set `STORAGE_PROVIDER=vercel-blob`.
7. Redeploy the app.
8. Upload a test JPG, PNG, or WebP from `/admin/media`.

The media library stores the public Blob URL in `Media.url`, the Blob pathname
in `Media.pathname`, and the storage provider in `Media.provider`. Product
images and CMS Hero images can use the stored Blob URL directly.
