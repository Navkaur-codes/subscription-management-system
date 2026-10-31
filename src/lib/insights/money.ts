/** ₹ amounts in Indian short units: ₹9.51 Cr, ₹4.20 L, ₹12,500. */
export function shortMoney(n: number): string {
  const a = Math.abs(n);
  if (a >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`;
  if (a >= 1e5) return `₹${(n / 1e5).toFixed(2)} L`;
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}
