"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { Task } from "@/types";
import { TaskCard } from "./task-card";
import { useFilterStore } from "@/store/filter-store";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  tasks: Task[];
  totalPages: number;
  currentPage: number;
  isLoading: boolean;
  isError: boolean;
}

// Skeleton card
function TaskSkeleton() {
  return (
    <div className="task-card animate-pulse">
      <div className="flex gap-3">
        <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 mt-0.5 flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
          <div className="flex gap-2">
            <div className="h-5 w-16 bg-slate-200 dark:bg-slate-700 rounded-full" />
            <div className="h-5 w-12 bg-slate-200 dark:bg-slate-700 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Empty state
function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  const { resetFilters } = useFilterStore();
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-16"
    >
      <div className="text-6xl mb-4">{hasFilters ? "🔍" : "🐜"}</div>
      <h3 className="text-lg font-semibold mb-1">
        {hasFilters ? "No matching tasks found." : "Your colony is waiting for work."}
      </h3>
      <p className="text-muted-foreground text-sm mb-4">
        {hasFilters
          ? "Try adjusting your filters or search term."
          : "Create your first task to get the ants busy!"}
      </p>
      {hasFilters && (
        <button
          onClick={resetFilters}
          className="text-primary-600 hover:underline text-sm font-medium"
        >
          Clear all filters
        </button>
      )}
    </motion.div>
  );
}

export function TaskList({ tasks, totalPages, currentPage, isLoading, isError }: Props) {
  const { filters, setFilter } = useFilterStore();
  const hasFilters = !!(filters.search || filters.status || filters.priority);

  if (isError) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p className="text-4xl mb-4">⚠️</p>
        <p className="font-medium">Failed to load tasks. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Task cards */}
      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => <TaskSkeleton key={i} />)
        ) : tasks.length === 0 ? (
          <EmptyState hasFilters={hasFilters} />
        ) : (
          <AnimatePresence mode="popLayout">
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => setFilter("page", currentPage - 1)}
            disabled={currentPage <= 1}
            className="p-2 rounded-lg hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <span className="text-sm text-muted-foreground px-2">
            Page {currentPage} of {totalPages}
          </span>

          <button
            onClick={() => setFilter("page", currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="p-2 rounded-lg hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
