"use client";

/**
 * Themed building blocks. Every screen in the platform and in games should be
 * made from these (or the same CSS classes), so all 18 styles reach it.
 * See src/themes/themes.css for what each class looks like per style.
 */
import { useEffect, useId, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import { ASCII_ART } from "@/themes/ascii";
import { theme, useTheme } from "@/themes/store";
import { Rain } from "./Rain";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

// ---------------------------------------------------------------------------
// Screen: the page root. kind = tv (host screen, fits 1280x720), phone, or page.
// ---------------------------------------------------------------------------

const PETALS = Array.from({ length: 8 }, (_, i) => ({
  x: `${6 + i * 12}%`,
  d: `${9 + (i % 4) * 2.5}s`,
  dl: `${-i * 1.7}s`,
}));

export function Screen({
  kind,
  className,
  kanji = "遊",
  pow = false,
  rain = false,
  children,
}: {
  kind: "tv" | "phone" | "page";
  /** Extra screen classes, e.g. "is-night" (dark palette) or a layout name like "home", "lobby-scr", "stage", "win". */
  className?: string;
  /** A faint character for the Sakura style. */
  kanji?: string;
  /** Comic POW burst in the corner. */
  pow?: boolean;
  /** ASCII character rain (TV night screen only). */
  rain?: boolean;
  children: ReactNode;
}) {
  return (
    <main className={cx("scr", kind, className)}>
      <div className="bg" aria-hidden="true">
        <i className="deco blob b1" />
        <i className="deco blob b2" />
        <i className="deco blob b3" />
        <i className="deco stripes" />
        <i className="deco sun" />
        <span className="deco floor">
          <i />
        </span>
        <i className="deco cloud" />
        <i className="deco cloud c2" />
        <i className="deco ground" />
        <i className="deco blinds" />
        <i className="deco grainl" />
        <i className="deco spot s1" />
        <i className="deco spot s2" />
        <i className="deco dim" />
        <i className="deco kanji">{kanji}</i>
        <span className="deco petals">
          {PETALS.map((p, i) => (
            <i key={i} style={{ "--x": p.x, "--d": p.d, "--dl": p.dl } as React.CSSProperties} />
          ))}
        </span>
        <i className="deco taskbar" />
        <i className="deco ticker" />
        {rain && <Rain />}
      </div>
      <div className="deco masthead" aria-hidden="true">
        The Daily Village
      </div>
      {pow && (
        <svg className="deco pow" aria-hidden="true">
          <use href="#pow" />
        </svg>
      )}
      <div className="col">{children}</div>
    </main>
  );
}

// ---------------------------------------------------------------------------
// Art: Fluent Emoji image, a pixel sprite (Pixel, Desktop 98) or ASCII (Terminal).
// Lazy images inside display:none are never fetched, so only one variant loads.
// ---------------------------------------------------------------------------

export type ArtName =
  "wolf" | "moon" | "skull" | "seer" | "doctor" | "farmer" | "ghost" | "flag" | "trophy" | "sun" | "crescent" | "house";

export function Art({ name, className }: { name: ArtName; className?: string }) {
  const { style } = useTheme();
  return (
    <div className={cx("art", className)} aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element -- plain lazy <img> on purpose: the style shows one variant via CSS, and lazy images inside display:none never download. next/image would add a wrapper and loader for 5KB sprites. */}
      <img src={`/art/${name}.webp`} alt="" width={192} height={192} loading="lazy" decoding="async" />
      {/* eslint-disable-next-line @next/next/no-img-element -- see above */}
      <img
        className="pix"
        src={`/art/pixel/${name}.png`}
        alt=""
        width={24}
        height={24}
        loading="lazy"
        decoding="async"
      />
      {style === "ascii" && <pre className="ascii">{ASCII_ART[name] ?? ASCII_ART.moon}</pre>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Basics
// ---------------------------------------------------------------------------

export function Button({
  variant = "primary",
  wide,
  size,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost"; wide?: boolean; size?: "sm" }) {
  return <button className={cx("btn", variant === "ghost" && "ghost", wide && "wide", size, className)} {...props} />;
}

export function Panel({ label, className, children }: { label?: string; className?: string; children: ReactNode }) {
  return (
    <div className={cx("panel", className)} data-label={label} data-title={label}>
      {children}
    </div>
  );
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx("eyebrow", className)}>{children}</div>;
}

export function Toast({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="toast">
      {children}
    </p>
  );
}

export function Spinner() {
  return <span className="spinner" aria-label="Loading" />;
}

export function CenterMessage({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="center-msg">
      <div>
        <h1 className="disp" style={{ fontSize: "1.8em" }}>
          {title}
        </h1>
        {children}
      </div>
    </div>
  );
}

/** Big centred moment on a phone: art, a title, a line of text. */
export function Notice({ art, title, children }: { art?: ArtName; title: string; children?: ReactNode }) {
  return (
    <div className="notice">
      {art && <Art name={art} />}
      <h2 className="disp">{title}</h2>
      {children && <p>{children}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Timers: server-clock countdowns
// ---------------------------------------------------------------------------

export function useSecondsLeft(deadline: number | null, now: () => number): number | null {
  const [left, setLeft] = useState<number | null>(null);
  useEffect(() => {
    if (deadline === null) return;
    const tick = () => setLeft(Math.max(0, Math.ceil((deadline - now()) / 1000)));
    const first = setTimeout(tick, 0);
    const id = setInterval(tick, 250);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [deadline, now]);
  return deadline === null ? null : left;
}

export function Timer({
  deadline,
  now,
  className = "timer",
}: {
  deadline: number | null;
  now: () => number;
  className?: string;
}) {
  const left = useSecondsLeft(deadline, now);
  if (deadline === null || left === null) return null;
  return (
    <span className={className}>
      {Math.floor(left / 60)}:{String(left % 60).padStart(2, "0")}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Pick lists (votes, targets) with optional live share bars
// ---------------------------------------------------------------------------

export interface PickOption {
  id: string;
  label: string;
  /** Right-hand text, e.g. "2 votes". */
  detail?: string;
  /** 0..1, draws a bar behind the option. */
  share?: number;
}

export function PickList({
  options,
  selected,
  onPick,
  disabled,
}: {
  options: PickOption[];
  selected: string | null;
  onPick?: (id: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="picks">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          className={cx("pick", o.id === selected && "on")}
          style={{ "--p": (o.share ?? 0).toFixed(3) } as React.CSSProperties}
          onClick={onPick ? () => onPick(o.id) : undefined}
          disabled={disabled || !onPick}
          aria-pressed={o.id === selected}
        >
          <i className="bar" />
          <span>{o.label}</span>
          {o.detail && <span className="n">{o.detail}</span>}
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Narration: reveals lines one at a time. Remount (key) to restart.
// ---------------------------------------------------------------------------

export function Narration({ lines, interval = 2400, keep = 3 }: { lines: string[]; interval?: number; keep?: number }) {
  const [shown, setShown] = useState(1);
  useEffect(() => {
    if (shown >= lines.length) return;
    const id = setTimeout(() => setShown((n) => n + 1), interval);
    return () => clearTimeout(id);
  }, [shown, lines.length, interval]);
  const visible = lines.slice(0, shown).slice(-keep);
  return (
    <div className="narr" aria-live="polite">
      {visible.map((line, i) => (
        <p key={`${shown - visible.length + i}`} className={i === visible.length - 1 ? "new" : "old"}>
          {line}
        </p>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inputs
// ---------------------------------------------------------------------------

/** Four letter boxes over one real input, so phones get a normal keyboard and paste works. */
export function CodeInput({
  value,
  onChange,
  label = "Room code",
}: {
  value: string;
  onChange: (v: string) => void;
  label?: string;
}) {
  const id = useId();
  return (
    <label className="code-boxes" htmlFor={id}>
      {[0, 1, 2, 3].map((i) => (
        <span key={i} className={i === Math.min(value.length, 3) ? "cur" : undefined}>
          {value[i] ?? ""}
        </span>
      ))}
      <input
        id={id}
        aria-label={label}
        value={value}
        onChange={(e) =>
          onChange(
            e.target.value
              .toUpperCase()
              .replace(/[^A-Z]/g, "")
              .slice(0, 4),
          )
        }
        autoCapitalize="characters"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        inputMode="text"
        enterKeyHint="go"
      />
    </label>
  );
}

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
  return (
    <div className="stepper">
      <span>{label}</span>
      <div className="ctl">
        <button
          type="button"
          className="btn ghost"
          onClick={() => set(value - step)}
          disabled={value <= min}
          aria-label={`Decrease ${label}`}
        >
          −
        </button>
        <span className="val">
          {value}
          {suffix}
        </span>
        <button
          type="button"
          className="btn ghost"
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

// ---------------------------------------------------------------------------
// Players
// ---------------------------------------------------------------------------

const AVATAR = [
  "#ff6b6b",
  "#4dabf7",
  "#51cf66",
  "#b197fc",
  "#ffa94d",
  "#f783ac",
  "#3bc9db",
  "#ffd43b",
  "#94d82d",
  "#e599f7",
];

export function avatarColor(index: number) {
  return AVATAR[index % AVATAR.length];
}

export function PlayerTile({
  name,
  index,
  pop,
  onRemove,
}: {
  name: string;
  index: number;
  pop?: boolean;
  onRemove?: () => void;
}) {
  return (
    <div className={cx("tile", pop && "pop")} style={{ "--c": avatarColor(index) } as React.CSSProperties}>
      <span className="av">{name.charAt(0).toUpperCase()}</span>
      <span>{name}</span>
      {onRemove && (
        <button type="button" className="x" onClick={onRemove} aria-label={`Remove ${name}`}>
          ✕
        </button>
      )}
    </div>
  );
}

/** Animates only tiles that are new since the last render. */
export function usePopIds(ids: string[]): Set<string> {
  const seen = useRef<Set<string> | null>(null);
  const [fresh, setFresh] = useState<Set<string>>(new Set());
  useEffect(() => {
    if (seen.current === null) {
      seen.current = new Set(ids);
      return;
    }
    const added = ids.filter((id) => !seen.current!.has(id));
    seen.current = new Set(ids);
    if (added.length) {
      const t = setTimeout(() => setFresh(new Set(added)), 0);
      return () => clearTimeout(t);
    }
  }, [ids]);
  return fresh;
}

// ---------------------------------------------------------------------------
// Style button: opens the global style picker
// ---------------------------------------------------------------------------

export function StyleButton({ className }: { className?: string }) {
  return (
    <button type="button" className={cx("btn ghost sm", className)} onClick={() => theme.openPicker()}>
      Style
    </button>
  );
}
