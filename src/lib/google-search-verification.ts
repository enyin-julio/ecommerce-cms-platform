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
