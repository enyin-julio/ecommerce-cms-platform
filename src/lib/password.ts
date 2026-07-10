import { pbkdf2Sync, randomBytes, timingSafeEqual } from "crypto";

const ITERATIONS = 120000;
const KEY_LENGTH = 64;
const DIGEST = "sha512";

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST).toString("hex");

  return `pbkdf2:${ITERATIONS}:${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string) {
  const [method, iterationsValue, salt, hash] = storedHash.split(":");

  if (method !== "pbkdf2" || !iterationsValue || !salt || !hash) {
    return false;
  }

  const derivedHash = pbkdf2Sync(
    password,
    salt,
    Number(iterationsValue),
    KEY_LENGTH,
    DIGEST
  );
  const storedHashBuffer = Buffer.from(hash, "hex");

  if (derivedHash.length !== storedHashBuffer.length) {
    return false;
  }

  return timingSafeEqual(derivedHash, storedHashBuffer);
}
