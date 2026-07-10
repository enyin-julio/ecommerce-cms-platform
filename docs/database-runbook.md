# Database Backup, Restore, And Migration Runbook

This runbook is for PostgreSQL. Replace sample filenames, hosts, and database
names with the values from the target environment. Do not paste production
passwords into documentation or commit them to the repository.

## Tools

Install PostgreSQL client tools so `pg_dump`, `pg_restore`, and `psql` are
available in your terminal.

Recommended backup format:

- Use `pg_dump --format=custom` for production backups.
- Store backups outside the repository.
- Keep a copy in secure object storage when possible.

## Backup Command

PowerShell example:

```powershell
$env:DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
pg_dump --dbname $env:DATABASE_URL --format=custom --file ".\backups\ecommerce_cms_$(Get-Date -Format yyyyMMdd_HHmmss).dump"
```

Bash example:

```bash
export DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
pg_dump --dbname "$DATABASE_URL" --format=custom --file "./backups/ecommerce_cms_$(date +%Y%m%d_%H%M%S).dump"
```

After backup:

```bash
pg_restore --list ./backups/ecommerce_cms_YYYYMMDD_HHMMSS.dump
```

The restore list command should complete without errors.

## Restore Command

Restore into a fresh database whenever possible.

PowerShell example:

```powershell
$env:RESTORE_DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/RESTORE_DATABASE?schema=public"
pg_restore --dbname $env:RESTORE_DATABASE_URL --clean --if-exists --no-owner ".\backups\ecommerce_cms_YYYYMMDD_HHMMSS.dump"
```

Bash example:

```bash
export RESTORE_DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/RESTORE_DATABASE?schema=public"
pg_restore --dbname "$RESTORE_DATABASE_URL" --clean --if-exists --no-owner "./backups/ecommerce_cms_YYYYMMDD_HHMMSS.dump"
```

If restoring into a managed provider, confirm whether `--clean` and owner
changes are allowed. Some providers require a fresh database instead.

## Migration Before Deployment

1. Confirm the application branch and migration files are final.
2. Confirm `DATABASE_URL` points to the intended database.
3. Run a fresh backup with `pg_dump`.
4. Verify the backup with `pg_restore --list`.
5. Run:

```bash
npm run db:validate
npm run db:generate
npm run db:migrate:deploy
```

6. Run application verification:

```bash
npm run build
npm run test:e2e
```

## Migration Execution In CI

GitHub Actions uses PostgreSQL 16 and runs:

```bash
npm ci
npx playwright install --with-deps chromium
npm run db:generate
npm run db:migrate:deploy
npm run db:seed
npm run build
npm run test:e2e
```

CI seed data is acceptable because the CI database is disposable.

## Migration Failure Handling

If migration fails before application deployment:

1. Stop the deployment.
2. Save the full migration error output.
3. Do not run additional migrations blindly.
4. Check `prisma/migrations` and the `_prisma_migrations` table.
5. Restore the latest verified backup into a fresh database if needed.
6. Reproduce the migration in staging before retrying production.

If migration fails after partial application:

1. Put the application in maintenance mode if available.
2. Keep the failed database state for inspection.
3. Restore the latest backup to a fresh database.
4. Point the application back to the restored database only after validation.

## Rollback Notes

Prisma migrations are forward-first. A code rollback does not automatically
rollback database schema changes.

Safe rollback approach:

- Prefer restoring a verified backup into a fresh database.
- Switch `DATABASE_URL` back to the restored database after validation.
- Avoid manual table edits unless the exact data impact is understood.
- If a down migration is needed, write and test it separately in staging.

## Post-Restore Verification

After restore:

```bash
npm run db:validate
npm run db:generate
npm run build
```

Then manually verify:

- Admin login.
- Product list.
- CMS pages.
- Cart and checkout.
- Admin order list and detail.
- CSV export.
