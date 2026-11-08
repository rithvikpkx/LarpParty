"use client";

/**
 * /[game]/[code]. Works out who this device is in the room, then renders:
 *   not a member  -> join form (or "already started")
 *   lobby         -> HostLobby / PlayerLobby
 *   playing/over  -> the game's HostView / PlayerView
 */
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button, CenterMessage, Panel, Screen, Spinner, Toast } from "@/components/ui";
import { theme } from "@/themes/store";
import { getGame } from "@/games";
import { getRoomPreview, joinRoom, returnToLobby, sendIntent, tickRoom, type RoomPreview } from "../actions";
import { AuthGate, useUserId } from "../auth";
import type { AnyGameManifest, DispatchResult } from "../game-contract";
import { useRoom } from "../useRoom";
import { useServerClock } from "../useServerClock";
import { HostLobby, PlayerLobby } from "./Lobby";

export function RoomScreen({ slug, code }: { slug: string; code: string }) {
  return (
    <AuthGate>
      <Room slug={slug} code={code.toUpperCase()} />
    </AuthGate>
  );
}

type PreviewState = { kind: "loading" } | { kind: "error"; message: string } | { kind: "ready"; preview: RoomPreview };

function Room({ slug, code }: { slug: string; code: string }) {
  const [state, setState] = useState<PreviewState>({ kind: "loading" });

  const load = useCallback(async () => {
    const res = await getRoomPreview(code);
    setState(res.ok ? { kind: "ready", preview: res.data } : { kind: "error", message: res.error });
  }, [code]);

  useEffect(() => {
    let cancelled = false;
    getRoomPreview(code).then((res) => {
      if (!cancelled) setState(res.ok ? { kind: "ready", preview: res.data } : { kind: "error", message: res.error });
    });
    return () => {
      cancelled = true;
    };
  }, [code]);

  if (state.kind === "loading")
    return (
      <Centered>
        <Spinner />
      </Centered>
    );
  if (state.kind === "error") return <Message title={state.message} slug={slug} />;

  const { preview } = state;
  const game = getGame(preview.gameSlug);
  if (!game) return <Message title="Unknown game." slug={slug} />;
  if (!preview.isMember) {
    if (preview.status !== "lobby") return <Message title="This game has already started." slug={slug} />;
    return <JoinForm game={game} code={code} onJoined={load} />;
  }
  return <LiveRoom game={game} roomId={preview.roomId} code={code} onRemoved={load} />;
}

function LiveRoom({
  game,
  roomId,
  code,
  onRemoved,
}: {
  game: AnyGameManifest;
  roomId: string;
  code: string;
  onRemoved: () => void;
}) {
  const userId = useUserId();
  const { snapshot, error } = useRoom(roomId, userId);
  const serverNow = useServerClock();

  const dispatch = useCallback(
    async (intent: unknown): Promise<DispatchResult> => {
      const res = await sendIntent(code, intent);
      return res.ok ? { ok: true } : { ok: false, error: res.error };
    },
    [code],
  );

  const me = snapshot?.me ?? null;
  const status = snapshot?.room.status;
  const publicState = snapshot?.room.publicState;
  const deadline = status === "playing" && publicState ? (game.engine.deadline?.(publicState) ?? null) : null;
  useDeadlineTicker(code, deadline, serverNow, me?.isHost ?? false);

  useEffect(() => {
    if (snapshot && !me) onRemoved();
  }, [snapshot, me, onRemoved]);

  // Follow the room's style (the host's pick). Phones may override from the style picker.
  const roomTheme = snapshot?.room.theme ?? null;
  const isHost = me?.isHost ?? false;
  const playing = !!status && status !== "lobby";
  useEffect(() => {
    if (!snapshot) return;
    theme.setRoom({ code, style: roomTheme, isHost, playing });
  }, [snapshot, code, roomTheme, isHost, playing]);
  useEffect(() => () => theme.setRoom(null), []);

  if (!snapshot || !me) {
    return <Centered>{error ? <p className="muted">Reconnecting… ({error})</p> : <Spinner />}</Centered>;
  }

  const { room, players } = snapshot;
  if (room.status === "closed") return <Message title="This room has closed." slug={game.slug} />;
  if (room.status === "lobby" || !room.publicState) {
    return me.isHost ? (
      <HostLobby game={game} code={code} settings={room.settings} players={players} />
    ) : (
      <PlayerLobby game={game} me={me} players={players} />
    );
  }

  const View = me.isHost ? game.HostView : game.PlayerView;
  return (
    <View
      roomCode={code}
      players={players}
      me={me}
      publicState={room.publicState}
      privateState={me.isHost ? null : snapshot.privateState}
      dispatch={dispatch}
      serverNow={serverNow}
      playAgain={
        me.isHost
          ? async () => {
              await returnToLobby(code);
            }
          : undefined
      }
    />
  );
}

/**
 * Serverless functions can't run timers, so devices nudge the server once a
 * phase deadline passes. The server checks its own clock, so an early or
 * duplicate tick is harmless. The host nudges first; phones are a fallback in
 * case the host screen sleeps.
 */
function useDeadlineTicker(code: string, deadline: number | null, serverNow: () => number, isHost: boolean) {
  const inFlight = useRef(false);
  useEffect(() => {
    if (deadline === null) return;
    const grace = isHost ? 250 : 2500 + Math.random() * 1500;
    let lastAttempt = 0;
    const id = setInterval(() => {
      const now = serverNow();
      if (now < deadline + grace || inFlight.current || Date.now() - lastAttempt < 1500) return;
      inFlight.current = true;
      lastAttempt = Date.now();
      void tickRoom(code).finally(() => {
        inFlight.current = false;
      });
    }, 400);
    return () => clearInterval(id);
  }, [code, deadline, serverNow, isHost]);
}

const NICKNAME_KEY = "larpparty:nickname";

function JoinForm({ game, code, onJoined }: { game: AnyGameManifest; code: string; onJoined: () => void }) {
  const [nickname, setNickname] = useState(() => {
    try {
      return typeof window === "undefined" ? "" : (localStorage.getItem(NICKNAME_KEY) ?? "");
    } catch {
      return "";
    }
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await joinRoom(code, nickname);
    if (!res.ok) {
      setBusy(false);
      setError(res.error);
      return;
    }
    try {
      localStorage.setItem(NICKNAME_KEY, nickname.trim());
    } catch {}
    onJoined();
  };

  return (
    <Screen kind="phone" className="join" kanji="入">
      <div className="join-hero">
        <div>
          <div className="eyebrow">{game.name}</div>
          <h1 className="disp">
            Join room <span style={{ letterSpacing: ".08em" }}>{code}</span>
          </h1>
        </div>
      </div>
      <form onSubmit={submit}>
        <Panel label="JOIN" className="stack">
          <label className="label">
            Your name
            <input
              className="field"
              value={nickname}
              onChange={(e) => setNickname(e.target.value.slice(0, 16))}
              placeholder="Dash"
              autoFocus
              autoComplete="nickname"
              enterKeyHint="go"
            />
          </label>
          <Button type="submit" wide disabled={busy || nickname.trim().length === 0}>
            {busy ? "Joining…" : "Join"}
          </Button>
          {error && <Toast>{error}</Toast>}
        </Panel>
      </form>
    </Screen>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <Screen kind="phone">
      <div className="center-msg">{children}</div>
    </Screen>
  );
}

function Message({ title, slug }: { title: string; slug: string }) {
  return (
    <Screen kind="phone">
      <CenterMessage title={title}>
        <Link href={`/${slug}`} className="back" style={{ display: "inline-block", marginTop: 16 }}>
          Back
        </Link>
      </CenterMessage>
    </Screen>
  );
}
