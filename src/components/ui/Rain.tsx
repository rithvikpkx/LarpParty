"use client";

/** ASCII Terminal character rain. Runs only when that style is active, at 15 fps, and pauses off-screen or in a background tab. */
import { useEffect, useRef } from "react";
import { useTheme } from "@/themes/store";

const GLYPHS = "アイウエオカキクケコ01ZXV<>/\\|#$%*+=".split("");

export function Rain() {
  const ref = useRef<HTMLCanvasElement>(null);
  const { style, lite } = useTheme();
  const active = style === "ascii" && !lite;

  useEffect(() => {
    const cv = ref.current;
    if (!active || !cv || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    let cols: number[] = [];
    let w = 0;
    let h = 0;
    let fs = 14;
    let timer: ReturnType<typeof setInterval> | null = null;
    let visible = true;
    const size = () => {
      const r = cv.getBoundingClientRect();
      const dpr = Math.min(devicePixelRatio || 1, 1.5);
      w = cv.width = Math.max(1, r.width * dpr);
      h = cv.height = Math.max(1, r.height * dpr);
      fs = Math.max(10, Math.round(w / 64));
      cols = Array.from({ length: Math.ceil(w / fs) }, () => Math.random() * -40);
      ctx.font = `${fs}px "JetBrains Mono", monospace`;
    };
    const frame = () => {
      ctx.fillStyle = "rgba(5,5,5,.22)";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#33ff00";
      for (let i = 0; i < cols.length; i++) {
        const y = cols[i] * fs;
        if (y > 0) ctx.fillText(GLYPHS[(Math.random() * GLYPHS.length) | 0], i * fs, y);
        cols[i] = y > h && Math.random() > 0.96 ? 0 : cols[i] + 1;
      }
    };
    const sync = () => {
      const on = visible && !document.hidden;
      if (on && !timer) timer = setInterval(frame, 1000 / 15);
      if (!on && timer) {
        clearInterval(timer);
        timer = null;
      }
    };
    size();
    sync();
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      sync();
    });
    io.observe(cv);
    document.addEventListener("visibilitychange", sync);
    window.addEventListener("resize", size);
    return () => {
      if (timer) clearInterval(timer);
      io.disconnect();
      document.removeEventListener("visibilitychange", sync);
      window.removeEventListener("resize", size);
    };
  }, [active]);

  return <canvas ref={ref} className="deco rain" />;
}
