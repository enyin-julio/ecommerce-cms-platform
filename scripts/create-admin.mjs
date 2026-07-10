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
    throw new Error("ADMIN_PASSWORD is required in non-interactive environments.");
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
    console.log(`Create or update a production admin user.

Environment variables:
  ADMIN_EMAIL       Required unless entered interactively.
  ADMIN_PASSWORD    Required unless entered interactively.
  ADMIN_NAME        Optional. Defaults to Production Admin.

Example:
  ADMIN_EMAIL="owner@example.com" ADMIN_PASSWORD="..." npm run create:admin
`);
    return;
  }

  const email = (
    process.env.ADMIN_EMAIL ||
    (await askVisible("Admin email: "))
  ).trim().toLowerCase();
  const name = (
    process.env.ADMIN_NAME ||
    (await askVisible("Admin name [Production Admin]: ", "Production Admin"))
  ).trim();
  const password = process.env.ADMIN_PASSWORD || (await askHidden("Admin password: "));

  if (!email || !email.includes("@")) {
    throw new Error("A valid ADMIN_EMAIL is required.");
  }

  if (!validatePassword(password)) {
    throw new Error(
      "ADMIN_PASSWORD must be at least 12 characters and include uppercase, lowercase, number, and symbol."
    );
  }

  const user = await prisma.user.upsert({
    where: {
      email
    },
    update: {
      name,
      passwordHash: hashPassword(password),
      role: "admin",
      merchantId: null
    },
    create: {
      name,
      email,
      passwordHash: hashPassword(password),
      role: "admin",
      merchantId: null
    },
    select: {
      email: true,
      role: true
    }
  });

  console.log(`Admin user ready: ${user.email} (${user.role})`);
  console.log("Security reminder: remove shell history entries that contain ADMIN_PASSWORD.");
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
