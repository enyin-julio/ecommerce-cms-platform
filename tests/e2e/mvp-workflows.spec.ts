import { expect, test } from "@playwright/test";

const admin = {
  email: "admin@example.com",
  password: "Admin123!"
};

const merchant = {
  email: "merchant@example.com",
  password: "Merchant123!"
};

test.describe.serial("MVP end-to-end workflows", () => {
  let customerEmail: string;
  let customerPassword: string;
  let createdOrderId: string;

  test("admin can log in to the dashboard", async ({ page }) => {
    await page.goto("/admin/login");
    await page.getByTestId("admin-login-email").fill(admin.email);
    await page.getByTestId("admin-login-password").fill(admin.password);
    await page.getByTestId("admin-login-submit").click();

    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.getByTestId("admin-dashboard")).toBeVisible();
  });

  test("merchant can log in to the dashboard", async ({ page }) => {
    await page.goto("/admin/login");
    await page.getByTestId("admin-login-email").fill(merchant.email);
    await page.getByTestId("admin-login-password").fill(merchant.password);
    await page.getByTestId("admin-login-submit").click();

    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.getByTestId("admin-dashboard")).toBeVisible();
  });

  test("customer can register, log in, buy a product, and see the order", async ({ page }) => {
    const suffix = Date.now();
    customerEmail = `e2e-customer-${suffix}@example.com`;
    customerPassword = "Customer123!";

    await page.goto("/register");
    await page.getByTestId("customer-register-name").fill("E2E 測試會員");
    await page.getByTestId("customer-register-email").fill(customerEmail);
    await page.getByTestId("customer-register-password").fill(customerPassword);
    await page.getByTestId("customer-register-phone").fill("0912000000");
    await page.getByTestId("customer-register-address").fill("台北市測試路 1 號");
    await page.getByTestId("customer-register-submit").click();

    await expect(page).toHaveURL(/\/account$/);
    await expect(page.getByTestId("customer-account")).toBeVisible();

    await page.goto("/logout");
    await page.goto("/login");
    await page.getByTestId("customer-login-email").fill(customerEmail);
    await page.getByTestId("customer-login-password").fill(customerPassword);
    await page.getByTestId("customer-login-submit").click();

    await expect(page).toHaveURL(/\/account$/);
    await expect(page.getByTestId("customer-account")).toBeVisible();

    await page.goto("/products");
    await expect(page.getByTestId("product-list")).toBeVisible();
    await page.getByTestId("product-card").filter({ hasText: "Daily Canvas Tote" }).click();

    await expect(page.getByTestId("product-detail-title")).toBeVisible();
    await page.getByTestId("product-quantity").fill("1");
    await page.getByTestId("add-to-cart").click();

    await expect(page).toHaveURL(/\/cart$/);
    await expect(page.getByTestId("cart-item")).toHaveCount(1);
    await page.getByTestId("cart-checkout-link").click();

    await expect(page.getByTestId("checkout-form")).toBeVisible();
    await expect(page.getByTestId("checkout-customerName")).toHaveValue("E2E 測試會員");
    await page.getByTestId("place-order").click();

    await expect(page).toHaveURL(/\/checkout\/success/);
    const orderIdText = await page.getByTestId("checkout-success-order-id").innerText();
    createdOrderId = orderIdText.replace("Order ID:", "").trim();
    expect(createdOrderId).not.toEqual("");

    await page.goto("/account/orders");
    await expect(page.getByTestId("customer-orders-heading")).toBeVisible();
    await expect(page.getByTestId("customer-order-row").filter({ hasText: createdOrderId })).toHaveCount(1);
  });

  test("admin can view the created order, update status, and export CSV", async ({ page }) => {
    expect(createdOrderId).toBeTruthy();

    await page.goto("/admin/login");
    await page.getByTestId("admin-login-email").fill(admin.email);
    await page.getByTestId("admin-login-password").fill(admin.password);
    await page.getByTestId("admin-login-submit").click();
    await expect(page.getByTestId("admin-dashboard")).toBeVisible();

    await page.goto(`/admin/orders?keyword=${encodeURIComponent(createdOrderId)}`);
    await expect(page.getByTestId("admin-orders-page")).toBeVisible();
    const targetOrderRow = page.getByTestId("admin-order-row").filter({ hasText: createdOrderId });
    await expect(targetOrderRow).toHaveCount(1);
    await Promise.all([
      page.waitForURL(new RegExp(`/admin/orders/${createdOrderId}$`)),
      targetOrderRow.getByTestId("admin-order-detail-link").click()
    ]);

    await expect(page.getByTestId("admin-order-detail-page")).toBeVisible();
    await expect(page.getByTestId("admin-order-id")).toContainText(createdOrderId);
    await page.getByTestId("admin-order-status-select").selectOption("paid");
    await page.getByTestId("admin-order-status-note").fill("E2E 狀態更新");
    await page.getByTestId("admin-order-status-submit").click();

    await expect(page.getByTestId("admin-order-current-status")).toContainText("已付款");
    await expect(page.getByTestId("admin-order-status-history")).toContainText("E2E 狀態更新");

    await page.goto(`/admin/orders?keyword=${encodeURIComponent(createdOrderId)}`);
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByTestId("admin-orders-export-submit").click()
    ]);

    expect(download.suggestedFilename()).toMatch(/orders-\d{4}-\d{2}-\d{2}\.csv/);
  });
});
