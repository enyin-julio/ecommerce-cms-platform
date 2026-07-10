const weakSecretValues = new Set([
  "replace-with-a-long-random-secret",
  "replace-with-a-long-random-secret-at-least-32-characters",
  "changeme",
  "secret"
]);

export function getRequiredServerEnv(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required server environment variable: ${name}`);
  }

  return value;
}

export function getSessionSecret() {
  const secret =
    process.env.SESSION_SECRET?.trim() ||
    process.env.COOKIE_SECRET?.trim() ||
    process.env.NEXTAUTH_SECRET?.trim();

  if (!secret) {
    throw new Error("Missing SESSION_SECRET or COOKIE_SECRET for session signing.");
  }

  if (secret.length < 32 || weakSecretValues.has(secret)) {
    throw new Error("SESSION_SECRET / COOKIE_SECRET must be unique and at least 32 characters.");
  }

  return secret;
}
