"use client";

/**
 * Which style is showing, and why.
 *
 *   personal  - what this device picked (localStorage). Used everywhere outside rooms.
 *   room      - the style the host picked for the room (rooms.theme). The host's TV
 *               always shows it; phones show it unless they chose to keep their own.
 *   roomMode  - "host" (default) or "own" for phones.
 *
 * A tiny external store instead of React context: changing style only touches
 * <html data-style>, so nothing re-renders except the few components that ask.
 */
import { useSyncExternalStore } from "react";
import { DEFAULT_STYLE, fontHref, isStyleId, KEYS, STYLES } from "./registry";

export interface RoomStyle {
  code: string;
  style: string | null;
  isHost: boolean;
  /** True once the game has started. */
  playing: boolean;
}

export interface ThemeSnapshot {
  style: string;
  personal: string;
  room: RoomStyle | null;
  roomMode: "host" | "own";
  lite: boolean;
  pickerOpen: boolean;
}

const SERVER: ThemeSnapshot = {
  style: DEFAULT_STYLE,
  personal: DEFAULT_STYLE,
  room: null,
  roomMode: "host",
  lite: false,
  pickerOpen: false,
};

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function write(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {}
}

let snap: ThemeSnapshot = SERVER;
let started = false;
const listeners = new Set<() => void>();

function init() {
  if (started || typeof document === "undefined") return;
  started = true;
  const fromHtml = document.documentElement.dataset.style;
  const personal = isStyleId(fromHtml) ? fromHtml : DEFAULT_STYLE;
  snap = {
    style: personal,
    personal,
    room: null,
    roomMode: read(KEYS.roomMode) === "own" ? "own" : "host",
    lite: document.documentElement.classList.contains("lite"),
    pickerOpen: false,
  };
}

function effective(s: Omit<ThemeSnapshot, "style">): string {
  const r = s.room;
  if (r && isStyleId(r.style) && (r.isHost || s.roomMode === "host")) return r.style;
  return s.personal;
}

function ensureFonts(style: string) {
  const def = STYLES.find((s) => s.id === style);
  const href = def && fontHref(def.fonts);
  if (!href || document.head.querySelector(`link[data-lp-font="${style}"]`)) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  link.dataset.lpFont = style;
  document.head.appendChild(link);
}

function update(patch: Partial<Omit<ThemeSnapshot, "style">>) {
  init();
  const next = { ...snap, ...patch };
  next.style = effective(next);
  const changed = next.style !== snap.style;
  snap = next;
  const html = document.documentElement;
  if (changed || html.dataset.style !== snap.style) {
    ensureFonts(snap.style);
    html.dataset.style = snap.style;
  }
  html.classList.toggle("lite", snap.lite);
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  init();
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useTheme(): ThemeSnapshot {
  return useSyncExternalStore(
    subscribe,
    () => (init(), snap),
    () => SERVER,
  );
}

/** Run a style change inside a View Transition (circle reveal from the tap point) where supported. */
export function withTransition(change: () => void, from?: { x: number; y: number }) {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches || snap.lite;
  const doc = document as Document & { startViewTransition?: (cb: () => void) => { ready: Promise<void> } };
  if (!doc.startViewTransition || reduce) return change();
  const x = from?.x ?? innerWidth / 2;
  const y = from?.y ?? innerHeight / 2;
  const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
  const t = doc.startViewTransition(change);
  t.ready
    .then(() =>
      document.documentElement.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
        { duration: 520, easing: "cubic-bezier(.22,1,.36,1)", pseudoElement: "::view-transition-new(root)" },
      ),
    )
    .catch(() => {});
}

export const theme = {
  setPersonal(id: string) {
    if (!isStyleId(id)) return;
    write(KEYS.style, id);
    update({ personal: id });
  },
  setRoom(room: RoomStyle | null) {
    update({ room });
  },
  setRoomMode(mode: "host" | "own") {
    write(KEYS.roomMode, mode === "own" ? "own" : null);
    update({ roomMode: mode });
  },
  setLite(lite: boolean) {
    write(KEYS.lite, lite ? "1" : "0");
    update({ lite });
  },
  openPicker() {
    update({ pickerOpen: true });
  },
  closePicker() {
    update({ pickerOpen: false });
  },
};
