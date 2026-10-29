import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Tailwind className merge helper
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Convert dollar/decimal input (e.g., 29.99) to integer cents (2999)
export function toCents(dollars: number | string): number {
  const numeric = typeof dollars === "string" ? parseFloat(dollars) : dollars;
  if (isNaN(numeric)) return 0;
  return Math.round(numeric * 100);
}

// Convert integer cents (2999) to decimal dollars (29.99)
export function fromCents(cents: number): number {
  return (cents || 0) / 100;
}

// Format integer cents into a localized currency string ($29.99)
export function formatCurrency(
  cents: number,
  currency: string = "USD",
  locale: string = "en-US"
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
  }).format(fromCents(cents));
}