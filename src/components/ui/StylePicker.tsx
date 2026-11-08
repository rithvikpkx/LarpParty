"use client";

/**
 * The style picker: a floating button plus a sheet with all 18 styles.
 *  - Outside a room: changes this device.
 *  - Host in a room: changes the room, so every phone that follows the host switches too.
 *  - Phone in a room: keeps its own style until it taps "Match the host".
 */
import { useEffect, useState } from "react";
import { setRoomTheme } from "@/platform/actions";
import { fontHref, STYLES } from "@/themes/registry";
import { theme, useTheme, withTransition } from "@/themes/store";

/** Each swatch label is drawn in its own style's font, fetched as a tiny subset containing only the label's letters. */
const PREVIEW_FONTS = fontHref(
  [
    "Bangers",
    "Archivo+Black",
    "Luckiest+Guy",
    "Fredoka:wght@600",
    "VT323",
    "Audiowide",
    "Press+Start+2P",
    "Caveat:wght@700",
    "Shippori+Mincho:wght@600",
    "Limelight",
    "Cinzel+Decorative:wght@700",
    "UnifrakturMaguntia",
    "Bungee",
    "Cinzel:wght@700",
    "Share+Tech+Mono",
  ],
  Array.from(new Set(STYLES.map((s) => s.name).join(""))).join(""),
);

export function StylePicker() {
  const t = useTheme();
  const [error, setError] = useState<string | null>(null);
  const room = t.room;
  const isPlayerInRoom = !!room && !room.isHost;

  useEffect(() => {
    if (!t.pickerOpen || !PREVIEW_FONTS || document.head.querySelector("link[data-lp-preview]")) return;
    const l = document.createElement("link");
    l.rel = "stylesheet";
    l.href = PREVIEW_FONTS;
    l.dataset.lpPreview = "1";
    document.head.appendChild(l);
  }, [t.pickerOpen]);

  useEffect(() => {
    if (!t.pickerOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && theme.closePicker();
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [t.pickerOpen]);

  const pick = (id: string, e: React.MouseEvent) => {
    setError(null);
    const from = { x: e.clientX, y: e.clientY };
    if (room?.isHost) {
      withTransition(() => {
        theme.setPersonal(id);
        theme.setRoom({ ...room, style: id });
      }, from);
      void setRoomTheme(room.code, id).then((r) => !r.ok && setError(r.error));
    } else {
      withTransition(() => {
        theme.setPersonal(id);
        if (isPlayerInRoom) theme.setRoomMode("own");
      }, from);
    }
  };

  return (
    <>
      {!t.pickerOpen && (
        <button type="button" className="style-fab" onClick={() => theme.openPicker()} aria-haspopup="dialog">
          <i aria-hidden="true" />
          Style
        </button>
      )}
      {t.pickerOpen && (
        <>
          <div className="sheet-backdrop" onClick={() => theme.closePicker()} />
          <div className="sheet" role="dialog" aria-modal="true" aria-labelledby="style-sheet-title">
            <div className="sheet-head">
              <div>
                <h2 id="style-sheet-title">Choose a style</h2>
                <p>
                  {room?.isHost
                    ? "Changes the look for the whole room. Phones follow unless they pick their own."
                    : isPlayerInRoom
                      ? "Changes only your phone."
                      : "Changes the look on this device."}
                </p>
              </div>
              <button type="button" className="sheet-x" onClick={() => theme.closePicker()} aria-label="Close">
                ✕
              </button>
            </div>
            <div className="sw-grid">
              {STYLES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={`sw sw-${s.id}`}
                  aria-pressed={t.style === s.id}
                  onClick={(e) => pick(s.id, e)}
                >
                  <i aria-hidden="true" />
                  <b>{s.name}</b>
                </button>
              ))}
            </div>
            {error && <p style={{ color: "#ff8a80", marginTop: 10 }}>{error}</p>}
            <div className="sheet-row">
              {isPlayerInRoom && t.roomMode === "own" ? (
                <button type="button" className="tog" onClick={() => withTransition(() => theme.setRoomMode("host"))}>
                  Match the host
                </button>
              ) : (
                <span className="note">{isPlayerInRoom ? "Following the host's style." : " "}</span>
              )}
              <button type="button" className="tog" aria-pressed={t.lite} onClick={() => theme.setLite(!t.lite)}>
                Reduce effects
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
