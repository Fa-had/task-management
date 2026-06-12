"use client";

import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { useFilterStore } from "@/store/filter-store";
import { useDebounce } from "@/hooks/use-debounce";

export function SearchBar() {
  const { filters, setFilter } = useFilterStore();
  const [value, setValue] = useState(filters.search);
  const debounced = useDebounce(value, 350);

  useEffect(() => {
    setFilter("search", debounced);
  }, [debounced, setFilter]);

  return (
    <div className="relative flex-1">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search tasks..."
        className="w-full pl-9 pr-8 py-2.5 rounded-xl border bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition text-sm"
      />
      {value && (
        <button
          onClick={() => { setValue(""); setFilter("search", ""); }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
