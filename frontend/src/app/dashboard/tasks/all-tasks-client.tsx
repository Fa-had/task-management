"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, SlidersHorizontal, X } from "lucide-react";
import { useTasks, useUpdateTask } from "@/hooks/use-tasks";
import { TaskForm } from "@/components/tasks/task-form";
import { SearchBar } from "@/components/tasks/search-bar";
import { FilterBar } from "@/components/tasks/filter-bar";
import { ColonyStatsBar } from "@/components/ants/colony-stats-bar";
import { TaskColonyView } from "@/components/ants/task-colony-view";
import { AntCelebration } from "@/components/ants/ant-colony";
import { useAntEventStore } from "@/store/ant-events";
import type { Task, TaskStatus } from "@/types";

export function AllTasksClient() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  const { data, isLoading, isError } = useTasks();
  const { mutate: updateTask } = useUpdateTask();
  const lastEvent = useAntEventStore((s) => s.lastEvent);

  // Celebration overlay on task completion
  const lastEventRef = useRef<string | null>(null);
  useEffect(() => {
    if (!lastEvent) return;
    if (lastEventRef.current === String(lastEvent.timestamp)) return;
    lastEventRef.current = String(lastEvent.timestamp);
    if (lastEvent.type === "task_completed") {
      setShowCelebration(true);
    }
  }, [lastEvent]);

  const stats = useMemo(() => {
    const tasks = data?.tasks ?? [];
    const now = new Date();
    return {
      total: data?.total ?? 0,
      completed: tasks.filter((t) => t.status === "done").length,
      inProgress: tasks.filter((t) => t.status === "in_progress").length,
      overdue: tasks.filter(
        (t) => t.due_date && new Date(t.due_date) < now && t.status !== "done"
      ).length,
    };
  }, [data]);

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsFormOpen(true);
  };

  const handleStatusChange = (id: string, status: TaskStatus) => {
    updateTask({ id, payload: { status } });
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingTask(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/30">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">All Tasks</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              {data?.total ?? 0} tasks in your colony
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Filter toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm transition-colors ${
                showFilters
                  ? "bg-primary-50 dark:bg-primary-900/20 border-primary-300 dark:border-primary-700 text-primary-600"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
            </button>

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

        {/* Stats bar */}
        <div className="mb-4">
          <ColonyStatsBar
            total={stats.total}
            completed={stats.completed}
            inProgress={stats.inProgress}
            overdue={stats.overdue}
            isLoading={isLoading}
          />
        </div>

        {/* Floating filter overlay */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="filter-overlay"
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="text-sm font-medium">Filters</span>
                <button
                  onClick={() => setShowFilters(false)}
                  className="ml-auto p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <SearchBar />
                <FilterBar />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Colony view */}
        {isError ? (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-4xl mb-4">{"\u26A0\uFE0F"}</p>
            <p className="font-medium">Failed to load tasks. Please try again.</p>
          </div>
        ) : (
          <TaskColonyView
            tasks={data?.tasks ?? []}
            onEditTask={handleEditTask}
            onStatusChange={handleStatusChange}
          />
        )}
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

      {/* Task Form Modal */}
      <AnimatePresence>
        {isFormOpen && (
          <TaskForm task={editingTask ?? undefined} onClose={closeForm} />
        )}
      </AnimatePresence>

      {/* Celebration Overlay */}
      <AnimatePresence>
        {showCelebration && (
          <AntCelebration onDone={() => setShowCelebration(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
