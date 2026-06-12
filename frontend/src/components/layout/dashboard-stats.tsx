"use client";

import { motion, useSpring, useTransform } from "framer-motion";
import { CheckCircle2, Clock, AlertTriangle, List } from "lucide-react";
import type { DashboardStats } from "@/types";
import { useEffect, useRef } from "react";

interface Props {
  stats: DashboardStats;
  isLoading: boolean;
}

function AnimatedNumber({ value }: { value: number }) {
  const spring = useSpring(0, { stiffness: 100, damping: 20 });
  const display = useTransform(spring, (v) => Math.round(v).toString());

  useEffect(() => { spring.set(value); }, [spring, value]);

  return <motion.span>{display}</motion.span>;
}

const cards = [
  {
    key: "total" as const,
    label: "Total Tasks",
    icon: List,
    color: "text-indigo-500",
    bg: "bg-indigo-50 dark:bg-indigo-900/20",
  },
  {
    key: "completed" as const,
    label: "Completed",
    icon: CheckCircle2,
    color: "text-green-500",
    bg: "bg-green-50 dark:bg-green-900/20",
  },
  {
    key: "in_progress" as const,
    label: "In Progress",
    icon: Clock,
    color: "text-blue-500",
    bg: "bg-blue-50 dark:bg-blue-900/20",
  },
  {
    key: "overdue" as const,
    label: "Overdue",
    icon: AlertTriangle,
    color: "text-red-500",
    bg: "bg-red-50 dark:bg-red-900/20",
  },
];

export function DashboardStats({ stats, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.key} className="stat-card animate-pulse">
            <div className="h-10 w-10 rounded-xl bg-slate-200 dark:bg-slate-700" />
            <div className="h-8 w-16 rounded bg-slate-200 dark:bg-slate-700 mt-2" />
            <div className="h-4 w-20 rounded bg-slate-200 dark:bg-slate-700" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map(({ key, label, icon: Icon, color, bg }, i) => (
        <motion.div
          key={key}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08 }}
          className="stat-card"
        >
          <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>
            <Icon className={`h-5 w-5 ${color}`} />
          </div>
          <p className="text-3xl font-bold mt-2">
            <AnimatedNumber value={stats[key]} />
          </p>
          <p className="text-sm text-muted-foreground">{label}</p>
        </motion.div>
      ))}
    </div>
  );
}
