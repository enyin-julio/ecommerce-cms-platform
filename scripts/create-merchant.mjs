import { pbkdf2Sync, randomBytes } from "node:crypto";
import { stdin as input, stdout as output } from "node:process";
import { createInterface } from "node:readline/promises";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const ITERATIONS = 120000;
const KEY_LENGTH = 64;
const DIGEST = "sha512";

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST).toString("hex");

  return `pbkdf2:${ITERATIONS}:${salt}:${hash}`;
}

function validatePassword(password) {
  return (
    password.length >= 12 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /\d/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
}

function validateSlug(slug) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

function parseCategories(value) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => {
      const [name, slug] = item.split(":").map((part) => part?.trim());

      if (!name || !slug || !validateSlug(slug)) {
        throw new Error(
          "MERCHANT_CATEGORIES must use name:slug pairs, for example: New Arrivals:new-arrivals,Featured Products:featured-products"
        );
      }

      return { name, slug };
    });
}

async function askVisible(question, fallback = "") {
  const rl = createInterface({ input, output });

  try {
    const answer = await rl.question(question);
    return answer.trim() || fallback;
  } finally {
    rl.close();
  }
}

async function askHidden(question) {
  if (!input.isTTY) {
    throw new Error("MERCHANT_ADMIN_PASSWORD is required in non-interactive environments.");
  }

  return new Promise((resolve) => {
    let value = "";

    output.write(question);
    input.setRawMode(true);
    input.resume();
    input.setEncoding("utf8");

    function onData(char) {
      if (char === "\u0003") {
        input.setRawMode(false);
        input.off("data", onData);
        process.exit(130);
      }

      if (char === "\r" || char === "\n") {
        input.setRawMode(false);
        input.pause();
        input.off("data", onData);
        output.write("\n");
        resolve(value);
        return;
      }

      if (char === "\b" || char === "\u007f") {
        value = value.slice(0, -1);
        return;
      }

      value += char;
    }

    input.on("data", onData);
  });
}

async function main() {
  if (process.argv.includes("--help")) {
    console.log(`Create or update a production merchant, merchant user, categories, and SiteSetting.

Environment variables:
  MERCHANT_NAME             Required unless entered interactively.
  MERCHANT_SLUG             Required unless entered interactively. Use lowercase slug format.
  MERCHANT_CONTACT_EMAIL    Required unless entered interactively.
  MERCHANT_ADMIN_EMAIL      Required unless entered interactively.
  MERCHANT_ADMIN_PASSWORD   Required unless entered interactively.
  MERCHANT_ADMIN_NAME       Optional. Defaults to Merchant Admin.
  SITE_NAME                 Optional. Defaults to MERCHANT_NAME.
  SITE_PRIMARY_COLOR        Optional. Defaults to #2563eb.
  SITE_SEO_TITLE            Optional.
  SITE_SEO_DESCRIPTION      Optional.
  MERCHANT_CATEGORIES       Optional comma list of name:slug pairs.

Example:
  MERCHANT_NAME="Acme Store" MERCHANT_SLUG="acme-store" MERCHANT_CONTACT_EMAIL="ops@example.com" MERCHANT_ADMIN_EMAIL="manager@example.com" MERCHANT_ADMIN_PASSWORD="..." npm run create:merchant
`);
    return;
  }

  const merchantName = (
    process.env.MERCHANT_NAME || (await askVisible("Merchant name: "))
  ).trim();
  const merchantSlug = (
    process.env.MERCHANT_SLUG || (await askVisible("Merchant slug: "))
  ).trim();
  const contactEmail = (
    process.env.MERCHANT_CONTACT_EMAIL || (await askVisible("Merchant contact email: "))
  )
    .trim()
    .toLowerCase();
  const adminEmail = (
    process.env.MERCHANT_ADMIN_EMAIL || (await askVisible("Merchant admin email: "))
  )
    .trim()
    .toLowerCase();
  const adminName = (
    process.env.MERCHANT_ADMIN_NAME ||
    (await askVisible("Merchant admin name [Merchant Admin]: ", "Merchant Admin"))
  ).trim();
  const password =
    process.env.MERCHANT_ADMIN_PASSWORD || (await askHidden("Merchant admin password: "));
  const siteName = (process.env.SITE_NAME || merchantName).trim();
  const primaryColor = (process.env.SITE_PRIMARY_COLOR || "#2563eb").trim();
  const seoTitle = (process.env.SITE_SEO_TITLE || siteName).trim();
  const seoDescription = (process.env.SITE_SEO_DESCRIPTION || "").trim();
  const categories = parseCategories(
    process.env.MERCHANT_CATEGORIES ||
      "New Arrivals:new-arrivals,Featured Products:featured-products,Brand Picks:brand-picks"
  );

  if (!merchantName) {
    throw new Error("MERCHANT_NAME is required.");
  }

  if (!validateSlug(merchantSlug)) {
    throw new Error("MERCHANT_SLUG must use lowercase letters, numbers, and single hyphens.");
  }

  if (!contactEmail.includes("@") || !adminEmail.includes("@")) {
    throw new Error("Valid merchant contact and admin emails are required.");
  }

  if (!validatePassword(password)) {
    throw new Error(
      "MERCHANT_ADMIN_PASSWORD must be at least 12 characters and include uppercase, lowercase, number, and symbol."
    );
  }

  const merchant = await prisma.merchant.upsert({
    where: {
      slug: merchantSlug
    },
    update: {
      name: merchantName,
      contactEmail
    },
    create: {
      name: merchantName,
      slug: merchantSlug,
      contactEmail
    },
    select: {
      id: true,
      name: true,
      slug: true
    }
  });

  const user = await prisma.user.upsert({
    where: {
      email: adminEmail
    },
    update: {
      name: adminName,
      passwordHash: hashPassword(password),
      role: "merchant",
      merchantId: merchant.id
    },
    create: {
      name: adminName,
      email: adminEmail,
      passwordHash: hashPassword(password),
      role: "merchant",
      merchantId: merchant.id
    },
    select: {
      email: true,
      role: true
    }
  });

  for (const category of categories) {
    await prisma.category.upsert({
      where: {
        merchantId_slug: {
          merchantId: merchant.id,
          slug: category.slug
        }
      },
      update: {
        name: category.name
      },
      create: {
        merchantId: merchant.id,
        name: category.name,
        slug: category.slug
      }
    });
  }

  await prisma.siteSetting.upsert({
    where: {
      merchantId: merchant.id
    },
    update: {
      siteName,
      primaryColor,
      seoTitle: seoTitle || null,
      seoDescription: seoDescription || null
    },
    create: {
      merchantId: merchant.id,
      siteName,
      primaryColor,
      seoTitle: seoTitle || null,
      seoDescription: seoDescription || null
    }
  });

  console.log(`Merchant ready: ${merchant.name} (${merchant.slug})`);
  console.log(`Merchant user ready: ${user.email} (${user.role})`);
  console.log(`Categories ready: ${categories.map((category) => category.slug).join(", ")}`);
  console.log("SiteSetting ready.");
  console.log("Security reminder: remove shell history entries that contain MERCHANT_ADMIN_PASSWORD.");
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
