import { expect, test, type Page } from "@playwright/test";
import { Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const admin = {
  email: "admin@example.com",
  password: "Admin123!"
};

const merchant = {
  email: "merchant@example.com",
  password: "Merchant123!"
};

const customer = {
  email: "customer@example.com",
  password: "Customer123!"
};

let marker: string;

test.describe.serial("Admin management and RBAC E2E", () => {
  test.beforeAll(async () => {
    marker = `E2E-${Date.now()}`;
    await seedIsolationData(marker);
  });

  test.afterAll(async () => {
    await prisma.$disconnect();
  });

  test("customer cannot enter admin", async ({ page }) => {
    await page.goto("/login");
    await page.getByTestId("customer-login-email").fill(customer.email);
    await page.getByTestId("customer-login-password").fill(customer.password);
    await page.getByTestId("customer-login-submit").click();
    await expect(page.getByTestId("customer-account")).toBeVisible();

    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test("merchant only sees own products, pages, media, and orders", async ({ page }) => {
    await loginAdmin(page, merchant.email, merchant.password);

    await page.goto("/admin/products");
    await expect(page.getByTestId("admin-products-page")).toBeVisible();
    await expect(page.getByTestId("admin-product-row").filter({ hasText: "DEMO-TOTE-001" })).toHaveCount(1);
    await expect(page.getByTestId("admin-product-row").filter({ hasText: `${marker}-OTHER-PRODUCT` })).toHaveCount(0);

    await page.goto("/admin/pages");
    await expect(page.getByTestId("admin-pages-page")).toBeVisible();
    await expect(page.getByTestId("admin-page-row").filter({ hasText: "Brand Story" })).toHaveCount(1);
    await expect(page.getByTestId("admin-page-row").filter({ hasText: `${marker} Other Page` })).toHaveCount(0);

    await page.goto("/admin/media");
    await expect(page.getByTestId("admin-media-page")).toBeVisible();
    await expect(page.getByTestId("admin-media-row").filter({ hasText: `${marker} Demo Media` })).toHaveCount(1);
    await expect(page.getByTestId("admin-media-row").filter({ hasText: `${marker} Other Media` })).toHaveCount(0);

    await page.goto(`/admin/orders?keyword=${encodeURIComponent(marker)}`);
    await expect(page.getByTestId("admin-orders-page")).toBeVisible();
    await expect(page.getByTestId("admin-order-row").filter({ hasText: `${marker} Demo Customer` })).toHaveCount(1);
    await expect(page.getByTestId("admin-order-row").filter({ hasText: `${marker} Other Customer` })).toHaveCount(0);
  });

  test("admin can see all merchant-owned records", async ({ page }) => {
    await loginAdmin(page, admin.email, admin.password);

    await page.goto("/admin/products");
    await expect(page.getByTestId("admin-product-row").filter({ hasText: `${marker}-OTHER-PRODUCT` })).toHaveCount(1);

    await page.goto("/admin/pages");
    await expect(page.getByTestId("admin-page-row").filter({ hasText: `${marker} Other Page` })).toHaveCount(1);

    await page.goto("/admin/media");
    await expect(page.getByTestId("admin-media-row").filter({ hasText: `${marker} Other Media` })).toHaveCount(1);

    await page.goto(`/admin/orders?keyword=${encodeURIComponent(marker)}`);
    await expect(page.getByTestId("admin-order-row").filter({ hasText: `${marker} Demo Customer` })).toHaveCount(1);
    await expect(page.getByTestId("admin-order-row").filter({ hasText: `${marker} Other Customer` })).toHaveCount(1);
  });

  test("merchant can create, edit, publish, and unpublish a product", async ({ page }) => {
    const slug = `${marker.toLowerCase()}-merchant-product`;
    const sku = `${marker}-MERCHANT-PRODUCT`;
    const updatedName = `${marker} Updated Product`;

    await loginAdmin(page, merchant.email, merchant.password);
    await page.goto("/admin/products/new");
    await expect(page.getByTestId("admin-product-form")).toBeVisible();

    await page.getByTestId("admin-product-name").fill(`${marker} Merchant Product`);
    await page.getByTestId("admin-product-sku").fill(sku);
    await page.getByTestId("admin-product-slug").fill(slug);
    await page.getByTestId("admin-product-stock").fill("9");
    await page.getByTestId("admin-product-price").fill("990");
    await page.getByTestId("admin-product-originalPrice").fill("1290");
    await page.getByTestId("admin-product-shortDescription").fill("E2E product short description");
    await page.getByTestId("admin-product-description").fill("E2E product long description");
    await page.getByTestId("admin-product-seoTitle").fill(`${marker} SEO Product`);
    await page.getByTestId("admin-product-seoDescription").fill("E2E product SEO description");
    await page.getByTestId("admin-product-isPublished").check();
    await page.getByTestId("admin-product-submit").click();

    await expect(page).toHaveURL(/\/admin\/products$/);
    let row = page.getByTestId("admin-product-row").filter({ hasText: sku });
    await expect(row).toHaveCount(1);
    await expect(row).toContainText("已上架");

    await Promise.all([
      page.waitForURL(new RegExp(`/admin/products/.+/edit$`)),
      row.getByTestId("admin-product-edit-link").click()
    ]);
    await expect(page.getByTestId("admin-product-form")).toBeVisible();
    await page.getByTestId("admin-product-name").fill(updatedName);
    await page.getByTestId("admin-product-price").fill("1090");
    await page.getByTestId("admin-product-submit").click();

    row = page.getByTestId("admin-product-row").filter({ hasText: updatedName });
    await expect(row).toHaveCount(1);
    await row.getByTestId("admin-product-toggle").click();
    await expect(page.getByTestId("admin-product-row").filter({ hasText: updatedName })).toContainText("已下架");
  });

  test("merchant can create, edit, publish, and unpublish a CMS page", async ({ page }) => {
    const slug = `${marker.toLowerCase()}-landing`;
    const title = `${marker} Landing Page`;
    const updatedTitle = `${marker} Updated Landing`;

    await loginAdmin(page, merchant.email, merchant.password);
    await page.goto("/admin/pages/new");
    await expect(page.getByTestId("admin-page-form")).toBeVisible();

    await page.getByTestId("admin-page-type").selectOption("landing");
    await page.getByTestId("admin-page-title").fill(title);
    await page.getByTestId("admin-page-slug").fill(slug);
    await page.getByTestId("admin-page-heroTitle").fill(`${marker} Hero`);
    await page.getByTestId("admin-page-heroSubtitle").fill("E2E hero subtitle");
    await page.getByTestId("admin-page-contentBlocks").fill(
      JSON.stringify([{ type: "text", title: "E2E block", body: "E2E body" }], null, 2)
    );
    await page.getByTestId("admin-page-seoTitle").fill(`${marker} SEO Page`);
    await page.getByTestId("admin-page-seoDescription").fill("E2E page SEO description");
    await page.getByTestId("admin-page-submit").click();

    await expect(page).toHaveURL(/\/admin\/pages$/);
    let row = page.getByTestId("admin-page-row").filter({ hasText: title });
    await expect(row).toHaveCount(1);
    await expect(row).toContainText("未發布");

    await Promise.all([
      page.waitForURL(new RegExp(`/admin/pages/.+/edit$`)),
      row.getByTestId("admin-page-edit-link").click()
    ]);
    await expect(page.getByTestId("admin-page-form")).toBeVisible();
    await page.getByTestId("admin-page-title").fill(updatedTitle);
    await page.getByTestId("admin-page-isPublished").check();
    await page.getByTestId("admin-page-submit").click();

    row = page.getByTestId("admin-page-row").filter({ hasText: updatedTitle });
    await expect(row).toHaveCount(1);
    await expect(row).toContainText("已發布");

    await row.getByTestId("admin-page-toggle").click();
    await expect(page.getByTestId("admin-page-row").filter({ hasText: updatedTitle })).toContainText("未發布");
  });

  test("merchant can upload media", async ({ page }) => {
    const altText = `${marker} Uploaded Media`;

    await loginAdmin(page, merchant.email, merchant.password);
    await page.goto("/admin/media");
    await expect(page.getByTestId("admin-media-page")).toBeVisible();

    await page.getByTestId("admin-media-altText").fill(altText);
    await page.getByTestId("admin-media-file").setInputFiles({
      name: `${marker.toLowerCase()}-pixel.png`,
      mimeType: "image/png",
      buffer: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=",
        "base64"
      )
    });
    await page.getByTestId("admin-media-submit").click();

    await expect(page).toHaveURL(/\/admin\/media$/);
    await expect(page.getByTestId("admin-media-row").filter({ hasText: altText })).toHaveCount(1);
  });
});

async function loginAdmin(page: Page, email: string, password: string) {
  await page.goto("/admin/login");
  await page.getByTestId("admin-login-email").fill(email);
  await page.getByTestId("admin-login-password").fill(password);
  await page.getByTestId("admin-login-submit").click();
  await expect(page.getByTestId("admin-dashboard")).toBeVisible();
}

async function seedIsolationData(testMarker: string) {
  const demoMerchant = await prisma.merchant.findUniqueOrThrow({
    where: {
      slug: "demo-merchant"
    }
  });
  const demoProduct = await prisma.product.findFirstOrThrow({
    where: {
      merchantId: demoMerchant.id
    }
  });
  const otherMerchant = await prisma.merchant.create({
    data: {
      name: `${testMarker} Other Merchant`,
      slug: `${testMarker.toLowerCase()}-other-merchant`,
      contactEmail: `${testMarker.toLowerCase()}-other@example.com`
    }
  });
  const otherCategory = await prisma.category.create({
    data: {
      merchantId: otherMerchant.id,
      name: `${testMarker} Other Category`,
      slug: `${testMarker.toLowerCase()}-other-category`
    }
  });
  const otherProduct = await prisma.product.create({
    data: {
      merchantId: otherMerchant.id,
      categoryId: otherCategory.id,
      name: `${testMarker} Other Product`,
      sku: `${testMarker}-OTHER-PRODUCT`,
      slug: `${testMarker.toLowerCase()}-other-product`,
      shortDescription: "Other merchant product for E2E RBAC",
      description: "Other merchant product for E2E RBAC",
      price: new Prisma.Decimal(1200),
      stock: 10,
      isPublished: true
    }
  });

  await prisma.page.createMany({
    data: [
      {
        merchantId: otherMerchant.id,
        title: `${testMarker} Other Page`,
        slug: `${testMarker.toLowerCase()}-other-page`,
        type: "content",
        heroTitle: `${testMarker} Other Hero`,
        contentBlocks: [{ type: "text", body: "Other merchant CMS page" }],
        isPublished: true
      }
    ]
  });

  await prisma.media.createMany({
    data: [
      {
        merchantId: demoMerchant.id,
        url: `/uploads/${testMarker.toLowerCase()}-demo.png`,
        altText: `${testMarker} Demo Media`,
        mimeType: "image/png",
        size: 100
      },
      {
        merchantId: otherMerchant.id,
        url: `/uploads/${testMarker.toLowerCase()}-other.png`,
        altText: `${testMarker} Other Media`,
        mimeType: "image/png",
        size: 100
      }
    ]
  });

  await createOrderForMerchant({
    merchantId: demoMerchant.id,
    productId: demoProduct.id,
    productName: demoProduct.name,
    customerName: `${testMarker} Demo Customer`,
    customerEmail: `${testMarker.toLowerCase()}-demo-order@example.com`
  });
  await createOrderForMerchant({
    merchantId: otherMerchant.id,
    productId: otherProduct.id,
    productName: otherProduct.name,
    customerName: `${testMarker} Other Customer`,
    customerEmail: `${testMarker.toLowerCase()}-other-order@example.com`
  });
}

async function createOrderForMerchant(input: {
  merchantId: string;
  productId: string;
  productName: string;
  customerName: string;
  customerEmail: string;
}) {
  await prisma.order.create({
    data: {
      merchantId: input.merchantId,
      status: "pending",
      customerName: input.customerName,
      customerPhone: "0912555666",
      customerEmail: input.customerEmail,
      shippingAddress: {
        address: "E2E 測試地址",
        phone: "0912555666"
      },
      subtotal: new Prisma.Decimal(100),
      total: new Prisma.Decimal(100),
      items: {
        create: {
          productId: input.productId,
          productName: input.productName,
          unitPrice: new Prisma.Decimal(100),
          quantity: 1
        }
      }
    }
  });
}
