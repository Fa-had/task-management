"use client";

import { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";
import { useTasks } from "@/hooks/use-tasks";
import { TaskList } from "@/components/tasks/task-list";
import { TaskForm } from "@/components/tasks/task-form";
import { SearchBar } from "@/components/tasks/search-bar";
import { FilterBar } from "@/components/tasks/filter-bar";
import { DashboardStats } from "@/components/layout/dashboard-stats";
import { AntColony } from "@/components/ants/ant-colony";
import { useFilterStore } from "@/store/filter-store";

interface Props {
  initialPage: number;
  initialSearch: string;
}

export function DashboardClient({ initialPage, initialSearch }: Props) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { setFilter } = useFilterStore();

  // Seed store from URL params on first render
  useEffect(() => {
    if (initialPage > 1) setFilter("page", initialPage);
    if (initialSearch) setFilter("search", initialSearch);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const { data, isLoading, isError } = useTasks();

  const stats = useMemo(() => {
    const tasks = data?.tasks ?? [];
    const now = new Date();
    return {
      total:       data?.total ?? 0,
      completed:   tasks.filter((t) => t.status === "done").length,
      in_progress: tasks.filter((t) => t.status === "in_progress").length,
      overdue:     tasks.filter(
        (t) => t.due_date && new Date(t.due_date) < now && t.status !== "done"
      ).length,
    };
  }, [data]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/30">
      <AntColony
        taskCount={data?.total ?? 0}
        completionRate={stats.completed / Math.max(stats.total, 1)}
      />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Your colony has {data?.total ?? 0} tasks
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsFormOpen(true)}
            className="btn-primary hidden sm:flex items-center gap-2 shadow-lg"
          >
            <Plus className="h-4 w-4" />
            New Task
          </motion.button>
        </div>

        {/* Stats */}
        <DashboardStats stats={stats} isLoading={isLoading} />

        {/* Search + Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mt-8 mb-6">
          <SearchBar />
          <FilterBar />
        </div>

        {/* Task list */}
        <TaskList
          tasks={data?.tasks ?? []}
          totalPages={data?.total_pages ?? 1}
          currentPage={data?.page ?? 1}
          isLoading={isLoading}
          isError={isError}
        />
      </main>

      {/* Floating Action Button */}
      <motion.button
        className="fixed bottom-6 right-6 btn-primary rounded-full p-4 shadow-lg sm:hidden"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsFormOpen(true)}
        aria-label="Create new task"
      >
        <Plus className="h-6 w-6" />
      </motion.button>

      {/* Task Form Modal */}
      <AnimatePresence>
        {isFormOpen && <TaskForm onClose={() => setIsFormOpen(false)} />}
      </AnimatePresence>
    </div>
  );
}
