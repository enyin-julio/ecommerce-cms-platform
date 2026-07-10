# Vercel Preview Smoke Test

Run this checklist after every Vercel Preview deployment. Use disposable Preview
data only. Do not use production customer data, production admin credentials, or
real payment/logistics information.

## Environment

- Preview URL:
- Git branch or commit:
- Admin email:
- Customer email:
- Test order id:
- Tester:
- Date:

## Required Preview Environment Variables

Confirm these are set in **Vercel Project Settings > Environment Variables**
for the Preview environment:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/PREVIEW_DATABASE?schema=public"
SESSION_SECRET="preview-only-random-secret-at-least-32-characters"
NEXT_PUBLIC_SITE_URL="https://your-preview-domain.vercel.app"
NODE_ENV="production"
STORAGE_PROVIDER="vercel-blob"
ALLOW_PRODUCTION_SEED="false"
```

`COOKIE_SECRET` is optional and only kept as a backward-compatible alias. Prefer
`SESSION_SECRET`.
For Blob uploads, prefer Vercel-managed OIDC variables such as `BLOB_STORE_ID`
from the connected Blob store. `BLOB_READ_WRITE_TOKEN` is only a legacy fallback.

## Storefront

1. Open `/`.
   - Expected: homepage loads without a server error.
2. Open `/products`.
   - Expected: product list loads and published products are visible.
3. Open a product detail page, for example `/products/daily-canvas-tote`.
   - Expected: product title, price, stock, image, quantity input, and
     add-to-cart button are visible.

## Admin Login

1. Open `/admin/login`.
   - Expected: admin login form loads.
2. Log in as a Preview admin.
   - Expected: `/admin` dashboard loads.
3. Confirm a customer account cannot access `/admin`.
   - Expected: customer is redirected away from the admin area.

## Media Upload

1. Open `/admin/media`.
   - Expected: media library loads.
2. Upload a JPG, PNG, or WebP image under 5MB.
   - Expected: upload succeeds.
3. Copy or inspect the uploaded media URL.
   - Expected: URL is a Vercel Blob URL when `STORAGE_PROVIDER=vercel-blob`.

## Product Image And Product Creation

1. Open `/admin/products/new`.
   - Expected: product creation form loads.
2. Create a test product with a unique SKU and slug.
3. Use the uploaded Vercel Blob media URL as the product image URL.
4. Publish the product.
   - Expected: product appears in `/products`.
5. Open the product detail page.
   - Expected: the Blob-hosted product image is visible.

## Checkout

1. Add the test product to cart.
   - Expected: browser redirects to `/cart`.
2. Open `/checkout`.
   - Expected: checkout form loads.
3. Submit a safe test order.
   - Expected: `/checkout/success` shows an order id.

## Admin Orders And CSV Export

1. Open `/admin/orders`.
   - Expected: order list loads.
2. Search for the test order id, customer name, phone, or email.
   - Expected: test order appears.
3. Open the order detail page.
   - Expected: customer info, item detail, total, status, and status history are
     visible.
4. Export CSV from `/admin/orders`.
   - Expected: CSV downloads and contains only authorized order data.

## Customer Order Lookup

1. Log in as the test customer.
2. Open `/account/orders`.
   - Expected: only that customer's orders are visible.
3. Open one order detail page.
   - Expected: status, items, total, and created time are visible.

## Pass/Fail Summary

- Homepage:
- Product list:
- Product detail:
- Admin login:
- Media upload to Vercel Blob:
- Product creation with image:
- Checkout:
- Admin order detail:
- CSV export:
- Customer order query:
- Notes:
