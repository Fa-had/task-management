"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import type { Task } from "@/types";
import { formatRelativeTime, STATUS_LABELS } from "@/lib/utils";

interface Props {
  tasks: Task[];
}

interface TimelineEntry {
  id: string;
  message: string;
  time: string;
  emoji: string;
}

function buildTimeline(tasks: Task[]): TimelineEntry[] {
  const entries: TimelineEntry[] = [];

  // Build a flat activity feed from task metadata
  for (const task of tasks) {
    if (task.completed_at) {
      entries.push({
        id: `${task.id}-done`,
        message: `Completed "${task.title}"`,
        time: task.completed_at,
        emoji: "✅",
      });
    }

    entries.push({
      id: `${task.id}-created`,
      message: `Created "${task.title}"`,
      time: task.created_at,
      emoji: "🐜",
    });

    if (task.updated_at !== task.created_at && !task.completed_at) {
      entries.push({
        id: `${task.id}-updated`,
        message: `Updated "${task.title}" → ${STATUS_LABELS[task.status]}`,
        time: task.updated_at,
        emoji: "✏️",
      });
    }
  }

  // Sort newest first, take top 12
  return entries
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    .slice(0, 12);
}

export function ActivityTimeline({ tasks }: Props) {
  const entries = useMemo(() => buildTimeline(tasks), [tasks]);

  return (
    <div className="glass-card rounded-2xl p-5">
      <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
        <span>🐜</span> Colony Activity
      </h3>

      {entries.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">
          No activity yet. Create a task!
        </p>
      ) : (
        <ol className="relative space-y-0">
          {entries.map((entry, i) => (
            <motion.li
              key={entry.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="flex gap-3 pb-4 last:pb-0 relative"
            >
              {/* Connector line */}
              {i < entries.length - 1 && (
                <div className="absolute left-3.5 top-6 bottom-0 w-px bg-border" />
              )}

              {/* Emoji dot */}
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-accent flex items-center justify-center text-xs z-10">
                {entry.emoji}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pt-0.5">
                <p className="text-xs text-foreground leading-snug line-clamp-2">
                  {entry.message}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatRelativeTime(entry.time)}
                </p>
              </div>
            </motion.li>
          ))}
        </ol>
      )}
    </div>
  );
}
