import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function kgToLbs(kg: number): number {
  return Math.round(kg * 2.2046 * 4) / 4; // round to nearest 0.25
}

export function lbsToKg(lbs: number): number {
  return Math.round((lbs / 2.2046) * 4) / 4;
}

export function formatWeight(kg: number, unit: "lbs" | "kg"): string {
  if (unit === "lbs") {
    return `${kgToLbs(kg)} lbs`;
  }
  return `${kg} kg`;
}

export function parseWeightToKg(value: number, unit: "lbs" | "kg"): number {
  if (unit === "lbs") return lbsToKg(value);
  return value;
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function formatRelativeDate(date: Date | string): string {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return formatDate(d);
}
