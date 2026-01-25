import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines class names with Tailwind merge for proper precedence
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format currency in USD
 */
export function formatCurrency(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(num);
}

/**
 * Format date for display
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(d);
}

/**
 * Format date with time
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
}

/**
 * Truncate text with ellipsis
 */
export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "...";
}

/**
 * Generate initials from name
 */
export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

/**
 * Sleep utility for async operations
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Commitment status display config
 */
export const commitmentStatusConfig = {
  PENDING: { label: "Pending", color: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
  SHIPPED: { label: "Shipped", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  RECEIVED: { label: "Received", color: "bg-purple-500/10 text-purple-500 border-purple-500/20" },
  FULFILLED: { label: "Fulfilled", color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
  CANCELLED: { label: "Cancelled", color: "bg-red-500/10 text-red-500 border-red-500/20" },
} as const;

/**
 * Deal status display config
 */
export const dealStatusConfig = {
  DRAFT: { label: "Draft", color: "bg-gray-500/10 text-gray-500 border-gray-500/20" },
  ACTIVE: { label: "Active", color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
  PAUSED: { label: "Paused", color: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
  CLOSED: { label: "Closed", color: "bg-red-500/10 text-red-500 border-red-500/20" },
} as const;
