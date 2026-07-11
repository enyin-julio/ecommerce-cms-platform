import { createHash, timingSafeEqual } from "node:crypto";

type EcpayParams = Record<string, unknown>;

function normalizeEcpayEncodedValue(value: string) {
  return encodeURIComponent(value)
    .toLowerCase()
    .replace(/%20/g, "+")
    .replace(/%2d/g, "-")
    .replace(/%5f/g, "_")
    .replace(/%2e/g, ".")
    .replace(/%21/g, "!")
    .replace(/%2a/g, "*")
    .replace(/%28/g, "(")
    .replace(/%29/g, ")")
    .replace(/%7e/g, "~");
}

export function buildEcpayCheckMacValue(
  params: EcpayParams,
  hashKey: string,
  hashIv: string
) {
  const source = Object.entries(params)
    .filter(([key, value]) => key !== "CheckMacValue" && value !== null && value !== undefined)
    .sort(([left], [right]) => left.toLowerCase().localeCompare(right.toLowerCase()))
    .map(([key, value]) => `${key}=${stringifyEcpayValue(value)}`)
    .join("&");

  const encoded = normalizeEcpayEncodedValue(`HashKey=${hashKey}&${source}&HashIV=${hashIv}`);

  return createHash("sha256").update(encoded).digest("hex").toUpperCase();
}

function stringifyEcpayValue(value: unknown) {
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return JSON.stringify(value);
}

export function verifyEcpayCheckMacValue(
  params: EcpayParams,
  hashKey: string,
  hashIv: string
) {
  const expected = buildEcpayCheckMacValue(params, hashKey, hashIv);
  const received = String(params.CheckMacValue || "").toUpperCase();

  if (!received || received.length !== expected.length) {
    return false;
  }

  return timingSafeEqual(Buffer.from(received), Buffer.from(expected));
}
