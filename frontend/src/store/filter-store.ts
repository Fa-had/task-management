import { create } from "zustand";
import type { TaskFilters } from "@/types";

interface FilterState {
  filters: TaskFilters;
  setFilter: <K extends keyof TaskFilters>(key: K, value: TaskFilters[K]) => void;
  resetFilters: () => void;
}

const defaultFilters: TaskFilters = {
  search:   "",
  status:   "",
  priority: "",
  sort_by:  "created_at",
  order:    "desc",
  page:     1,
  limit:    10,
};

export const useFilterStore = create<FilterState>((set) => ({
  filters: defaultFilters,

  setFilter: (key, value) =>
    set((state) => ({
      filters: { ...state.filters, [key]: value, page: key !== "page" ? 1 : (value as number) },
    })),

  resetFilters: () => set({ filters: defaultFilters }),
}));
