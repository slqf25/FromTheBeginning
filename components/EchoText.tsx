"use client";

import { CSSProperties, PointerEvent, useEffect, useRef, useState } from "react";

type EchoDirection = "left" | "right" | "up" | "down";

interface EchoTextProps {
  text: string;
  echoes?: number;
  lag?: number;
  offset?: number;
  direction?: EchoDirection;
  fade?: number;
  blur?: number;
  tint?: string;
  echoStyle?: "solid" | "outline";
  echoScale?: number;
  mode?: "intro" | "hover" | "both";
  trail?: "pointer" | "fixed";
  clickBurst?: boolean;
  cursorRadius?: number;
  duration?: number;
  ease?: string;
  fontSize?: string;
  fontWeight?: number;
  fontFamily?: string;
  className?: string;
}

type EchoVariables = CSSProperties & {
  "--echo-x": string;
  "--echo-y": string;
};

export default function EchoText({
  text,
  echoes = 12,
  lag = 0.24,
  offset = 36,
  direction = "right",
  fade = 0.72,
  blur = 3,
  tint = "#7dd3fc",
  echoStyle = "solid",
  echoScale = 1,
  mode = "both",
  trail = "pointer",
  clickBurst = true,
  cursorRadius = 320,
  duration = 900,
  ease = "ease-out",
  fontSize = "clamp(3rem, 9vw, 7rem)",
  fontWeight = 800,
  fontFamily,
  className = "",
}: EchoTextProps) {
  const rootRef = useRef<HTMLSpanElement>(null);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [active, setActive] = useState(mode !== "hover");
  const [burst, setBurst] = useState(0);

  useEffect(() => {
    if (mode === "hover") return;
    const timer = setTimeout(() => setActive(false), duration + echoes * lag * 22);
    return () => clearTimeout(timer);
  }, [duration, echoes, lag, mode]);

  useEffect(() => () => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
  }, []);

  const directionVector = {
    left: [-1, 0],
    right: [1, 0],
    up: [0, -1],
    down: [0, 1],
  }[direction];

  function handlePointerMove(event: PointerEvent<HTMLSpanElement>) {
    if (trail !== "pointer" || mode === "intro" || !rootRef.current) return;
    const rect = rootRef.current.getBoundingClientRect();
    const dx = event.clientX - (rect.left + rect.width / 2);
    const dy = event.clientY - (rect.top + rect.height / 2);
    const distance = Math.max(1, Math.hypot(dx, dy));
    const influence = Math.min(distance, cursorRadius) / cursorRadius;
    const pointerX = (dx / distance) * offset * influence * 0.45;
    const pointerY = (dy / distance) * offset * influence * 0.22;
    rootRef.current.style.setProperty("--pointer-x", `${pointerX}px`);
    rootRef.current.style.setProperty("--pointer-y", `${pointerY}px`);
    setActive(true);
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => setActive(false), 260);
  }

  function handlePointerLeave() {
    if (mode === "intro") return;
    setActive(false);
  }

  function handleClick() {
    if (!clickBurst) return;
    setBurst((current) => current + 1);
    setActive(true);
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => setActive(false), duration);
  }

  return (
    <span
      ref={rootRef}
      className={`echo-text ${className}`.trim()}
      data-active={active ? "true" : "false"}
      data-burst={burst}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onClick={handleClick}
      style={{ fontSize, fontWeight, fontFamily }}
    >
      <span className="echo-text-base">{text}</span>
      <span className="echo-text-trail" aria-hidden="true" key={burst}>
        {Array.from({ length: echoes }, (_, index) => {
          const progress = (index + 1) / echoes;
          const x = directionVector[0] * offset * progress;
          const y = directionVector[1] * offset * progress;
          const style: EchoVariables = {
            "--echo-x": `${x}px`,
            "--echo-y": `${y}px`,
            color: tint,
            opacity: Math.max(0.03, (1 - progress) * fade),
            filter: `blur(${blur * progress}px)`,
            transform: `translate3d(calc(var(--echo-x) + var(--pointer-x, 0px)), calc(var(--echo-y) + var(--pointer-y, 0px)), 0) scale(${1 + (echoScale - 1) * progress})`,
            transitionDuration: `${duration}ms`,
            transitionTimingFunction: ease,
            transitionDelay: `${index * lag * 22}ms`,
            WebkitTextStroke: echoStyle === "outline" ? "1px currentColor" : undefined,
            WebkitTextFillColor: echoStyle === "outline" ? "transparent" : undefined,
          };
          return <span className="echo-text-copy" style={style} key={index}>{text}</span>;
        })}
      </span>
    </span>
  );
}
