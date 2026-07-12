# Operation Manual

This guide is for day-to-day operation after launch. Keep production passwords, customer data, database URLs, and API tokens outside this repository.

## Admin Login

1. Open the production admin entrance: `https://www.aih.tw/admin/login`.
2. Sign in with a production `admin` account.
3. Confirm the dashboard opens at `/admin`.

Customer accounts must not be used for admin login. Merchant accounts can enter admin, but only see their own products, pages, media, and related orders.

## Create A Merchant

Use the controlled CLI script when creating the first merchant or adding a new merchant operator:

```bash
npm run create:merchant
```

Enter the merchant email, name, and password interactively. Do not hardcode production passwords in scripts, shell history, documentation, or commits.

## Products

Open `/admin/products`.

Typical workflow:

1. Click `新增商品`.
2. Fill in product name, SKU, slug, category, price, original price, stock, short description, detail description, image URL, SEO title, and SEO description.
3. Choose whether the product is published.
4. Save.
5. Use the product list to edit, publish, unpublish, or review product records.

Rules to remember:

- SKU must be unique.
- Slug should be URL-safe and stable.
- Only published products appear in the storefront.
- Merchants can only manage their own products.

## Media Upload

Open `/admin/media`.

Production media is stored in Vercel Blob when:

```env
STORAGE_PROVIDER="vercel-blob"
```

Upload rules:

- Allowed types: JPG, PNG, WebP.
- Max file size: 5MB.
- Product images and CMS hero images can use the uploaded media URL.
- Admin can see all media. Merchants can only see their own media.

If upload fails, check whether the connected Vercel Blob Store is public and whether the project has Blob environment variables, including read-write access.

## CMS Pages

Open `/admin/pages`.

Typical workflow:

1. Click `新增頁面`.
2. Fill in title, slug, page type, hero title, hero subtitle, hero image URL, JSON content blocks, SEO title, and SEO description.
3. Save as draft or publish.
4. Use the list page to edit, publish, unpublish, or delete pages.

Page types:

- `brand`: brand/about content.
- `landing`: campaign landing pages under `/landing/[slug]`.
- `content`: general pages under `/pages/[slug]`.

Only published CMS pages are visible on the storefront.

## Orders

Open `/admin/orders`.

The order list supports:

- Keyword search by order number, customer name, phone, or email.
- Status filtering.
- Payment status filtering.
- Date range filtering.
- Pagination.

Open an order detail page to review customer information, line items, totals, payment status, order status history, and stock movements.

Allowed order status flow:

- `pending` can become `paid` or `cancelled`.
- `paid` can become `processing` or `cancelled`.
- `processing` can become `shipped` or `cancelled`.
- `shipped` cannot roll back.
- `cancelled` cannot change again.

Every status change is recorded in order status history. Cancelled orders restore stock when applicable.

## CSV Export

Open `/admin/orders` and use `匯出 CSV`.

Export supports:

- Current filters: keyword, status, payment status, and date range.
- Selectable fields.
- RBAC-safe data scope.

Admins export all permitted order data. Merchants only export orders containing their own products. CSV files are for reconciliation, shipping, and operations; they must not be used to write back order changes.

## Payment Status

Production ECPay collection is currently in waiting-for-production-account mode.

Current rules:

- Do not set `ENABLE_ECPAY_PRODUCTION=true`.
- Do not enter production ECPay keys until the official ECPay production merchant account is approved.
- Mock payments and ECPay Sandbox validation may be used for testing.
- Real customer payment collection is not enabled yet.

After the official ECPay production merchant account is approved, follow:

- `docs/ecpay-production-env-setup.md`
- `docs/ecpay-production-url-checklist.md`
- `docs/ecpay-production-final-review.md`
