"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Loader2, X } from "lucide-react";
import type { Task } from "@/types";
import { useCreateTask, useUpdateTask } from "@/hooks/use-tasks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const taskSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().max(2000).optional().default(""),
  status: z.enum(["todo", "in_progress", "done", "archived"]).default("todo"),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  due_date: z.string().optional().nullable(),
});

type TaskFormData = z.infer<typeof taskSchema>;

interface Props {
  task?: Task;
  onClose: () => void;
}

export function TaskForm({ task, onClose }: Props) {
  const isEditing = !!task;
  const { mutate: createTask, isPending: isCreating } = useCreateTask();
  const { mutate: updateTask, isPending: isUpdating } = useUpdateTask();
  const isPending = isCreating || isUpdating;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: task?.title ?? "",
      description: task?.description ?? "",
      status: task?.status ?? "todo",
      priority: task?.priority ?? "medium",
      due_date: task?.due_date ? task.due_date.split("T")[0] : null,
    },
  });

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const onSubmit = (data: TaskFormData) => {
    const payload = {
      ...data,
      due_date: data.due_date ? new Date(data.due_date).toISOString() : null,
    };
    if (isEditing) {
      updateTask({ id: task.id, payload }, { onSuccess: onClose });
    } else {
      createTask(payload, { onSuccess: onClose });
    }
  };

  return (
    // Backdrop
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="glass-card rounded-2xl w-full max-w-lg shadow-glass overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-border/50">
          <h2 className="text-lg font-semibold">
            {isEditing ? "Edit Task" : "Create New Task"}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="title">
              Title <span className="text-danger">*</span>
            </Label>
            <Input
              id="title"
              placeholder="What needs to be done?"
              className="bg-white/50 dark:bg-slate-800/50"
              {...register("title")}
            />
            {errors.title && (
              <p className="text-danger text-xs">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              rows={3}
              placeholder="Add some details..."
              className="bg-white/50 dark:bg-slate-800/50"
              {...register("description")}
            />
          </div>

          {/* Status + Priority row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select
                defaultValue={watch("status")}
                onValueChange={(v) =>
                  setValue("status", v as TaskFormData["status"])
                }
              >
                <SelectTrigger className="bg-white/50 dark:bg-slate-800/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select
                defaultValue={watch("priority")}
                onValueChange={(v) =>
                  setValue("priority", v as TaskFormData["priority"])
                }
              >
                <SelectTrigger className="bg-white/50 dark:bg-slate-800/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">🟢 Low</SelectItem>
                  <SelectItem value="medium">🟡 Medium</SelectItem>
                  <SelectItem value="high">🟠 High</SelectItem>
                  <SelectItem value="urgent">🔴 Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Due date */}
          <div className="space-y-1.5">
            <Label htmlFor="due_date">Due Date</Label>
            <Input
              id="due_date"
              type="date"
              className="bg-white/50 dark:bg-slate-800/50"
              {...register("due_date")}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="gradient"
              className="flex-1"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                </>
              ) : isEditing ? (
                "Save Changes"
              ) : (
                "Create Task"
              )}
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
