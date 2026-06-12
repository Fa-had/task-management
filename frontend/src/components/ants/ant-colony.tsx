"use client";

import { useEffect, useRef, useReducer, useCallback } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { AntState, AntBehavior } from "@/types";

interface Props {
  taskCount: number;
  completionRate: number; // 0–1
}

const ANT_COUNT = 3;
const ANT_EMOJI = "🐜";

// Reducer

type AntAction =
  | { type: "TICK"; width: number; height: number }
  | { type: "SET_BEHAVIOR"; id: number; behavior: AntBehavior }
  | { type: "INIT"; width: number; height: number };

function initAnts(width: number, height: number): AntState[] {
  return Array.from({ length: ANT_COUNT }, (_, i) => ({
    id: i,
    x: Math.random() * width,
    y: Math.random() * height,
    behavior: "idle" as AntBehavior,
    direction: Math.random() * 360,
    speed: 0.4 + Math.random() * 0.4,
  }));
}

function moveAnt(ant: AntState, width: number, height: number): AntState {
  if (ant.behavior === "idle") {
    // Occasionally change direction
    const newDirection =
      Math.random() < 0.05
        ? ant.direction + (Math.random() - 0.5) * 90
        : ant.direction;

    return { ...ant, direction: newDirection };
  }

  const rad = (ant.direction * Math.PI) / 180;
  let nx = ant.x + Math.cos(rad) * ant.speed;
  let ny = ant.y + Math.sin(rad) * ant.speed;
  let nd = ant.direction;

  // Bounce off edges
  if (nx < 10 || nx > width - 10) {
    nd = 180 - nd;
    nx = Math.max(10, Math.min(width - 10, nx));
  }
  if (ny < 10 || ny > height - 10) {
    nd = -nd;
    ny = Math.max(10, Math.min(height - 10, ny));
  }

  // Randomly adjust course
  if (Math.random() < 0.03) nd += (Math.random() - 0.5) * 30;

  return { ...ant, x: nx, y: ny, direction: nd };
}

function antsReducer(ants: AntState[], action: AntAction): AntState[] {
  switch (action.type) {
    case "INIT":
      return initAnts(action.width, action.height);
    case "TICK":
      return ants.map((ant) => moveAnt(ant, action.width, action.height));
    case "SET_BEHAVIOR":
      return ants.map((ant) =>
        ant.id === action.id ? { ...ant, behavior: action.behavior } : ant,
      );
    default:
      return ants;
  }
}

// Component

export function AntColony({ taskCount, completionRate }: Props) {
  const prefersReducedMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number>(0);
  const [ants, dispatch] = useReducer(antsReducer, []);

  // Ant speed scales with completion rate (more done = more energetic)
  const speedMultiplier = 0.5 + completionRate * 1.5;

  const getDimensions = useCallback(() => {
    if (!containerRef.current) return { width: 0, height: 0 };
    return {
      width: containerRef.current.offsetWidth,
      height: containerRef.current.offsetHeight,
    };
  }, []);

  // Init
  useEffect(() => {
    if (prefersReducedMotion) return;
    const { width, height } = getDimensions();
    if (width && height) {
      dispatch({ type: "INIT", width, height });
    }
  }, [prefersReducedMotion, getDimensions]);

  // Animation loop
  useEffect(() => {
    if (prefersReducedMotion || ants.length === 0) return;

    let lastTime = 0;
    const FPS = 24; // performance-friendly
    const interval = 1000 / FPS;

    const loop = (timestamp: number) => {
      if (timestamp - lastTime >= interval) {
        const { width, height } = getDimensions();
        dispatch({ type: "TICK", width, height });
        lastTime = timestamp;
      }
      frameRef.current = requestAnimationFrame(loop);
    };

    // Set ants to walking after a short delay
    const behaviorTimer = setTimeout(() => {
      ants.forEach((ant) =>
        dispatch({
          type: "SET_BEHAVIOR",
          id: ant.id,
          behavior: taskCount === 0 ? "wandering" : "walking",
        }),
      );
    }, 800);

    frameRef.current = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(frameRef.current);
      clearTimeout(behaviorTimer);
    };
  }, [prefersReducedMotion, ants.length, taskCount, getDimensions]);

  if (prefersReducedMotion) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
      aria-hidden="true"
    >
      <AnimatePresence>
        {ants.map((ant) => (
          <motion.div
            key={ant.id}
            className="absolute select-none"
            style={{
              left: ant.x,
              top: ant.y,
              fontSize: "14px",
              transform: `rotate(${ant.direction}deg) scaleX(${ant.direction > 90 && ant.direction < 270 ? -1 : 1})`,
              opacity: 0.5,
              filter: "grayscale(20%)",
              willChange: "transform",
            }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 0.5, scale: 1 }}
            transition={{ duration: 0.5, delay: ant.id * 0.2 }}
          >
            {ANT_EMOJI}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// Celebration overlay (used after task completion)

export function AntCelebration({ onDone }: { onDone: () => void }) {
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const t = setTimeout(onDone, 1800);
    return () => clearTimeout(t);
  }, [onDone]);

  if (prefersReducedMotion) return null;

  return (
    <motion.div
      className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      aria-hidden="true"
    >
      {["🐜", "✨", "🐜", "🎉", "🐜"].map((emoji, i) => (
        <motion.span
          key={i}
          className="absolute text-2xl"
          initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0, 1.4, 0],
            x: (Math.random() - 0.5) * 200,
            y: (Math.random() - 0.5) * 200,
          }}
          transition={{ duration: 1.2, delay: i * 0.1 }}
        >
          {emoji}
        </motion.span>
      ))}
    </motion.div>
  );
}
