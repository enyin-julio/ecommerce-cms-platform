export function formatCurrency(value: number | string) {
  const amount = typeof value === "string" ? Number(value) : value;

  return new Intl.NumberFormat("zh-TW", {
    style: "currency",
    currency: "TWD",
    maximumFractionDigits: 0
  }).format(Number.isFinite(amount) ? amount : 0);
}
