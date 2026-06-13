"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { TaskDetailPopover } from "./task-detail-popover";
import type { Task, TaskStatus } from "@/types";
import { useAntEventStore } from "@/store/ant-events";

interface Props {
  tasks: Task[];
  onEditTask: (task: Task) => void;
  onStatusChange: (id: string, status: TaskStatus) => void;
}

// ─── Ant state ────────────────────────────────────────────────────────────────

interface ColonyAnt {
  id: string;
  x: number;
  y: number;
  direction: number;
  targetAngle: number;
  speed: number;
  behavior: "idle" | "wandering" | "investigating" | "celebrating" | "returning";
  behaviorTimer: number;
  pauseTimer: number;
  scale: number;
  targetX: number | null;
  targetY: number | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ANT_EMOJI = "\u{1F41C}";
const FPS = 24;
const FRAME_INTERVAL = 1000 / FPS;

const EDGE_MARGIN = 60;
const EDGE_STEER_FORCE = 3.0;
const HEADING_DRIFT = 0.3;

const IDLE_SPEED = 0.3;
const WANDERING_SPEED = 0.5;
const INVESTIGATE_SPEED = 1.0;
const INVESTIGATE_DURATION = 80;
const INVESTIGATE_PAUSE = 24;
const CELEBRATE_DURATION = 60;
const CELEBRATE_SPIN = 6;
const RETURN_DURATION = 40;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function randomAngle(): number {
  return Math.random() * 360;
}

function lerpAngle(current: number, target: number, t: number): number {
  let diff = target - current;
  while (diff > 180) diff -= 360;
  while (diff < -180) diff += 360;
  return current + diff * Math.min(t, 1);
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function dist(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

function edgeSteering(ant: ColonyAnt, w: number, h: number): number {
  let steer = 0;
  if (ant.x < EDGE_MARGIN) steer += EDGE_STEER_FORCE * (1 - ant.x / EDGE_MARGIN);
  if (ant.x > w - EDGE_MARGIN) steer -= EDGE_STEER_FORCE * (1 - (w - ant.x) / EDGE_MARGIN);
  if (ant.y < EDGE_MARGIN) steer += EDGE_STEER_FORCE * (1 - ant.y / EDGE_MARGIN);
  if (ant.y > h - EDGE_MARGIN) steer -= EDGE_STEER_FORCE * (1 - (h - ant.y) / EDGE_MARGIN);
  return steer;
}

// ─── Ant creation from tasks ──────────────────────────────────────────────────

function createAnt(task: Task, w: number, h: number): ColonyAnt {
  const behavior = taskToBehavior(task.status);
  return {
    id: task.id,
    x: Math.random() * (w - 40) + 20,
    y: Math.random() * (h - 40) + 20,
    direction: randomAngle(),
    targetAngle: randomAngle(),
    speed: behavior === "idle" ? IDLE_SPEED : WANDERING_SPEED,
    behavior,
    behaviorTimer: behavior === "celebrating" ? CELEBRATE_DURATION : 0,
    pauseTimer: 0,
    scale: 1,
    targetX: null,
    targetY: null,
  };
}

function taskToBehavior(status: TaskStatus): ColonyAnt["behavior"] {
  switch (status) {
    case "todo":
      return "idle";
    case "in_progress":
      return "wandering";
    case "done":
      return "wandering";
    case "archived":
      return "returning";
    default:
      return "idle";
  }
}

// ─── Movement ─────────────────────────────────────────────────────────────────

function moveAnt(ant: ColonyAnt, w: number, h: number): ColonyAnt {
  if (ant.behavior === "idle") {
    if (Math.random() < 0.03) {
      return {
        ...ant,
        targetAngle: ant.direction + (Math.random() - 0.5) * 60,
        behavior: "wandering",
      };
    }
    return ant;
  }

  if (ant.behavior === "wandering") {
    const edgeSteer = edgeSteering(ant, w, h);
    const drift = (Math.random() - 0.5) * HEADING_DRIFT;
    let newTarget = ant.targetAngle + drift + edgeSteer;

    if (Math.random() < 0.02) {
      newTarget = ant.direction + (Math.random() - 0.5) * 80;
    }

    const newDir = lerpAngle(ant.direction, newTarget, 0.1);
    const rad = (newDir * Math.PI) / 180;
    let nx = ant.x + Math.cos(rad) * ant.speed;
    let ny = ant.y + Math.sin(rad) * ant.speed;

    if (nx < 3) { nx = 3; newTarget = 180 - newTarget; }
    if (nx > w - 3) { nx = w - 3; newTarget = 180 - newTarget; }
    if (ny < 3) { ny = 3; newTarget = -newTarget; }
    if (ny > h - 3) { ny = h - 3; newTarget = -newTarget; }

    return { ...ant, x: nx, y: ny, direction: newDir, targetAngle: newTarget, scale: 1 };
  }

  if (ant.behavior === "investigating") {
    if (ant.pauseTimer > 0) {
      const wobble = Math.sin(ant.pauseTimer * 0.8) * 3;
      const newTimer = ant.behaviorTimer - 1;
      const newPause = ant.pauseTimer - 1;

      if (newTimer <= 0) {
        return { ...ant, behavior: "wandering", behaviorTimer: 0, targetAngle: randomAngle(), pauseTimer: 0, scale: 1 };
      }
      return { ...ant, direction: ant.direction + wobble * 0.1, behaviorTimer: newTimer, pauseTimer: newPause, scale: 1 + Math.sin(ant.pauseTimer * 0.5) * 0.05 };
    }

    if (ant.targetX != null && ant.targetY != null) {
      const d = dist(ant.x, ant.y, ant.targetX, ant.targetY);
      if (d < 8) {
        return { ...ant, pauseTimer: INVESTIGATE_PAUSE };
      }

      const angleTo = (Math.atan2(ant.targetY - ant.y, ant.targetX - ant.x) * 180) / Math.PI;
      const newDir = lerpAngle(ant.direction, angleTo, 0.12);
      const rad = (newDir * Math.PI) / 180;
      const spd = ant.speed * INVESTIGATE_SPEED;
      let nx = clamp(ant.x + Math.cos(rad) * spd, 5, w - 5);
      let ny = clamp(ant.y + Math.sin(rad) * spd, 5, h - 5);
      const newTimer = ant.behaviorTimer - 1;

      if (newTimer <= 0) {
        return { ...ant, x: nx, y: ny, direction: newDir, behavior: "wandering", behaviorTimer: 0, targetAngle: randomAngle(), scale: 1, targetX: null, targetY: null };
      }
      return { ...ant, x: nx, y: ny, direction: newDir, behaviorTimer: newTimer, scale: 1.05 };
    }

    return { ...ant, direction: ant.direction + (Math.random() - 0.5) * HEADING_DRIFT * 4, behaviorTimer: ant.behaviorTimer - 1 };
  }

  if (ant.behavior === "celebrating") {
    const newDir = ant.direction + CELEBRATE_SPIN;
    const newTimer = ant.behaviorTimer - 1;
    const progress = 1 - newTimer / CELEBRATE_DURATION;
    const burstSpeed = progress < 0.5 ? 1.5 : 1.5 - (progress - 0.5) * 2;
    const newScale = 1 + Math.sin(ant.behaviorTimer * 0.4) * 0.1;

    const rad = (newDir * Math.PI) / 180;
    let nx = clamp(ant.x + Math.cos(rad) * ant.speed * burstSpeed, 5, w - 5);
    let ny = clamp(ant.y + Math.sin(rad) * ant.speed * burstSpeed, 5, h - 5);

    if (newTimer <= 0) {
      return { ...ant, x: nx, y: ny, direction: newDir, behavior: "wandering", behaviorTimer: 0, targetAngle: randomAngle(), scale: 1 };
    }
    return { ...ant, x: nx, y: ny, direction: newDir, behaviorTimer: newTimer, scale: newScale };
  }

  if (ant.behavior === "returning") {
    const newDir = lerpAngle(ant.direction, ant.targetAngle, 0.08);
    const newTimer = ant.behaviorTimer - 1;

    if (newTimer <= 0) {
      return { ...ant, behavior: "idle", behaviorTimer: 0, targetAngle: randomAngle(), scale: 1 };
    }

    const rad = (newDir * Math.PI) / 180;
    let nx = clamp(ant.x + Math.cos(rad) * ant.speed * 0.6, 5, w - 5);
    let ny = clamp(ant.y + Math.sin(rad) * ant.speed * 0.6, 5, h - 5);

    return { ...ant, x: nx, y: ny, direction: newDir, behaviorTimer: newTimer, scale: ant.scale + (1 - ant.scale) * 0.1 };
  }

  return ant;
}

// ─── Status transitions ───────────────────────────────────────────────────────

function syncAntBehavior(ant: ColonyAnt, status: TaskStatus): ColonyAnt {
  const desired = taskToBehavior(status);
  if (ant.behavior === desired) return ant;

  if (desired === "returning") {
    return { ...ant, behavior: "returning", behaviorTimer: RETURN_DURATION, targetAngle: randomAngle(), scale: 1 };
  }

  if (desired === "wandering" && ant.behavior === "idle") {
    return { ...ant, behavior: "wandering" };
  }

  if (desired === "idle" && ant.behavior === "wandering") {
    return { ...ant, behavior: "idle" };
  }

  return { ...ant, behavior: desired };
}

// ─── Component ────────────────────────────────────────────────────────────────

export function TaskColonyView({ tasks, onEditTask, onStatusChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const antsRef = useRef<ColonyAnt[]>([]);
  const frameRef = useRef<number>(0);
  const [ants, setAnts] = useState<ColonyAnt[]>([]);
  const [selectedAnt, setSelectedAnt] = useState<string | null>(null);
  const [popoverPos, setPopoverPos] = useState<{ x: number; y: number } | null>(null);

  const lastEvent = useAntEventStore((s) => s.lastEvent);
  const lastEventRef = useRef<string | null>(null);

  const getDimensions = useCallback(() => {
    if (!containerRef.current) return { width: 0, height: 0 };
    return { width: containerRef.current.offsetWidth, height: containerRef.current.offsetHeight };
  }, []);

  // Sync ants with tasks
  useEffect(() => {
    const { width: w, height: h } = getDimensions();
    if (!w || !h) return;

    const current = antsRef.current;
    const taskIds = new Set(tasks.map((t) => t.id));

    // Remove ants for deleted tasks
    const filtered = current.filter((a) => taskIds.has(a.id));

    // Add ants for new tasks
    const existingIds = new Set(filtered.map((a) => a.id));
    const newAnts = tasks
      .filter((t) => !existingIds.has(t.id))
      .map((t) => createAnt(t, w, h));

    // Update behaviors for existing ants
    const taskMap = new Map(tasks.map((t) => [t.id, t.status]));
    const synced = filtered.map((a) => {
      const status = taskMap.get(a.id);
      return status ? syncAntBehavior(a, status) : a;
    });

    antsRef.current = [...synced, ...newAnts];
    setAnts([...antsRef.current]);
  }, [tasks, getDimensions]);

  // Handle ant colony events
  useEffect(() => {
    if (!lastEvent || !containerRef.current) return;
    if (lastEventRef.current === String(lastEvent.timestamp)) return;
    lastEventRef.current = String(lastEvent.timestamp);

    const { width: w, height: h } = getDimensions();
    if (!w || !h) return;

    const current = antsRef.current;

    if (lastEvent.type === "task_completed") {
      // Pick a random wandering/walking ant to celebrate
      const candidates = current.filter((a) => a.behavior === "wandering" || a.behavior === "idle");
      if (candidates.length > 0) {
        const pick = candidates[Math.floor(Math.random() * candidates.length)];
        antsRef.current = current.map((a) =>
          a.id === pick.id
            ? { ...a, behavior: "celebrating" as const, behaviorTimer: CELEBRATE_DURATION, scale: 1.15 }
            : a
        );
        setAnts([...antsRef.current]);
      }
    }

    if (lastEvent.type === "task_created") {
      // Make existing ants briefly investigate
      antsRef.current = current.map((a) => {
        if (a.behavior === "idle" || a.behavior === "wandering") {
          return {
            ...a,
            behavior: "investigating" as const,
            behaviorTimer: INVESTIGATE_DURATION,
            pauseTimer: 0,
            targetX: Math.random() * w,
            targetY: Math.random() * h,
            scale: 1.05,
          };
        }
        return a;
      });
      setAnts([...antsRef.current]);
    }
  }, [lastEvent, getDimensions]);

  // Animation loop
  useEffect(() => {
    if (antsRef.current.length === 0) return;

    let lastTime = 0;

    const loop = (timestamp: number) => {
      if (timestamp - lastTime >= FRAME_INTERVAL) {
        const { width: w, height: h } = getDimensions();
        if (w && h) {
          antsRef.current = antsRef.current.map((ant) => moveAnt(ant, w, h));
          setAnts([...antsRef.current]);
        }
        lastTime = timestamp;
      }
      frameRef.current = requestAnimationFrame(loop);
    };

    frameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameRef.current);
  }, [getDimensions]);

  // Handle ant click
  const handleAntClick = useCallback((ant: ColonyAnt, e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedAnt === ant.id) {
      setSelectedAnt(null);
      setPopoverPos(null);
    } else {
      setSelectedAnt(ant.id);
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const containerRect = containerRef.current?.getBoundingClientRect();
      if (containerRect) {
        setPopoverPos({
          x: rect.left - containerRect.left + rect.width / 2,
          y: rect.top - containerRect.top,
        });
      }
    }
  }, [selectedAnt]);

  // Close popover on background click
  const handleBackgroundClick = useCallback(() => {
    setSelectedAnt(null);
    setPopoverPos(null);
  }, []);

  const selectedTask = selectedAnt ? tasks.find((t) => t.id === selectedAnt) ?? null : null;

  return (
    <div
      ref={containerRef}
      className="colony-container relative w-full min-h-[60vh] rounded-2xl overflow-hidden border border-border/50 bg-gradient-to-br from-slate-50 via-white to-amber-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-amber-950/10 cursor-pointer"
      onClick={handleBackgroundClick}
    >
      {/* Ants */}
      <AnimatePresence>
        {ants.map((ant) => {
          const opacity = ant.behavior === "returning" ? 0.25 : ant.behavior === "celebrating" ? 0.9 : 0.65;
          const colorTint =
            ant.behavior === "celebrating"
              ? "drop-shadow-[0_0_4px_rgba(34,197,94,0.5)]"
              : ant.behavior === "investigating"
              ? "drop-shadow-[0_0_3px_rgba(59,130,246,0.4)]"
              : "";

          return (
            <motion.div
              key={ant.id}
              className={`absolute select-none cursor-pointer group ${colorTint}`}
              style={{
                left: ant.x,
                top: ant.y,
                fontSize: "16px",
                transform: `rotate(${ant.direction}deg) scale(${ant.scale})`,
                zIndex: selectedAnt === ant.id ? 20 : 10,
              }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity, scale: ant.scale }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{ duration: 0.3 }}
              onClick={(e) => handleAntClick(ant, e)}
            >
              {ANT_EMOJI}
              {/* Hover label */}
              <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-medium bg-popover text-popover-foreground px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-sm border border-border/50">
                {tasks.find((t) => t.id === ant.id)?.title ?? "Task"}
              </span>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Empty state */}
      {tasks.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-5xl mb-3">{"\u{1F41C}"}</div>
            <p className="text-muted-foreground text-sm">Your colony is waiting for work.</p>
            <p className="text-muted-foreground text-xs mt-1">Create a task to get the ants busy!</p>
          </div>
        </div>
      )}

      {/* Task detail popover */}
      {selectedAnt && selectedTask && popoverPos && (
        <div
          className="absolute z-30"
          style={{
            left: popoverPos.x,
            top: popoverPos.y,
            transform: "translate(-50%, -100%)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="glass-card rounded-2xl p-4 shadow-glass border border-border/50 w-64 mb-2">
            <TaskDetailPopover
              task={selectedTask}
              onEdit={() => {
                onEditTask(selectedTask);
                setSelectedAnt(null);
                setPopoverPos(null);
              }}
              onStatusChange={(status) => {
                onStatusChange(selectedTask.id, status);
                setSelectedAnt(null);
                setPopoverPos(null);
              }}
            />
          </div>
          {/* Arrow */}
          <div className="flex justify-center">
            <div className="w-3 h-3 rotate-45 glass-card border-r border-b border-border/50 -mt-1.5" />
          </div>
        </div>
      )}
    </div>
  );
}
