import type { Severity } from "@/types";

export function classNames(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(iso);
}

export const SEVERITY_STYLE: Record<
  Severity,
  { label: string; chip: string; dot: string; bar: string; card: string; text: string }
> = {
  Critical: {
    label: "Critical",
    chip: "bg-red-500/15 text-red-300 border border-red-500/30",
    dot: "bg-red-500",
    bar: "bg-red-500",
    card: "border-red-500/40 bg-red-500/[0.04]",
    text: "text-red-300",
  },
  High: {
    label: "High",
    chip: "bg-orange-500/15 text-orange-300 border border-orange-500/30",
    dot: "bg-orange-500",
    bar: "bg-orange-500",
    card: "border-orange-500/40 bg-orange-500/[0.04]",
    text: "text-orange-300",
  },
  Medium: {
    label: "Medium",
    chip: "bg-yellow-500/15 text-yellow-300 border border-yellow-500/30",
    dot: "bg-yellow-500",
    bar: "bg-yellow-500",
    card: "border-yellow-500/40 bg-yellow-500/[0.04]",
    text: "text-yellow-300",
  },
  Low: {
    label: "Low",
    chip: "bg-blue-500/15 text-blue-300 border border-blue-500/30",
    dot: "bg-blue-500",
    bar: "bg-blue-500",
    card: "border-blue-500/40 bg-blue-500/[0.04]",
    text: "text-blue-300",
  },
};

export const STATUS_STYLE = {
  Passed: "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30",
  Failed: "bg-red-500/15 text-red-300 border border-red-500/30",
  "In Review": "bg-yellow-500/15 text-yellow-300 border border-yellow-500/30",
} as const;
