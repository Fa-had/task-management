"use client";

import { motion, useSpring, useTransform } from "framer-motion";
import { useEffect } from "react";
import { List, CheckCircle2, Clock, AlertTriangle } from "lucide-react";

interface Props {
  total: number;
  completed: number;
  inProgress: number;
  overdue: number;
  isLoading: boolean;
}

function AnimatedNumber({ value }: { value: number }) {
  const spring = useSpring(0, { stiffness: 100, damping: 20 });
  const display = useTransform(spring, (v) => Math.round(v).toString());

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  return <motion.span>{display}</motion.span>;
}

const stats = [
  { key: "total" as const, label: "Total", icon: List, color: "text-indigo-500" },
  { key: "completed" as const, label: "Done", icon: CheckCircle2, color: "text-green-500" },
  { key: "inProgress" as const, label: "Active", icon: Clock, color: "text-blue-500" },
  { key: "overdue" as const, label: "Overdue", icon: AlertTriangle, color: "text-red-500" },
];

export function ColonyStatsBar({ total, completed, inProgress, overdue, isLoading }: Props) {
  const values = { total, completed, inProgress, overdue };

  if (isLoading) {
    return (
      <div className="flex items-center gap-4 px-4">
        {stats.map((s) => (
          <div key={s.key} className="flex items-center gap-1.5 animate-pulse">
            <div className="h-4 w-4 rounded bg-slate-200 dark:bg-slate-700" />
            <div className="h-4 w-8 rounded bg-slate-200 dark:bg-slate-700" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-5 px-4 py-2 glass-card rounded-xl">
      {stats.map(({ key, label, icon: Icon, color }, i) => (
        <motion.div
          key={key}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06 }}
          className="flex items-center gap-1.5"
        >
          <Icon className={`h-4 w-4 ${color}`} />
          <span className="text-sm font-semibold">
            <AnimatedNumber value={values[key]} />
          </span>
          <span className="text-xs text-muted-foreground hidden sm:inline">{label}</span>
        </motion.div>
      ))}
    </div>
  );
}
