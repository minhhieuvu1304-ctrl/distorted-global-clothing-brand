// lib/format.ts
// Small helper so prices display consistently everywhere.

export function formatMoney(amount: string | number, currency = "USD"): string {
  const value = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(value);
}
