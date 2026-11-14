"use client";

import { useEffect, useRef } from "react";

type Star = {
  x: number;
  y: number;
  depth: number;
  radius: number;
  alpha: number;
  phase: number;
  warmth: number;
  twinkleSpeed: number;
  pulseDepth: number;
  flare: number;
};

function seededRandom(seed: number) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function createStars(count: number): Star[] {
  const random = seededRandom(1948);
  return Array.from({ length: count }, () => ({
    x: random(),
    y: random(),
    depth: 0.18 + Math.pow(random(), 1.35) * 0.82,
    radius: 0.45 + Math.pow(random(), 2) * 1.65,
    alpha: 0.35 + random() * 0.58,
    phase: random() * Math.PI * 2,
    warmth: random(),
    twinkleSpeed: 0.00045 + random() * 0.00115,
    pulseDepth: 0.18 + random() * 0.48,
    flare: Math.pow(random(), 2.2),
  }));
}

function wrap(value: number, size: number) {
  return ((value % size) + size) % size;
}

export function ScrollStarfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const scrollContainer = document.querySelector<HTMLElement>(".checkin-scene");
    const currentScroll = () => window.scrollY + (scrollContainer?.scrollTop ?? 0);
    let width = 0;
    let height = 0;
    let stars: Star[] = [];
    let targetScroll = currentScroll();
    let renderedScroll = targetScroll;
    let animationFrame = 0;
    let resizeFrame = 0;

    const resize = () => {
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      stars = createStars(width < 700 ? 96 : 158);
    };

    const draw = (time: number) => {
      if (!reducedMotion.matches) {
        renderedScroll += (targetScroll - renderedScroll) * 0.075;
      } else {
        renderedScroll = targetScroll;
      }

      context.clearRect(0, 0, width, height);
      const verticalCycle = height * 1.42;

      for (const star of stars) {
        const scrollSpeed = 0.1 + star.depth * 0.58;
        const y = wrap(star.y * verticalCycle - renderedScroll * scrollSpeed, verticalCycle) - height * 0.2;
        const sidewaysDrift = renderedScroll * (star.depth - 0.42) * 0.018;
        const breathingDrift = reducedMotion.matches ? 0 : Math.sin(time * 0.00012 + star.phase) * 9 * star.depth;
        const x = wrap(star.x * width + sidewaysDrift + breathingDrift, width);
        const pulse = reducedMotion.matches ? 0.76 : (Math.sin(time * star.twinkleSpeed + star.phase) + 1) / 2;
        const twinkle = 1 - star.pulseDepth + pulse * star.pulseDepth;
        const opacity = Math.max(0.08, star.alpha * twinkle);
        const radius = star.radius * (0.62 + star.depth * 0.72) * (0.82 + pulse * 0.28);
        const rayLength = radius * (1.6 + star.flare * 3.7) * (0.78 + pulse * 0.42);
        const rayWidth = Math.max(0.28, radius * 0.34);
        const color = star.warmth > 0.52 ? "255,225,166" : "218,232,255";

        if (star.depth > 0.78) {
          context.shadowBlur = 7 * star.depth;
          context.shadowColor = star.warmth > 0.52 ? "rgba(255,205,116,.64)" : "rgba(174,205,255,.55)";
        } else {
          context.shadowBlur = 0;
        }

        context.beginPath();
        context.moveTo(x, y - rayLength);
        context.quadraticCurveTo(x + rayWidth, y - rayWidth, x + rayLength * 0.48, y);
        context.quadraticCurveTo(x + rayWidth, y + rayWidth, x, y + rayLength);
        context.quadraticCurveTo(x - rayWidth, y + rayWidth, x - rayLength * 0.48, y);
        context.quadraticCurveTo(x - rayWidth, y - rayWidth, x, y - rayLength);
        context.closePath();
        context.fillStyle = `rgba(${color},${opacity})`;
        context.fill();

        if (star.flare > 0.62) {
          context.beginPath();
          context.moveTo(x - rayLength * 1.28, y);
          context.lineTo(x + rayLength * 1.28, y);
          context.moveTo(x, y - rayLength * 1.72);
          context.lineTo(x, y + rayLength * 1.72);
          context.strokeStyle = `rgba(${color},${opacity * 0.42})`;
          context.lineWidth = Math.max(0.35, radius * 0.22);
          context.stroke();
        }
      }
      context.shadowBlur = 0;

      if (!reducedMotion.matches) animationFrame = window.requestAnimationFrame(draw);
    };

    const requestResize = () => {
      window.cancelAnimationFrame(resizeFrame);
      resizeFrame = window.requestAnimationFrame(() => {
        resize();
        if (reducedMotion.matches) draw(performance.now());
      });
    };
    const handleScroll = () => {
      targetScroll = currentScroll();
      if (reducedMotion.matches) draw(performance.now());
    };
    const handleMotionChange = () => {
      window.cancelAnimationFrame(animationFrame);
      draw(performance.now());
    };

    resize();
    draw(performance.now());
    window.addEventListener("resize", requestResize, { passive: true });
    window.addEventListener("scroll", handleScroll, { passive: true });
    scrollContainer?.addEventListener("scroll", handleScroll, { passive: true });
    reducedMotion.addEventListener("change", handleMotionChange);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.cancelAnimationFrame(resizeFrame);
      window.removeEventListener("resize", requestResize);
      window.removeEventListener("scroll", handleScroll);
      scrollContainer?.removeEventListener("scroll", handleScroll);
      reducedMotion.removeEventListener("change", handleMotionChange);
    };
  }, []);

  return <canvas ref={canvasRef} className="scroll-starfield" aria-hidden="true" />;
}
