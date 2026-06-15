"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { tasksApi } from "@/lib/api";
import { useFilterStore } from "@/store/filter-store";
import { useAntEventStore } from "@/store/ant-events";
import type { CreateTaskPayload, UpdateTaskPayload, Task } from "@/types";
import { toast } from "sonner";

export const TASKS_KEY = "tasks";

// List tasks
export function useTasks() {
  const { filters } = useFilterStore();

  return useQuery({
    queryKey: [TASKS_KEY, filters],
    queryFn: () => tasksApi.list(filters),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    retry: false,
  });
}

// Single task
export function useTask(id: string) {
  return useQuery({
    queryKey: [TASKS_KEY, id],
    queryFn: () => tasksApi.get(id),
    enabled: !!id,
  });
}

// Create task
export function useCreateTask() {
  const qc = useQueryClient();
  const emit = useAntEventStore((s) => s.emit);

  return useMutation({
    mutationFn: (payload: CreateTaskPayload) => tasksApi.create(payload),
    onSuccess: (newTask) => {
      qc.invalidateQueries({ queryKey: [TASKS_KEY] });
      emit("task_created");
      toast.success("🐜 Task created! The colony got to work.");
      return newTask;
    },
    onError: () => {
      toast.error("Failed to create task. Please try again.");
    },
  });
}

// Update task
export function useUpdateTask() {
  const qc = useQueryClient();
  const emit = useAntEventStore((s) => s.emit);

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateTaskPayload }) =>
      tasksApi.update(id, payload),

    // Optimistic update
    onMutate: async ({ id, payload }) => {
      await qc.cancelQueries({ queryKey: [TASKS_KEY] });
      const previous = qc.getQueriesData({ queryKey: [TASKS_KEY] });

      qc.setQueriesData({ queryKey: [TASKS_KEY] }, (old: unknown) => {
        if (!old || typeof old !== "object") return old;
        const data = old as { tasks: Task[] };
        return {
          ...data,
          tasks: data.tasks?.map((t: Task) =>
            t.id === id ? { ...t, ...payload } : t
          ),
        };
      });

      return { previous };
    },

    onError: (_, __, context) => {
      if (context?.previous) {
        context.previous.forEach(([queryKey, data]) => {
          qc.setQueryData(queryKey, data);
        });
      }
      toast.error("Failed to update task.");
    },

    onSuccess: (task) => {
      if (task.status === "done") {
        emit("task_completed");
        toast.success("🐜 Task completed! The colony celebrates.");
      } else {
        toast.success("Task updated successfully.");
      }
      qc.invalidateQueries({ queryKey: [TASKS_KEY] });
    },
  });
}

// Delete task
export function useDeleteTask() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => tasksApi.delete(id),

    // Optimistic remove
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: [TASKS_KEY] });
      const previous = qc.getQueriesData({ queryKey: [TASKS_KEY] });

      qc.setQueriesData({ queryKey: [TASKS_KEY] }, (old: unknown) => {
        if (!old || typeof old !== "object") return old;
        const data = old as { tasks: Task[]; total: number };
        return {
          ...data,
          tasks: data.tasks?.filter((t: Task) => t.id !== id),
          total: (data.total ?? 1) - 1,
        };
      });

      return { previous };
    },

    onError: (_, __, context) => {
      if (context?.previous) {
        context.previous.forEach(([queryKey, data]) => {
          qc.setQueryData(queryKey, data);
        });
      }
      toast.error("Failed to delete task.");
    },

    onSuccess: () => {
      toast.success("🐜 Task removed. The colony cleaned up.");
      qc.invalidateQueries({ queryKey: [TASKS_KEY] });
    },
  });
}
