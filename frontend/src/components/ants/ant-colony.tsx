"use client";

import { useEffect, useRef, useReducer, useCallback } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { AntState, AntBehavior } from "@/types";
import type { AntEvent } from "@/store/ant-events";

interface Props {
  taskCount: number;
  completionRate: number;
  lastEvent: AntEvent | null;
}

const ANT_COUNT = 10;
const ANT_EMOJI = "\u{1F41C}";
const ANT_FRONT_OFFSET = 0;

const TURN_SPEED = 2.5;
const EDGE_MARGIN = 60;
const EDGE_STEER_FORCE = 3.0;
const HEADING_DRIFT = 0.3;

const INVESTIGATE_DURATION = 72;
const INVESTIGATE_SPEED_MULT = 1.8;
const INVESTIGATE_PAUSE = 20;

const CELEBRATE_DURATION_MIN = 48;
const CELEBRATE_DURATION_MAX = 72;
const CELEBRATE_SPIN_SPEED = 8;

const GATHER_DURATION = 72;
const GATHER_RADIUS = 80;

const MESSENGER_SPEED_MULT = 3.0;
const MESSENGER_REACH = 15;

const RETURN_DURATION = 36;
const ANIMATED_DURATION = 72;

const MAX_PARTICLES = 15;

interface Particle {
  id: number;
  x: number;
  y: number;
  symbol: string;
  image?: string;
  life: number;
  maxLife: number;
  vx: number;
  vy: number;
  size?: number;
}

let nextParticleId = 0;

function spawnParticles(
  particles: Particle[],
  x: number,
  y: number,
  symbol: string,
  count: number,
  spread: number,
  life: number,
  image?: string,
  size?: number,
): Particle[] {
  const newParticles: Particle[] = [];
  for (let i = 0; i < count && particles.length + newParticles.length < MAX_PARTICLES; i++) {
    newParticles.push({
      id: nextParticleId++,
      x,
      y,
      symbol,
      image,
      life,
      maxLife: life,
      vx: (Math.random() - 0.5) * spread,
      vy: -Math.random() * spread * 0.6 - 0.5,
      size,
    });
  }
  return [...particles, ...newParticles];
}

function tickParticles(particles: Particle[]): Particle[] {
  return particles
    .map((p) => ({
      ...p,
      x: p.x + p.vx,
      y: p.y + p.vy,
      vy: p.vy - 0.01,
      life: p.life - 1,
    }))
    .filter((p) => p.life > 0);
}

type AntAction =
  | { type: "INIT"; width: number; height: number }
  | { type: "TICK"; width: number; height: number; speedMultiplier: number }
  | { type: "SET_BEHAVIOR"; id: number; behavior: AntBehavior }
  | {
      type: "TRIGGER_EVENT";
      event: AntEvent;
      width: number;
      height: number;
    };

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

function initAnts(width: number, height: number): AntState[] {
  return Array.from({ length: ANT_COUNT }, (_, i) => ({
    id: i,
    x: Math.random() * width,
    y: Math.random() * height,
    behavior: "idle" as AntBehavior,
    direction: randomAngle(),
    speed: 0.4 + Math.random() * 0.4,
    targetAngle: randomAngle(),
    behaviorTimer: 0,
    pauseTimer: 0,
    animatedTimer: 0,
    targetX: null,
    targetY: null,
    scale: 1,
  }));
}

function edgeSteering(ant: AntState, width: number, height: number): number {
  let steer = 0;
  if (ant.x < EDGE_MARGIN) steer += EDGE_STEER_FORCE * (1 - ant.x / EDGE_MARGIN);
  if (ant.x > width - EDGE_MARGIN) steer -= EDGE_STEER_FORCE * (1 - (width - ant.x) / EDGE_MARGIN);
  if (ant.y < EDGE_MARGIN) steer += EDGE_STEER_FORCE * (1 - ant.y / EDGE_MARGIN);
  if (ant.y > height - EDGE_MARGIN) steer -= EDGE_STEER_FORCE * (1 - (height - ant.y) / EDGE_MARGIN);
  return steer;
}

function moveAnt(
  ant: AntState,
  width: number,
  height: number,
  speedMultiplier: number,
): AntState {
  if (ant.behavior === "idle") {
    if (Math.random() < 0.05) {
      const newTarget = ant.direction + (Math.random() - 0.5) * 90;
      return { ...ant, targetAngle: newTarget, direction: lerpAngle(ant.direction, newTarget, 0.1) };
    }
    return ant;
  }

  if (ant.behavior === "animated") {
    const newTimer = ant.animatedTimer - 1;
    if (newTimer <= 0) {
      return {
        ...ant,
        behavior: "wandering",
        animatedTimer: 0,
        targetAngle: randomAngle(),
        scale: 1,
      };
    }
    const pulse = 1 + Math.sin(newTimer * 0.3) * 0.08;
    return { ...ant, animatedTimer: newTimer, scale: pulse };
  }

  if (ant.behavior === "returning") {
    let newDir = lerpAngle(ant.direction, ant.targetAngle, 0.08);
    let newTimer = ant.behaviorTimer - 1;
    let newScale = ant.scale + (1 - ant.scale) * 0.1;

    if (newTimer <= 0) {
      return {
        ...ant,
        behavior: "wandering",
        behaviorTimer: 0,
        targetAngle: randomAngle(),
        scale: 1,
        targetX: null,
        targetY: null,
      };
    }

    const rad = (newDir * Math.PI) / 180;
    let nx = ant.x + Math.cos(rad) * ant.speed * speedMultiplier * 0.6;
    let ny = ant.y + Math.sin(rad) * ant.speed * speedMultiplier * 0.6;
    nx = clamp(nx, 5, width - 5);
    ny = clamp(ny, 5, height - 5);

    return { ...ant, x: nx, y: ny, direction: newDir, behaviorTimer: newTimer, scale: newScale };
  }

  if (ant.behavior === "investigating") {
    if (ant.pauseTimer > 0) {
      const wobble = Math.sin(ant.pauseTimer * 0.8) * 3;
      const newScale = 1 + Math.sin(ant.pauseTimer * 0.5) * 0.05;
      const newTimer = ant.behaviorTimer - 1;
      const newPause = ant.pauseTimer - 1;

      if (newTimer <= 0) {
        return {
          ...ant,
          behavior: "returning",
          behaviorTimer: RETURN_DURATION,
          targetAngle: randomAngle(),
          pauseTimer: 0,
          scale: 1,
        };
      }

      return {
        ...ant,
        direction: ant.direction + wobble * 0.1,
        behaviorTimer: newTimer,
        pauseTimer: newPause,
        scale: newScale,
      };
    }

    if (ant.targetX != null && ant.targetY != null) {
      const d = dist(ant.x, ant.y, ant.targetX, ant.targetY);
      if (d < 8) {
        return { ...ant, pauseTimer: INVESTIGATE_PAUSE };
      }

      const angleTo = (Math.atan2(ant.targetY - ant.y, ant.targetX - ant.x) * 180) / Math.PI;
      const newDir = lerpAngle(ant.direction, angleTo, 0.12);
      const rad = (newDir * Math.PI) / 180;
      const spd = ant.speed * INVESTIGATE_SPEED_MULT * speedMultiplier;
      let nx = ant.x + Math.cos(rad) * spd;
      let ny = ant.y + Math.sin(rad) * spd;
      nx = clamp(nx, 5, width - 5);
      ny = clamp(ny, 5, height - 5);

      const newTimer = ant.behaviorTimer - 1;
      if (newTimer <= 0) {
        return {
          ...ant,
          behavior: "returning",
          behaviorTimer: RETURN_DURATION,
          targetAngle: randomAngle(),
          scale: 1,
          targetX: null,
          targetY: null,
        };
      }

      return { ...ant, x: nx, y: ny, direction: newDir, behaviorTimer: newTimer, scale: 1.05 };
    }

    const newDir = ant.direction + (Math.random() - 0.5) * HEADING_DRIFT * 4;
    return { ...ant, direction: newDir, behaviorTimer: ant.behaviorTimer - 1 };
  }

  if (ant.behavior === "celebrating") {
    const newDir = ant.direction + CELEBRATE_SPIN_SPEED;
    const newTimer = ant.behaviorTimer - 1;
    const progress = 1 - newTimer / CELEBRATE_DURATION_MAX;
    const burstSpeed = progress < 0.5 ? 1.5 : 1.5 - (progress - 0.5) * 2;
    const newScale = 1 + Math.sin(ant.behaviorTimer * 0.4) * 0.1;

    const rad = (newDir * Math.PI) / 180;
    let nx = ant.x + Math.cos(rad) * ant.speed * speedMultiplier * burstSpeed;
    let ny = ant.y + Math.sin(rad) * ant.speed * speedMultiplier * burstSpeed;
    nx = clamp(nx, 5, width - 5);
    ny = clamp(ny, 5, height - 5);

    if (newTimer <= 0) {
      return {
        ...ant,
        x: nx,
        y: ny,
        direction: newDir,
        behavior: "returning",
        behaviorTimer: RETURN_DURATION,
        targetAngle: randomAngle(),
        scale: 1,
      };
    }

    return { ...ant, x: nx, y: ny, direction: newDir, behaviorTimer: newTimer, scale: newScale };
  }

  if (ant.behavior === "gathering") {
    if (ant.targetX != null && ant.targetY != null) {
      const d = dist(ant.x, ant.y, ant.targetX, ant.targetY);
      if (d < GATHER_RADIUS) {
        const newDir = ant.direction + Math.sin(ant.behaviorTimer * 0.15) * 2;
        const newTimer = ant.behaviorTimer - 1;
        if (newTimer <= 0) {
          return {
            ...ant,
            behavior: "returning",
            behaviorTimer: RETURN_DURATION,
            targetAngle: randomAngle(),
            scale: 1,
            targetX: null,
            targetY: null,
          };
        }
        return { ...ant, direction: newDir, behaviorTimer: newTimer, scale: 1 };
      }

      const angleTo = (Math.atan2(ant.targetY - ant.y, ant.targetX - ant.x) * 180) / Math.PI;
      const newDir = lerpAngle(ant.direction, angleTo, 0.1);
      const rad = (newDir * Math.PI) / 180;
      const spd = ant.speed * 1.2 * speedMultiplier;
      let nx = ant.x + Math.cos(rad) * spd;
      let ny = ant.y + Math.sin(rad) * spd;
      nx = clamp(nx, 5, width - 5);
      ny = clamp(ny, 5, height - 5);

      const newTimer = ant.behaviorTimer - 1;
      if (newTimer <= 0) {
        return {
          ...ant,
          behavior: "returning",
          behaviorTimer: RETURN_DURATION,
          targetAngle: randomAngle(),
          scale: 1,
          targetX: null,
          targetY: null,
        };
      }

      return { ...ant, x: nx, y: ny, direction: newDir, behaviorTimer: newTimer };
    }
  }

  if (ant.behavior === "messenger") {
    if (ant.targetX != null && ant.targetY != null) {
      const d = dist(ant.x, ant.y, ant.targetX, ant.targetY);
      if (d < MESSENGER_REACH) {
        const newTimer = ant.behaviorTimer - 1;
        if (newTimer <= 0) {
          return {
            ...ant,
            behavior: "returning",
            behaviorTimer: RETURN_DURATION,
            targetAngle: randomAngle(),
            scale: 1,
            targetX: null,
            targetY: null,
          };
        }
        return { ...ant, behaviorTimer: newTimer, scale: 1.1 };
      }

      const angleTo = (Math.atan2(ant.targetY - ant.y, ant.targetX - ant.x) * 180) / Math.PI;
      const newDir = lerpAngle(ant.direction, angleTo, 0.15);
      const rad = (newDir * Math.PI) / 180;
      const spd = ant.speed * MESSENGER_SPEED_MULT * speedMultiplier;
      let nx = ant.x + Math.cos(rad) * spd;
      let ny = ant.y + Math.sin(rad) * spd;
      nx = clamp(nx, 5, width - 5);
      ny = clamp(ny, 5, height - 5);

      return { ...ant, x: nx, y: ny, direction: newDir, scale: 1.1 };
    }
  }

  // Default wandering/walking behavior
  const edgeSteer = edgeSteering(ant, width, height);
  const drift = (Math.random() - 0.5) * HEADING_DRIFT;
  let newTarget = ant.targetAngle + drift + edgeSteer;

  if (Math.random() < 0.02) {
    newTarget = ant.direction + (Math.random() - 0.5) * 80;
  }

  const newDir = lerpAngle(ant.direction, newTarget, 0.1);
  const rad = (newDir * Math.PI) / 180;
  let nx = ant.x + Math.cos(rad) * ant.speed * speedMultiplier;
  let ny = ant.y + Math.sin(rad) * ant.speed * speedMultiplier;

  // Hard bounce safety net
  if (nx < 3) { nx = 3; newTarget = 180 - newTarget; }
  if (nx > width - 3) { nx = width - 3; newTarget = 180 - newTarget; }
  if (ny < 3) { ny = 3; newTarget = -newTarget; }
  if (ny > height - 3) { ny = height - 3; newTarget = -newTarget; }

  return { ...ant, x: nx, y: ny, direction: newDir, targetAngle: newTarget, scale: 1 };
}

function handleTriggerEvent(
  ants: AntState[],
  event: AntEvent,
  width: number,
  height: number,
): AntState[] {
  const available = ants.filter(
    (a) => a.behavior === "wandering" || a.behavior === "walking",
  );

  if (available.length === 0) return ants;

  // First: ALL wandering/walking ants stop and show animated ant
  const availableIds = new Set(available.map((a) => a.id));
  let result = ants.map((a) => {
    if (availableIds.has(a.id)) {
      return {
        ...a,
        behavior: "animated" as AntBehavior,
        animatedTimer: ANIMATED_DURATION,
        scale: 1.1,
      };
    }
    return a;
  });

  // Then: pick some ants for special behaviors (overrides their animated state)
  const pick = (n: number) => {
    const shuffled = [...available].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(n, shuffled.length));
  };

  if (event.type === "task_created") {
    const investigators = pick(2 + Math.floor(Math.random() * 3));
    const ids = new Set(investigators.map((a) => a.id));

    result = result.map((a) => {
      if (ids.has(a.id)) {
        return {
          ...a,
          behavior: "investigating" as AntBehavior,
          behaviorTimer: INVESTIGATE_DURATION,
          animatedTimer: 0,
          pauseTimer: 0,
          targetX: Math.random() * width,
          targetY: Math.random() * height,
          scale: 1.05,
        };
      }
      return a;
    });

    return result;
  }

  // task_completed
  const celebrants = pick(2);
  const celebrantIds = new Set(celebrants.map((a) => a.id));
  const remaining = available.filter((a) => !celebrantIds.has(a.id));

  const gatherers = remaining.slice(0, 3);
  const gathererIds = new Set(gatherers.map((a) => a.id));
  const remaining2 = remaining.filter((a) => !gathererIds.has(a.id));

  const messenger = remaining2[0] || null;

  const completionX = width * 0.5 + (Math.random() - 0.5) * width * 0.3;
  const completionY = height * 0.5 + (Math.random() - 0.5) * height * 0.3;

  result = result.map((a) => {
    if (celebrantIds.has(a.id)) {
      return {
        ...a,
        behavior: "celebrating" as AntBehavior,
        behaviorTimer:
          CELEBRATE_DURATION_MIN +
          Math.floor(Math.random() * (CELEBRATE_DURATION_MAX - CELEBRATE_DURATION_MIN)),
        animatedTimer: 0,
        direction: a.direction + Math.random() * 180,
        scale: 1.15,
        targetX: null,
        targetY: null,
      };
    }

    if (gathererIds.has(a.id)) {
      return {
        ...a,
        behavior: "gathering" as AntBehavior,
        behaviorTimer: GATHER_DURATION,
        animatedTimer: 0,
        targetX: completionX + (Math.random() - 0.5) * GATHER_RADIUS,
        targetY: completionY + (Math.random() - 0.5) * GATHER_RADIUS,
      };
    }

    if (messenger && a.id === messenger.id) {
      const targetAnt = ants[Math.floor(Math.random() * ants.length)];
      if (targetAnt && targetAnt.id !== a.id) {
        return {
          ...a,
          behavior: "messenger" as AntBehavior,
          behaviorTimer: 30,
          animatedTimer: 0,
          targetX: targetAnt.x,
          targetY: targetAnt.y,
          scale: 1.1,
        };
      }
    }

    return a;
  });

  return result;
}

function antsReducer(
  ants: AntState[],
  action: AntAction,
): AntState[] {
  switch (action.type) {
    case "INIT":
      return initAnts(action.width, action.height);
    case "TICK":
      return ants.map((ant) =>
        moveAnt(ant, action.width, action.height, action.speedMultiplier),
      );
    case "SET_BEHAVIOR":
      return ants.map((ant) =>
        ant.id === action.id ? { ...ant, behavior: action.behavior } : ant,
      );
    case "TRIGGER_EVENT":
      return handleTriggerEvent(ants, action.event, action.width, action.height);
    default:
      return ants;
  }
}

export function AntColony({ taskCount, completionRate, lastEvent }: Props) {
  const prefersReducedMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const particleFrameRef = useRef<number>(0);
  const [, forceRender] = useReducer((s: number) => s + 1, 0);
  const [ants, dispatch] = useReducer(antsReducer, []);

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

  // Handle events
  const lastEventRef = useRef<AntEvent | null>(null);
  useEffect(() => {
    if (!lastEvent || !containerRef.current) return;
    if (lastEventRef.current?.timestamp === lastEvent.timestamp) return;
    lastEventRef.current = lastEvent;

    const { width, height } = getDimensions();
    if (width && height) {
      dispatch({ type: "TRIGGER_EVENT", event: lastEvent, width, height });

      const cx = width * 0.5 + (Math.random() - 0.5) * width * 0.3;
      const cy = height * 0.5 + (Math.random() - 0.5) * height * 0.3;

      if (lastEvent.type === "task_created") {
        particlesRef.current = spawnParticles(
          particlesRef.current,
          cx,
          cy,
          "+",
          3,
          1.5,
          30,
        );
      } else {
        particlesRef.current = spawnParticles(
          particlesRef.current,
          cx,
          cy,
          "\u2728",
          4,
          2,
          24,
        );
        particlesRef.current = spawnParticles(
          particlesRef.current,
          cx,
          cy,
          "\u2022",
          3,
          2.5,
          40,
        );
        particlesRef.current = spawnParticles(
          particlesRef.current,
          cx,
          cy,
          "",
          3,
          3,
          48,
          "/ant-animated.webp",
          28,
        );
      }
    }
  }, [lastEvent, getDimensions]);

  // Animation loop
  useEffect(() => {
    if (prefersReducedMotion || ants.length === 0) return;

    let lastTime = 0;
    const FPS = 24;
    const interval = 1000 / FPS;

    const loop = (timestamp: number) => {
      if (timestamp - lastTime >= interval) {
        const { width, height } = getDimensions();
        dispatch({ type: "TICK", width, height, speedMultiplier });
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
  }, [prefersReducedMotion, ants.length, speedMultiplier, getDimensions]);

  // Particle animation loop
  useEffect(() => {
    if (prefersReducedMotion) return;

    let lastTime = 0;
    const FPS = 24;
    const interval = 1000 / FPS;

    const loop = (timestamp: number) => {
      if (timestamp - lastTime >= interval) {
        if (particlesRef.current.length > 0) {
          particlesRef.current = tickParticles(particlesRef.current);
          forceRender();
        }
        lastTime = timestamp;
      }
      particleFrameRef.current = requestAnimationFrame(loop);
    };

    particleFrameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(particleFrameRef.current);
  }, [prefersReducedMotion]);

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
              transform: `rotate(${ant.direction + ANT_FRONT_OFFSET}deg) scale(${ant.scale})`,
              opacity: ant.behavior === "animated" ? 0.85 : 0.5,
              filter: ant.behavior === "animated" ? "none" : "grayscale(20%)",
            }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: ant.behavior === "animated" ? 0.85 : 0.5, scale: ant.scale }}
            transition={{ duration: 0.5, delay: ant.id * 0.2 }}
          >
            {ant.behavior === "animated" ? (
              <img
                src="/ant-animated.webp"
                alt=""
                style={{ width: 28, height: 28 }}
              />
            ) : (
              ANT_EMOJI
            )}
          </motion.div>
        ))}
      </AnimatePresence>

      {particlesRef.current.map((p) => {
        const opacity = (p.life / p.maxLife) * 0.6;
        if (p.image) {
          const sz = p.size ?? 20;
          return (
            <img
              key={p.id}
              src={p.image}
              alt=""
              className="absolute pointer-events-none select-none"
              style={{
                left: p.x,
                top: p.y,
                width: sz,
                height: sz,
                opacity,
                transform: "translate(-50%, -50%)",
                willChange: "transform, opacity",
              }}
            />
          );
        }
        return (
          <span
            key={p.id}
            className="absolute pointer-events-none select-none"
            style={{
              left: p.x,
              top: p.y,
              fontSize: "10px",
              opacity,
              transform: "translate(-50%, -50%)",
              willChange: "transform, opacity",
            }}
          >
            {p.symbol}
          </span>
        );
      })}
    </div>
  );
}

export function AntCelebration({ onDone }: { onDone: () => void }) {
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const t = setTimeout(onDone, 2200);
    return () => clearTimeout(t);
  }, [onDone]);

  if (prefersReducedMotion) return null;

  const items = [
    { src: "/ant-animated.webp", size: 48 },
    { symbol: "\u2728", size: 32 },
    { src: "/ant-animated.webp", size: 40 },
    { symbol: "\u{1F389}", size: 32 },
    { src: "/ant-animated.webp", size: 44 },
  ];

  return (
    <motion.div
      className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      aria-hidden="true"
    >
      {items.map((item, i) => (
        <motion.div
          key={i}
          className="absolute"
          initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0, 1.3, 0],
            x: (Math.random() - 0.5) * 220,
            y: (Math.random() - 0.5) * 220,
          }}
          transition={{ duration: 1.5, delay: i * 0.15, ease: "easeOut" }}
        >
          {"src" in item ? (
            <img
              src={item.src}
              alt=""
              style={{ width: item.size, height: item.size }}
            />
          ) : (
            <span style={{ fontSize: item.size }}>{item.symbol}</span>
          )}
        </motion.div>
      ))}
    </motion.div>
  );
}
