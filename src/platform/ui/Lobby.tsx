"use client";

import { QRCodeSVG } from "qrcode.react";
import { useState, useSyncExternalStore } from "react";
import { Button, Eyebrow, Panel, PlayerTile, Screen, Toast, usePopIds } from "@/components/ui";
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
  const roster = players.filter((p) => !p.isHost);
  const fresh = usePopIds(roster.map((p) => p.id));
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
    <Screen kind="tv" className="lobby-scr" kanji="宴" pow>
      <div className="lobby">
        <div>
          <Eyebrow>{game.name} · Lobby</Eyebrow>
          <div className="join-at">
            Join at <b>{origin.replace(/^https?:\/\//, "")}</b>
          </div>
          <div className="room-code disp" aria-label={`Room code ${code}`}>
            {code.split("").map((c, i) => (
              <span key={i}>{c}</span>
            ))}
          </div>
          <div className="qr-wrap">
            <div className="qr">
              {origin && (
                <QRCodeSVG
                  value={`${origin}/${game.slug}/${code}`}
                  marginSize={0}
                  fgColor="currentColor"
                  bgColor="transparent"
                />
              )}
            </div>
          </div>
        </div>
        <Panel label="PLAYERS" className="players">
          <header>
            <h2>Players</h2>
            <span className="muted">
              {roster.length} / {max}
            </span>
          </header>
          <div className="tiles">
            {roster.length === 0 && <p className="muted">Waiting for players to join…</p>}
            {roster.map((p, i) => (
              <PlayerTile
                key={p.id}
                name={p.nickname}
                index={i}
                pop={fresh.has(p.id)}
                onRemove={() => void kickPlayer(code, p.id)}
              />
            ))}
          </div>
          <Button wide disabled={!!problem || busy} onClick={start}>
            {busy ? "Starting…" : "Start game"}
          </Button>
          <div className="start-hint">{problem ?? "Everyone in? Let's go."}</div>
          {error && <Toast>{error}</Toast>}
        </Panel>
      </div>
    </Screen>
  );
}

export function PlayerLobby({ game, me, players }: { game: AnyGameManifest; me: RoomPlayer; players: RoomPlayer[] }) {
  const roster = players.filter((p) => !p.isHost);
  const fresh = usePopIds(roster.map((p) => p.id));
  return (
    <Screen kind="phone" className="home" kanji="宴">
      <Eyebrow>{game.name}</Eyebrow>
      <h1 className="disp">You&apos;re in, {me.nickname}.</h1>
      <p className="tag">Watch the big screen. The host will start soon.</p>
      <div className="tiles">
        {roster.map((p, i) => (
          <PlayerTile key={p.id} name={p.nickname} index={i} pop={fresh.has(p.id)} />
        ))}
      </div>
    </Screen>
  );
}
