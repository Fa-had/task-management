"use client";

import { Calendar, Pencil, ArrowRight, Archive } from "lucide-react";
import type { Task, TaskStatus } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, formatDueDate, isDueDateOverdue, STATUS_LABELS, PRIORITY_LABELS } from "@/lib/utils";

interface Props {
  task: Task;
  onEdit: () => void;
  onStatusChange: (status: TaskStatus) => void;
}

const STATUS_BADGE: Record<TaskStatus, "default" | "info" | "success" | "secondary"> = {
  todo: "secondary",
  in_progress: "info",
  done: "success",
  archived: "default",
};

const PRIORITY_BADGE: Record<string, "warning" | "danger" | "info" | "success"> = {
  urgent: "danger",
  high: "warning",
  medium: "info",
  low: "success",
};

const NEXT_STATUS: Partial<Record<TaskStatus, TaskStatus>> = {
  todo: "in_progress",
  in_progress: "done",
  done: "todo",
};

const NEXT_LABEL: Partial<Record<TaskStatus, string>> = {
  todo: "Start",
  in_progress: "Complete",
  done: "Reopen",
};

export function TaskDetailPopover({ task, onEdit, onStatusChange }: Props) {
  const isOverdue = isDueDateOverdue(task.due_date) && task.status !== "done";
  const nextStatus = NEXT_STATUS[task.status];

  return (
    <div className="space-y-3">
      {/* Title + description */}
      <div>
        <h3 className="font-semibold text-sm leading-snug">{task.title}</h3>
        {task.description && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-3">{task.description}</p>
        )}
      </div>

      {/* Badges */}
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge variant={STATUS_BADGE[task.status]}>{STATUS_LABELS[task.status]}</Badge>
        <Badge variant={PRIORITY_BADGE[task.priority]}>{PRIORITY_LABELS[task.priority]}</Badge>
      </div>

      {/* Due date */}
      {task.due_date && (
        <div
          className={cn(
            "flex items-center gap-1.5 text-xs",
            isOverdue ? "text-danger" : "text-muted-foreground"
          )}
        >
          <Calendar className="h-3 w-3" />
          {formatDueDate(task.due_date)}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1">
        <Button variant="outline" size="sm" className="gap-1.5" onClick={onEdit}>
          <Pencil className="h-3 w-3" />
          Edit
        </Button>
        {nextStatus && (
          <Button
            variant="gradient"
            size="sm"
            className="gap-1.5"
            onClick={() => onStatusChange(nextStatus)}
          >
            <ArrowRight className="h-3 w-3" />
            {NEXT_LABEL[task.status]}
          </Button>
        )}
        {task.status !== "archived" && (
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-muted-foreground"
            onClick={() => onStatusChange("archived")}
          >
            <Archive className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
}
