"use client";

import { useEffect, useState } from "react";

/** Seconds remaining until `deadline` (epoch ms), using a skew-corrected clock. */
export function useSecondsLeft(deadline: number | null, now: () => number): number | null {
  const [left, setLeft] = useState<number | null>(null);
  useEffect(() => {
    if (deadline === null) return;
    const update = () => setLeft(Math.max(0, Math.ceil((deadline - now()) / 1000)));
    update();
    const id = setInterval(update, 250);
    return () => clearInterval(id);
  }, [deadline, now]);
  return deadline === null ? null : left;
}

export function Countdown({
  deadline,
  now,
  className = "",
}: {
  deadline: number | null;
  now: () => number;
  className?: string;
}) {
  const left = useSecondsLeft(deadline, now);
  if (left === null) return null;
  const m = Math.floor(left / 60);
  const s = left % 60;
  return (
    <span className={`tabular-nums ${left <= 5 ? "text-blood" : ""} ${className}`}>
      {m}:{s.toString().padStart(2, "0")}
    </span>
  );
}
