"use client";

import { SlidersHorizontal } from "lucide-react";
import { useFilterStore } from "@/store/filter-store";
import type { TaskFilters } from "@/types";

export function FilterBar() {
  const { filters, setFilter, resetFilters } = useFilterStore();
  const hasActiveFilters = !!(filters.status || filters.priority);

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Status */}
      <select
        value={filters.status}
        onChange={(e) => setFilter("status", e.target.value as TaskFilters["status"])}
        className="px-3 py-2.5 rounded-xl border bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition text-sm"
      >
        <option value="">All Status</option>
        <option value="todo">To Do</option>
        <option value="in_progress">In Progress</option>
        <option value="done">Done</option>
      </select>

      {/* Priority */}
      <select
        value={filters.priority}
        onChange={(e) => setFilter("priority", e.target.value as TaskFilters["priority"])}
        className="px-3 py-2.5 rounded-xl border bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition text-sm"
      >
        <option value="">All Priority</option>
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
        <option value="urgent">Urgent</option>
      </select>

      {/* Sort */}
      <select
        value={`${filters.sort_by}:${filters.order}`}
        onChange={(e) => {
          const [sort_by, order] = e.target.value.split(":") as [TaskFilters["sort_by"], TaskFilters["order"]];
          setFilter("sort_by", sort_by);
          setFilter("order", order);
        }}
        className="px-3 py-2.5 rounded-xl border bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition text-sm"
      >
        <option value="created_at:desc">Newest First</option>
        <option value="created_at:asc">Oldest First</option>
        <option value="due_date:asc">Due Date ↑</option>
        <option value="due_date:desc">Due Date ↓</option>
        <option value="priority:desc">Priority ↑</option>
        <option value="priority:asc">Priority ↓</option>
      </select>

      {/* Clear filters */}
      {hasActiveFilters && (
        <button
          onClick={resetFilters}
          className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors border border-dashed"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Clear
        </button>
      )}
    </div>
  );
}
