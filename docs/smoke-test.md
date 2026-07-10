# Deployment Smoke Test Checklist

Run this checklist immediately after deploying to production or a production-like
preview environment. Use a safe test product and a safe test order. Do not use
real customer payment or logistics data.

## Environment

- Production URL:
- Admin email:
- Test customer email:
- Deployment version or commit:
- Date:

## Public Storefront

1. Open the homepage.
   - Expected: homepage loads without a server error.
2. Open `/products`.
   - Expected: product list loads.
3. Open one product detail page.
   - Expected: product name, price, stock, and add-to-cart button are visible.
4. Add one product to cart.
   - Expected: browser redirects to `/cart`.
5. Open `/cart`.
   - Expected: cart item, quantity, and total are visible.
6. Open `/checkout`.
   - Expected: checkout form loads.
7. Create a test order.
   - Expected: success page shows an order id.

## Admin

1. Open `/admin/login`.
   - Expected: login form loads.
2. Log in as production admin.
   - Expected: `/admin` dashboard loads.
3. Open `/admin/products`.
   - Expected: product table loads.
4. Open `/admin/pages`.
   - Expected: CMS page table loads.
5. Open `/admin/media`.
   - Expected: media library loads.
6. Upload a JPG, PNG, or WebP image under 5MB.
   - Expected: upload succeeds and the media URL is a Vercel Blob URL when
     `STORAGE_PROVIDER=vercel-blob`.
7. Create or edit a product and use the uploaded media URL as its image.
   - Expected: product list and product detail show the image.
8. Open `/admin/orders`.
   - Expected: order list loads.
9. Search for the test order id.
   - Expected: the order appears.
10. Open the order detail page.
   - Expected: customer info, items, total, and status history are visible.
11. Update order status if appropriate.
   - Expected: status changes and history is written.
12. Export CSV from `/admin/orders`.
    - Expected: CSV file downloads and contains only authorized order data.

## Customer Account

1. Open `/login`.
   - Expected: customer login form loads.
2. Log in as test customer.
   - Expected: `/account` loads.
3. Open `/account/orders`.
   - Expected: only that customer's orders appear.
4. Open one order detail page.
   - Expected: items, status, total, and created time are visible.

## Guest Order Lookup

1. Open `/order-lookup`.
   - Expected: guest lookup form loads.
2. Search with guest email and order id.
   - Expected: only matching guest orders are shown.
3. Search with the wrong email.
   - Expected: no order details are shown.

## Security Checks

- Customer account cannot access `/admin`.
- Logout clears the session.
- Login failure message does not reveal whether an email exists.
- Production uses HTTPS.
- Session cookies are secure in production.

## Pass/Fail

- Storefront:
- Checkout:
- Admin:
- CSV export:
- Customer account:
- Guest lookup:
- Notes:
