"use client";

/** A labelled number control with large -/+ buttons. */
export function Stepper({
  label,
  value,
  min,
  max,
  step = 1,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  onChange: (n: number) => void;
}) {
  const set = (n: number) => onChange(Math.min(max, Math.max(min, n)));
  const btn =
    "grid size-10 place-items-center rounded-full bg-black/5 text-xl font-medium text-ink transition hover:bg-black/10 active:scale-95 disabled:opacity-30";
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <span className="text-ink text-base">{label}</span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          className={btn}
          onClick={() => set(value - step)}
          disabled={value <= min}
          aria-label={`Decrease ${label}`}
        >
          −
        </button>
        <span className="w-16 text-center text-lg font-semibold tabular-nums">
          {value}
          {suffix && <span className="text-muted ml-0.5 text-sm font-normal">{suffix}</span>}
        </span>
        <button
          type="button"
          className={btn}
          onClick={() => set(value + step)}
          disabled={value >= max}
          aria-label={`Increase ${label}`}
        >
          +
        </button>
      </div>
    </div>
  );
}
