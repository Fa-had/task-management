import { create } from "zustand";

export interface AntEvent {
  type: "task_created" | "task_completed";
  timestamp: number;
}

interface AntEventStore {
  lastEvent: AntEvent | null;
  emit: (type: AntEvent["type"]) => void;
}

export const useAntEventStore = create<AntEventStore>((set) => ({
  lastEvent: null,
  emit: (type) => set({ lastEvent: { type, timestamp: Date.now() } }),
}));
