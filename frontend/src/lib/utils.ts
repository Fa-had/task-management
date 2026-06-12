import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, isPast, isToday, isTomorrow } from "date-fns";

// Tailwind class merger
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Date helpers
export function formatDueDate(date: string | null): string {
  if (!date) return "No due date";
  const d = new Date(date);
  if (isToday(d)) return "Today";
  if (isTomorrow(d)) return "Tomorrow";
  return format(d, "MMM d, yyyy");
}

export function isDueDateOverdue(date: string | null): boolean {
  if (!date) return false;
  return isPast(new Date(date));
}

export function formatRelativeTime(date: string): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

// Priority helpers
export const PRIORITY_ORDER = { urgent: 4, high: 3, medium: 2, low: 1 } as const;

export const PRIORITY_COLORS = {
  low:    "text-green-500  bg-green-50  dark:bg-green-900/20",
  medium: "text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20",
  high:   "text-orange-500 bg-orange-50 dark:bg-orange-900/20",
  urgent: "text-red-500    bg-red-50    dark:bg-red-900/20",
} as const;

export const STATUS_COLORS = {
  todo:        "text-slate-500  bg-slate-100  dark:bg-slate-800",
  in_progress: "text-blue-500   bg-blue-50    dark:bg-blue-900/20",
  done:        "text-green-500  bg-green-50   dark:bg-green-900/20",
  archived:    "text-gray-400   bg-gray-100   dark:bg-gray-800",
} as const;

export const STATUS_LABELS = {
  todo:        "To Do",
  in_progress: "In Progress",
  done:        "Done",
  archived:    "Archived",
} as const;

export const PRIORITY_LABELS = {
  low:    "Low",
  medium: "Medium",
  high:   "High",
  urgent: "Urgent",
} as const;
