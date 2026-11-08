"use client";

/** Small presentational pieces shared by the BoilerMafia host and player views. */
import { useEffect, useState } from "react";
import type { Role } from "./types";

export const ROLE_STYLE: Record<Role, { emoji: string; tint: string; blurb: string; team: string }> = {
  werewolf: {
    emoji: "🐺",
    tint: "from-blood/30 to-blood/5 ring-blood/40",
    blurb: "Each night, choose a villager to eliminate with your pack. By day, blend in.",
    team: "Werewolves",
  },
  doctor: {
    emoji: "🩺",
    tint: "from-emerald-400/25 to-emerald-400/5 ring-emerald-400/40",
    blurb: "Each night, protect one player from the werewolves. You may protect yourself.",
    team: "Village",
  },
  seer: {
    emoji: "🔮",
    tint: "from-violet-400/30 to-violet-400/5 ring-violet-400/40",
    blurb: "Each night, look into one player's soul and learn whether they are a werewolf.",
    team: "Village",
  },
  villager: {
    emoji: "🧑‍🌾",
    tint: "from-amber-300/25 to-amber-300/5 ring-amber-300/40",
    blurb: "Find the werewolves and vote them out before they get you.",
    team: "Village",
  },
};

/** Reveals lines of narration one after another. Remount (via key) to restart. */
export function Narration({
  lines,
  interval = 2600,
  className = "",
}: {
  lines: string[];
  interval?: number;
  className?: string;
}) {
  const [shown, setShown] = useState(1);
  useEffect(() => {
    if (shown >= lines.length) return;
    const id = setTimeout(() => setShown((n) => n + 1), interval);
    return () => clearTimeout(id);
  }, [shown, lines.length, interval]);
  return (
    <div className={`space-y-4 ${className}`}>
      {lines.slice(0, shown).map((line, i) => (
        <p
          key={i}
          className={`animate-rise ${i === shown - 1 ? "opacity-100" : "opacity-60"} transition-opacity duration-700`}
        >
          {line}
        </p>
      ))}
    </div>
  );
}

export function PickList({
  options,
  selected,
  onPick,
  disabled,
}: {
  options: { id: string; label: string; detail?: string }[];
  selected: string | null;
  onPick: (id: string) => void;
  disabled?: boolean;
}) {
  return (
    <ul className="grid gap-2">
      {options.map((o) => {
        const active = o.id === selected;
        return (
          <li key={o.id}>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onPick(o.id)}
              className={`flex min-h-14 w-full items-center justify-between rounded-2xl px-5 text-left text-lg font-medium transition active:scale-[0.99] disabled:active:scale-100 ${
                active ? "bg-accent text-white" : "bg-white/8 text-white hover:bg-white/12 disabled:opacity-50"
              }`}
            >
              <span>{o.label}</span>
              {o.detail && <span className={`text-sm ${active ? "text-white/80" : "text-white/50"}`}>{o.detail}</span>}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
