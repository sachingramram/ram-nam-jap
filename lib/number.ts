// lib/number.ts
// Use a fixed locale so SSR and client render the same string.
const formatter = new Intl.NumberFormat("en-IN"); // Indian numbering system

export function formatNumber(n: number): string {
  return formatter.format(n);
}
