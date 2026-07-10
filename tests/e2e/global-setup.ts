import { execSync, spawn, type ChildProcess } from "node:child_process";

const commands = [
  "npx prisma validate",
  "npx prisma generate",
  process.env.CI ? "npx prisma migrate deploy" : "npx prisma migrate dev",
  "npx prisma db seed"
];

export default async function globalSetup() {
  ensureE2ESessionSecret();

  for (const command of commands) {
    execSync(command, {
      cwd: process.cwd(),
      stdio: "inherit",
      env: process.env
    });
  }

  if (await isServerReady()) {
    return;
  }

  const server = spawn("node", ["node_modules/next/dist/bin/next", "dev"], {
    cwd: process.cwd(),
    env: process.env,
    stdio: "inherit",
    windowsHide: true
  });

  await waitForServer(server);

  return async () => {
    stopServer(server);
  };
}

async function isServerReady() {
  try {
    const response = await fetch("http://localhost:3000");
    return response.ok || response.status < 500;
  } catch {
    return false;
  }
}

function ensureE2ESessionSecret() {
  const secret =
    process.env.SESSION_SECRET ||
    process.env.COOKIE_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    "";

  if (secret.length >= 32 && !secret.includes("replace-with")) {
    return;
  }

  process.env.SESSION_SECRET = "e2e-only-session-secret-at-least-32-characters";
}

async function waitForServer(server: ChildProcess) {
  const startedAt = Date.now();
  const timeoutMs = 120000;

  while (Date.now() - startedAt < timeoutMs) {
    if (server.exitCode !== null) {
      throw new Error(`Next.js dev server exited early with code ${server.exitCode}`);
    }

    if (await isServerReady()) {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  throw new Error("Timed out waiting for Next.js dev server at http://localhost:3000");
}

function stopServer(server: ChildProcess) {
  if (!server.pid || server.killed) {
    return;
  }

  if (process.platform === "win32") {
    try {
      execSync(`taskkill /PID ${server.pid} /T /F`, {
        stdio: "ignore"
      });
      return;
    } catch {
      // Fall through to the portable kill path.
    }
  }

  server.kill("SIGTERM");
}
