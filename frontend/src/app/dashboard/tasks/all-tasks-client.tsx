"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, LayoutGrid, List, CheckCheck } from "lucide-react";
import { useTasks, useUpdateTask, useDeleteTask } from "@/hooks/use-tasks";
import { TaskList } from "@/components/tasks/task-list";
import { TaskCard } from "@/components/tasks/task-card";
import { TaskForm } from "@/components/tasks/task-form";
import { SearchBar } from "@/components/tasks/search-bar";
import { FilterBar } from "@/components/tasks/filter-bar";
import { ActivityTimeline } from "@/components/tasks/activity-timeline";
import { cn } from "@/lib/utils";

type View = "list" | "grid";

export function AllTasksClient() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [view, setView] = useState<View>("list");

  const { data, isLoading, isError } = useTasks();
  const { mutate: updateTask } = useUpdateTask();

  const pendingTasks = (data?.tasks ?? []).filter(
    (t) => t.status !== "done" && t.status !== "archived"
  );

  const handleCompleteAll = () => {
    if (!pendingTasks.length) return;
    if (!confirm(`Mark all ${pendingTasks.length} pending tasks as done?`)) return;
    pendingTasks.forEach((t) => updateTask({ id: t.id, payload: { status: "done" } }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/30">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">All Tasks</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              {data?.total ?? 0} tasks in your colony
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div className="hidden sm:flex items-center gap-1 p-1 rounded-lg bg-accent">
              {(["list", "grid"] as View[]).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={cn(
                    "p-1.5 rounded-md transition-colors",
                    view === v
                      ? "bg-white dark:bg-slate-800 shadow-sm text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  title={`${v} view`}
                >
                  {v === "list" ? (
                    <List className="h-4 w-4" />
                  ) : (
                    <LayoutGrid className="h-4 w-4" />
                  )}
                </button>
              ))}
            </div>

            {/* Complete all */}
            {pendingTasks.length > 0 && (
              <button
                onClick={handleCompleteAll}
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <CheckCheck className="h-4 w-4" />
                Complete all
              </button>
            )}

            {/* New task */}
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setIsFormOpen(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              New Task
            </motion.button>
          </div>
        </div>

        {/* Search + Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <SearchBar />
          <FilterBar />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Tasks */}
          <div className="lg:col-span-2">
            {view === "list" ? (
              <TaskList
                tasks={data?.tasks ?? []}
                totalPages={data?.total_pages ?? 1}
                currentPage={data?.page ?? 1}
                isLoading={isLoading}
                isError={isError}
              />
            ) : (
              /* Grid view */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {isLoading
                  ? Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="task-card h-32 animate-pulse bg-slate-100 dark:bg-slate-800" />
                    ))
                  : (data?.tasks ?? []).map((task) => (
                      <TaskCard key={task.id} task={task} />
                    ))}
              </div>
            )}
          </div>

          {/* Activity Timeline */}
          <div className="hidden lg:block">
            <ActivityTimeline tasks={data?.tasks ?? []} />
          </div>
        </div>
      </main>

      {/* Mobile FAB */}
      <motion.button
        className="fixed bottom-6 right-6 btn-primary rounded-full p-4 shadow-lg sm:hidden"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsFormOpen(true)}
        aria-label="Create new task"
      >
        <Plus className="h-6 w-6" />
      </motion.button>

      <AnimatePresence>
        {isFormOpen && <TaskForm onClose={() => setIsFormOpen(false)} />}
      </AnimatePresence>
    </div>
  );
}
