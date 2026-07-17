import { format, formatDistanceToNow, parseISO } from "date-fns";

/** "Maya Putri" → "MP" (max 2 letters). */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/** Parse an ISO string safely. */
export function toDate(iso: string): Date {
  return parseISO(iso);
}

/** e.g. "Jan 12, 2026". */
export function formatDate(iso: string): string {
  return format(parseISO(iso), "MMM d, yyyy");
}

/** e.g. "3 days ago". */
export function formatRelative(iso: string): string {
  return formatDistanceToNow(parseISO(iso), { addSuffix: true });
}

/** Clamp a number into a range. */
export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

/** Round to one decimal. */
export function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
