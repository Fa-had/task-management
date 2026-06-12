"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Calendar, MoreHorizontal, CheckCircle2, Trash2, Pencil } from "lucide-react";
import type { Task } from "@/types";
import {
  cn,
  formatDueDate,
  isDueDateOverdue,
  PRIORITY_COLORS,
  STATUS_COLORS,
  STATUS_LABELS,
  PRIORITY_LABELS,
} from "@/lib/utils";
import { useUpdateTask, useDeleteTask } from "@/hooks/use-tasks";
import { TaskForm } from "./task-form";

interface Props {
  task: Task;
}

export function TaskCard({ task }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const { mutate: updateTask } = useUpdateTask();
  const { mutate: deleteTask } = useDeleteTask();

  const isOverdue =
    isDueDateOverdue(task.due_date) && task.status !== "done";
  const isDone = task.status === "done";

  const handleComplete = () => {
    updateTask({
      id: task.id,
      payload: { status: isDone ? "todo" : "done" },
    });
  };

  const handleDelete = () => {
    if (confirm("Delete this task?")) {
      deleteTask(task.id);
    }
  };

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={cn(
          "task-card group",
          isDone && "opacity-60"
        )}
      >
        <div className="flex items-start gap-3">
          {/* Complete toggle */}
          <button
            onClick={handleComplete}
            className={cn(
              "mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 transition-colors",
              isDone
                ? "border-green-500 bg-green-500 text-white"
                : "border-muted-foreground hover:border-primary-500"
            )}
            aria-label={isDone ? "Mark incomplete" : "Mark complete"}
          >
            {isDone && <CheckCircle2 className="h-4 w-4" />}
          </button>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3
              className={cn(
                "font-medium text-sm leading-snug",
                isDone && "line-through text-muted-foreground"
              )}
            >
              {task.title}
            </h3>

            {task.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {task.description}
              </p>
            )}

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {/* Status */}
              <span
                className={cn(
                  "text-xs px-2 py-0.5 rounded-full font-medium",
                  STATUS_COLORS[task.status]
                )}
              >
                {STATUS_LABELS[task.status]}
              </span>

              {/* Priority */}
              <span
                className={cn(
                  "text-xs px-2 py-0.5 rounded-full font-medium",
                  PRIORITY_COLORS[task.priority]
                )}
              >
                {PRIORITY_LABELS[task.priority]}
              </span>

              {/* Due date */}
              {task.due_date && (
                <span
                  className={cn(
                    "flex items-center gap-1 text-xs",
                    isOverdue ? "text-danger" : "text-muted-foreground"
                  )}
                >
                  <Calendar className="h-3 w-3" />
                  {formatDueDate(task.due_date)}
                </span>
              )}
            </div>
          </div>

          {/* Actions (visible on hover) */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => setIsEditing(true)}
              className="p-1 rounded hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
              aria-label="Edit task"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={handleDelete}
              className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-muted-foreground hover:text-danger"
              aria-label="Delete task"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Edit modal */}
      {isEditing && (
        <TaskForm task={task} onClose={() => setIsEditing(false)} />
      )}
    </>
  );
}
