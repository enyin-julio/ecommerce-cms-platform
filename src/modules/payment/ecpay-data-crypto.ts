import { createCipheriv, createDecipheriv } from "node:crypto";

export function encryptEcpayData(data: Record<string, unknown>, hashKey: string, hashIv: string) {
  const encoded = encodeURIComponent(JSON.stringify(data));
  const cipher = createCipheriv("aes-128-cbc", createAesBuffer(hashKey, "HashKey"), createAesBuffer(hashIv, "HashIV"));

  return Buffer.concat([cipher.update(encoded, "utf8"), cipher.final()]).toString("base64");
}

export function decryptEcpayData<T extends Record<string, unknown> = Record<string, unknown>>(
  encryptedData: string,
  hashKey: string,
  hashIv: string
) {
  const decipher = createDecipheriv(
    "aes-128-cbc",
    createAesBuffer(hashKey, "HashKey"),
    createAesBuffer(hashIv, "HashIV")
  );
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedData, "base64")),
    decipher.final()
  ]).toString("utf8");

  return JSON.parse(decodeURIComponent(decrypted)) as T;
}

function createAesBuffer(value: string, label: string) {
  const buffer = Buffer.from(value, "utf8");

  if (buffer.length !== 16) {
    throw new Error(`ECPay ${label} must be 16 bytes for AES-128-CBC`);
  }

  return buffer;
}
