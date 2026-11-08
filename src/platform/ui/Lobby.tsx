"use client";

import { QRCodeSVG } from "qrcode.react";
import { useState, useSyncExternalStore } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import type { AnyGameManifest, RoomPlayer } from "../game-contract";
import { kickPlayer, startGame } from "../actions";

const subscribeNoop = () => () => {};

/** The join URL needs window.location, which doesn't exist during server rendering. */
function useOrigin(): string {
  return useSyncExternalStore(
    subscribeNoop,
    () => window.location.origin,
    () => "",
  );
}

export function HostLobby({
  game,
  code,
  settings,
  players,
}: {
  game: AnyGameManifest;
  code: string;
  settings: unknown;
  players: RoomPlayer[];
}) {
  const origin = useOrigin();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const joinUrl = `${origin}/${game.slug}/${code}`;
  const roster = players.filter((p) => !p.isHost);
  const parsed = game.engine.parseSettings(settings);
  const problem = game.engine.validateStart(roster.length, parsed);
  const { max } = game.playerLimits(parsed);

  const start = async () => {
    setBusy(true);
    setError(null);
    const res = await startGame(code);
    setBusy(false);
    if (!res.ok) setError(res.error);
  };

  return (
    <main className="mx-auto grid min-h-dvh max-w-6xl items-center gap-10 px-6 py-10 lg:grid-cols-[1fr_1.1fr] lg:px-12">
      <section className="text-center lg:text-left">
        <p className="text-muted text-sm font-semibold tracking-[0.3em] uppercase">{game.name}</p>
        <p className="text-muted mt-6 text-lg">Join at</p>
        <p className="text-2xl font-semibold break-all">{origin.replace(/^https?:\/\//, "")}</p>
        <p className="text-muted mt-6 text-lg">with code</p>
        <p className="text-ink font-mono text-8xl font-bold tracking-[0.15em] lg:text-9xl">{code}</p>
        <div className="mt-8 inline-block rounded-3xl bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          {origin && <QRCodeSVG value={joinUrl} size={180} marginSize={0} fgColor="#1d1d1f" />}
        </div>
      </section>

      <section>
        <Card className="p-8">
          <div className="flex items-baseline justify-between">
            <h2 className="text-2xl font-semibold">Players</h2>
            <span className="text-muted tabular-nums">
              {roster.length} / {max}
            </span>
          </div>
          {roster.length === 0 ? (
            <p className="text-muted mt-8 mb-4 text-center">Waiting for players to join…</p>
          ) : (
            <ul className="mt-6 grid grid-cols-2 gap-2">
              {roster.map((p) => (
                <li
                  key={p.id}
                  className="animate-rise group bg-canvas flex items-center justify-between rounded-2xl px-4 py-3"
                >
                  <span className="truncate text-lg font-medium">{p.nickname}</span>
                  <button
                    type="button"
                    onClick={() => void kickPlayer(code, p.id)}
                    className="text-muted ml-2 opacity-0 transition group-hover:opacity-100 focus:opacity-100"
                    aria-label={`Remove ${p.nickname}`}
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
          <Button size="xl" className="mt-8 w-full" disabled={!!problem || busy} onClick={start}>
            {busy ? "Starting…" : "Start game"}
          </Button>
          <p className="text-muted mt-3 min-h-6 text-center text-sm">
            {error ?? problem ?? "Everyone's here? Let's go."}
          </p>
        </Card>
      </section>
    </main>
  );
}

export function PlayerLobby({ game, me, players }: { game: AnyGameManifest; me: RoomPlayer; players: RoomPlayer[] }) {
  const roster = players.filter((p) => !p.isHost);
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-5 py-10">
      <p className="text-muted text-sm font-semibold tracking-[0.3em] uppercase">{game.name}</p>
      <h1 className="font-display mt-4 text-4xl font-semibold">You&apos;re in, {me.nickname}.</h1>
      <p className="text-muted mt-2 text-lg">Watch the big screen. The host will start soon.</p>
      <ul className="mt-10 grid gap-2">
        {roster.map((p) => (
          <li
            key={p.id}
            className={`animate-rise rounded-2xl px-5 py-4 text-lg font-medium ${p.id === me.id ? "bg-accent text-white" : "bg-white"}`}
          >
            {p.nickname}
          </li>
        ))}
      </ul>
    </main>
  );
}
