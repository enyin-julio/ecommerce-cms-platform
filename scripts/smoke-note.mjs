console.log(`
Deployment smoke test checklist:

Read docs/smoke-test.md and verify the production URL manually after deploy.

Short version:
1. Open homepage.
2. Open /admin/login.
3. Log in as production admin.
4. Open product list and product detail.
5. Add product to cart and create a test order.
6. Confirm order appears in admin.
7. Export CSV.
8. Confirm customer order lookup.
`);
