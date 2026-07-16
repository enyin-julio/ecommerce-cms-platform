export function normalizeGoogleSearchVerification(input: FormDataEntryValue | string | null | undefined) {
  const rawValue = typeof input === "string" ? input.trim() : "";

  if (!rawValue) {
    return null;
  }

  const contentMatch = rawValue.match(/content=["']([^"']+)["']/i);
  const value = (contentMatch?.[1] || rawValue).trim().replace(/^["']|["']$/g, "");

  if (!value || value.length > 255 || /[\s<>]/.test(value)) {
    throw new Error("Google Search Console 驗證碼格式不正確");
  }

  return value;
}

export function normalizeGoogleTagManagerId(input: FormDataEntryValue | string | null | undefined) {
  const value = normalizeOptionalCode(input).toUpperCase();

  if (!value) {
    return null;
  }

  if (!/^GTM-[A-Z0-9]+$/.test(value)) {
    throw new Error("Google 代碼管理工具 ID 格式不正確，應類似 GTM-XXXXXXX");
  }

  return value;
}

export function normalizeGoogleAnalyticsMeasurementId(
  input: FormDataEntryValue | string | null | undefined
) {
  const value = normalizeOptionalCode(input).toUpperCase();

  if (!value) {
    return null;
  }

  if (!/^G-[A-Z0-9]+$/.test(value)) {
    throw new Error("Google Analytics 4 Measurement ID 格式不正確，應類似 G-XXXXXXXXXX");
  }

  return value;
}

export function normalizeMetaPixelId(input: FormDataEntryValue | string | null | undefined) {
  const value = normalizeOptionalCode(input);

  if (!value) {
    return null;
  }

  if (!/^[0-9]{6,30}$/.test(value)) {
    throw new Error("Meta 像素 ID 格式不正確，請輸入純數字 ID");
  }

  return value;
}

export function normalizeMarketingNote(input: FormDataEntryValue | string | null | undefined) {
  const value = typeof input === "string" ? input.trim() : "";
  return value ? value.slice(0, 1000) : null;
}

function normalizeOptionalCode(input: FormDataEntryValue | string | null | undefined) {
  return typeof input === "string" ? input.trim().replace(/^["']|["']$/g, "") : "";
}
