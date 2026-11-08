"use client";

/**
 * Live room data for one device.
 *
 * Reads go straight to Supabase (RLS decides what this user may see). We
 * subscribe to Postgres Changes on the three room tables and treat every event
 * as "something changed, refetch". Refetching is a few small queries, and it
 * means we never have to merge partial updates or worry about event ordering.
 * A slow poll covers missed events (phones sleeping, flaky Wi-Fi).
 */
import { useCallback, useEffect, useRef, useState } from "react";
import type { RoomPlayer } from "./game-contract";
import { browserSupabase } from "./supabase/browser";

export type RoomStatus = "lobby" | "playing" | "finished" | "closed";

export interface LiveRoom {
  id: string;
  code: string;
  gameSlug: string;
  status: RoomStatus;
  settings: unknown;
  publicState: unknown;
  version: number;
  /** UI style the host picked, or null. */
  theme: string | null;
}

export interface RoomSnapshot {
  room: LiveRoom;
  players: RoomPlayer[];
  /** Null if this user is no longer in the room (e.g. removed by the host). */
  me: RoomPlayer | null;
  privateState: unknown;
}

const POLL_MS = 6000;
const COALESCE_MS = 60;

export function useRoom(roomId: string, userId: string) {
  const [snapshot, setSnapshot] = useState<RoomSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const requestSeq = useRef(0);
  const pending = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refetch = useCallback(async () => {
    const seq = ++requestSeq.current;
    const sb = browserSupabase();
    const [roomRes, playersRes, privRes] = await Promise.all([
      sb
        .from("rooms")
        .select("id, code, game_slug, status, settings, public_state, version, theme")
        .eq("id", roomId)
        .maybeSingle(),
      sb
        .from("players")
        .select("id, user_id, nickname, is_host, connected, joined_at")
        .eq("room_id", roomId)
        .order("joined_at"),
      sb.from("player_private").select("state").eq("room_id", roomId).eq("user_id", userId).maybeSingle(),
    ]);
    if (seq !== requestSeq.current) return; // a newer fetch has started; drop this one
    if (roomRes.error || playersRes.error || privRes.error) {
      setError((roomRes.error ?? playersRes.error ?? privRes.error)!.message);
      return;
    }
    setError(null);
    if (!roomRes.data) {
      // RLS hides the room once we're not a member.
      setSnapshot((prev) => (prev ? { ...prev, me: null } : null));
      return;
    }
    const r = roomRes.data;
    const rows = playersRes.data ?? [];
    const players: RoomPlayer[] = rows.map((p) => ({
      id: p.id,
      nickname: p.nickname,
      isHost: p.is_host,
      connected: p.connected,
    }));
    const meRow = rows.find((p) => p.user_id === userId);
    setSnapshot({
      room: {
        id: r.id,
        code: r.code,
        gameSlug: r.game_slug,
        status: r.status,
        settings: r.settings,
        publicState: r.public_state,
        version: r.version,
        theme: r.theme ?? null,
      },
      players,
      me: meRow ? players.find((p) => p.id === meRow.id)! : null,
      privateState: privRes.data?.state ?? null,
    });
  }, [roomId, userId]);

  const schedule = useCallback(() => {
    if (pending.current) return;
    pending.current = setTimeout(() => {
      pending.current = null;
      void refetch();
    }, COALESCE_MS);
  }, [refetch]);

  useEffect(() => {
    const sb = browserSupabase();
    schedule(); // initial load

    const channel = sb
      .channel(`room:${roomId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "rooms", filter: `id=eq.${roomId}` }, schedule)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "players", filter: `room_id=eq.${roomId}` },
        schedule,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "player_private", filter: `room_id=eq.${roomId}` },
        schedule,
      )
      .subscribe((status) => {
        // Refetch on (re)subscribe so nothing that happened while disconnected is missed.
        if (status === "SUBSCRIBED") schedule();
      });

    const poll = setInterval(schedule, POLL_MS);
    const onVisible = () => document.visibilityState === "visible" && schedule();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", schedule);

    return () => {
      clearInterval(poll);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", schedule);
      if (pending.current) clearTimeout(pending.current);
      pending.current = null;
      void sb.removeChannel(channel);
    };
  }, [roomId, schedule]);

  return { snapshot, error, refetch };
}
