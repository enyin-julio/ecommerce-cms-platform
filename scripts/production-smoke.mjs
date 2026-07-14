import { chromium } from "playwright";

const baseUrl = process.env.SMOKE_BASE_URL || "https://www.aih.tw";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const results = [];

async function waitForAny(targets, timeout = 15000) {
  const deadline = Date.now() + timeout;
  let lastError;

  for (;;) {
    for (const target of targets) {
      try {
        const locator = target.startsWith("text=")
          ? page.getByText(target.slice(5), { exact: false }).first()
          : page.locator(target).first();

        if ((await locator.count()) > 0 && (await locator.isVisible())) {
          return;
        }
      } catch (error) {
        lastError = error;
      }
    }

    if (Date.now() > deadline) {
      throw lastError || new Error(`等待畫面逾時：${targets.join(", ")}`);
    }

    await page.waitForTimeout(250);
  }
}

async function check(name, run) {
  try {
    await run();
    results.push({ name, ok: true, url: page.url() });
  } catch (error) {
    results.push({
      name,
      ok: false,
      url: page.url(),
      error: String(error?.message || error).slice(0, 500)
    });
  }
}

await check("首頁", async () => {
  const response = await page.goto(baseUrl, {
    waitUntil: "domcontentloaded",
    timeout: 30000
  });
  if (!response?.ok()) {
    throw new Error(`HTTP ${response?.status()}`);
  }
  await page.waitForSelector("body");
});

await check("商品列表", async () => {
  const response = await page.goto(`${baseUrl}/products`, {
    waitUntil: "domcontentloaded",
    timeout: 30000
  });
  if (!response?.ok()) {
    throw new Error(`HTTP ${response?.status()}`);
  }
  await waitForAny([
    "[data-testid='product-list']",
    "[data-testid='product-card']",
    "text=目前沒有上架商品"
  ]);
});

await check("商品搜尋", async () => {
  const response = await page.goto(`${baseUrl}/products?q=aih`, {
    waitUntil: "domcontentloaded",
    timeout: 30000
  });
  if (!response?.ok()) {
    throw new Error(`HTTP ${response?.status()}`);
  }
  await page.waitForSelector("body");
});

let detailUrl = "";

await check("商品詳情", async () => {
  await page.goto(`${baseUrl}/products`, {
    waitUntil: "domcontentloaded",
    timeout: 30000
  });
  const hrefs = await page
    .locator("[data-testid='product-card']")
    .evaluateAll((nodes) => nodes.map((node) => node.href).filter(Boolean));

  if (!hrefs.length) {
    throw new Error("沒有找到商品卡片");
  }

  detailUrl = hrefs[0];
  const response = await page.goto(detailUrl, {
    waitUntil: "domcontentloaded",
    timeout: 30000
  });
  if (!response?.ok()) {
    throw new Error(`HTTP ${response?.status()}`);
  }
  await waitForAny(["[data-testid='product-detail-title']", "h1"]);
});

await check("加入購物車", async () => {
  await page.goto(`${baseUrl}/products`, {
    waitUntil: "domcontentloaded",
    timeout: 30000
  });
  const hrefs = await page
    .locator("[data-testid='product-card']")
    .evaluateAll((nodes) => nodes.map((node) => node.href).filter(Boolean));
  const candidates = hrefs.length ? hrefs : [detailUrl];
  let added = false;
  let lastError = "";

  for (const href of candidates) {
    await page.goto(href, {
      waitUntil: "domcontentloaded",
      timeout: 30000
    });
    const addButton = page.locator("[data-testid='add-to-cart']");

    if (!(await addButton.count())) {
      lastError = "找不到加入購物車按鈕";
      continue;
    }

    if (await addButton.isDisabled()) {
      lastError = "商品按鈕停用，可能已售完";
      continue;
    }

    await addButton.click();
    await page.waitForURL(/\/cart/, { timeout: 15000 });
    await waitForAny(["[data-testid='cart-item']", "text=購物車是空的"]);
    added = true;
    break;
  }

  if (!added) {
    throw new Error(lastError || "無法加入購物車");
  }
});

await check("購物車", async () => {
  const response = await page.goto(`${baseUrl}/cart`, {
    waitUntil: "domcontentloaded",
    timeout: 30000
  });
  if (!response?.ok()) {
    throw new Error(`HTTP ${response?.status()}`);
  }
  await waitForAny(["[data-testid='cart-item']", "text=購物車是空的"]);
});

await check("結帳頁", async () => {
  const response = await page.goto(`${baseUrl}/checkout`, {
    waitUntil: "domcontentloaded",
    timeout: 30000
  });
  if (!response?.ok()) {
    throw new Error(`HTTP ${response?.status()}`);
  }
  await waitForAny(["[data-testid='checkout-form']", "text=購物車是空的"]);
});

await check("建立 TEST 訂單", async () => {
  if (await page.locator("text=購物車是空的").count()) {
    throw new Error("購物車為空，未建立訂單");
  }

  await page.fill("[data-testid='checkout-customerName']", "TEST Smoke Customer");
  await page.fill("[data-testid='checkout-customerPhone']", "900000000");
  await page.fill(
    "[data-testid='checkout-customerEmail']",
    `test-smoke-${Date.now()}@example.com`
  );
  await page.fill("[data-testid='checkout-address']", "TEST smoke address");

  const note = page.locator("[data-testid='checkout-note']");
  if (await note.count()) {
    await note.fill("TEST smoke test order");
  }

  const mockPayment = page.locator("[data-testid='checkout-mock-payment-result']");
  if (await mockPayment.count()) {
    await mockPayment.selectOption("success");
  }

  await page.click("[data-testid='place-order']");
  await page.waitForLoadState("domcontentloaded", { timeout: 30000 });

  if (!/\/checkout\/(success|payment)/.test(page.url())) {
    const checkoutError = await page
      .locator("[data-testid='checkout-error']")
      .textContent()
      .catch(() => "");
    throw new Error(
      `送出後不是成功或付款頁：${page.url()} ${checkoutError || ""}`.trim()
    );
  }
});

await check("會員登入頁", async () => {
  const response = await page.goto(`${baseUrl}/login`, {
    waitUntil: "domcontentloaded",
    timeout: 30000
  });
  if (!response?.ok()) {
    throw new Error(`HTTP ${response?.status()}`);
  }
  await waitForAny(["[data-testid='customer-login-form']", "form"]);
});

await check("會員註冊頁", async () => {
  const response = await page.goto(`${baseUrl}/register`, {
    waitUntil: "domcontentloaded",
    timeout: 30000
  });
  if (!response?.ok()) {
    throw new Error(`HTTP ${response?.status()}`);
  }
  await waitForAny(["[data-testid='customer-register-form']", "form"]);
});

await check("訪客查單頁", async () => {
  const response = await page.goto(`${baseUrl}/order-lookup`, {
    waitUntil: "domcontentloaded",
    timeout: 30000
  });
  if (!response?.ok()) {
    throw new Error(`HTTP ${response?.status()}`);
  }
  await page.waitForSelector("form", { timeout: 15000 });
});

await browser.close();

console.log(JSON.stringify(results, null, 2));

if (results.some((result) => !result.ok)) {
  process.exitCode = 1;
}
