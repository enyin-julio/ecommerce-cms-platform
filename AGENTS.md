# Repository Guidelines

## Project Structure & Module Organization

This repository is a Next.js ecommerce CMS platform using a Modular Monolith architecture. Keep the layout predictable and document any deviations here. The current structure is:

- `src/app/` for Next.js App Router pages, layouts, route handlers, and server actions.
- `src/components/` for reusable UI components, grouped by public/admin context.
- `src/modules/` for domain modules such as catalog, orders, customers, content, admin, cache, and search.
- `src/lib/` for shared infrastructure helpers such as Prisma client and formatting utilities.
- `tests/` for automated tests that mirror the `src/` structure.
- `public/` or `assets/` for static images, icons, and other client-facing files.
- `docs/` for architecture notes, setup guides, and operational runbooks.
- `config/` for non-secret configuration templates.
- `prisma/` for database schema and migrations.

Keep domain code grouped around ecommerce concepts such as catalog, orders, customers, content, and admin workflows.

Do not introduce microservices in the early phases. Keep business logic inside clear module boundaries and expose behavior through repositories/services before adding external integrations.

## Build, Test, and Development Commands

Canonical commands:

- `npm install` to install dependencies.
- `npm run dev` to start the local development server.
- `npm test` to run the automated test suite.
- `npm run build` to produce a production build.
- `npm run lint` to run static checks.
- `npx prisma validate` to validate the Prisma schema.
- `npx prisma migrate dev --name init` to create and apply local database migrations.

Do not add duplicate scripts that perform the same task with different names.

## Coding Style & Naming Conventions

Follow the conventions of the framework selected for this project. Use consistent indentation throughout a file, descriptive names, and small modules with clear ownership. Prefer domain-specific names such as `ProductRepository`, `OrderService`, or `ContentBlockEditor` over vague names like `Helper` or `Manager`.

Keep generated files, build outputs, dependency directories, and local environment files out of version control.

For Next.js App Router, prefer server components for read-only pages and isolate client components to interactive forms, carts, and admin controls. Do not place merchant-owned data access directly in public UI components without repository/service boundaries.

## Testing Guidelines

Place tests near the behavior they verify or under `tests/` using matching paths. Name tests after the unit or workflow under test, for example `product-pricing.test.ts` or `orders.spec.ts`. Cover core ecommerce flows including authentication, catalog management, checkout, payment state handling, and CMS publishing permissions.

When adding mutations, add focused tests for authorization boundaries: admin can manage all records, merchant can manage only own records, and customer cannot access admin behavior.

## Commit & Pull Request Guidelines

Git history is not available in this workspace, so no repository-specific commit convention can be inferred. Until one is established, use short imperative commit subjects, for example `Add product catalog schema`.

Pull requests should include a clear summary, testing notes, linked issues when applicable, and screenshots for UI changes. Call out migrations, configuration changes, and security-sensitive behavior explicitly.

## Security & Configuration Tips

Never commit secrets, API keys, credentials, or production customer data. Use environment variables and provide safe examples in `.env.example` when configuration is added.

Do not mix merchant data and customer data in the same ownership model. Every merchant-owned record should carry `merchantId` unless there is a clear platform-level reason not to.

Public storefront reads must only expose published content and published products. Admin reads and writes must go through permission-aware services or route handlers before the feature is considered complete.
