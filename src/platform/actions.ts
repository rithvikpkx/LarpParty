"use server";

/**
 * Server actions: the only code allowed to change game state.
 *
 * Every action:
 *   1. identifies the caller from their Supabase session cookie,
 *   2. loads the room with the service-role client,
 *   3. authorizes the caller (member? host?),
 *   4. runs the game engine,
 *   5. writes the result with an optimistic version check, retrying on conflict.
 *
 * Errors are returned as { ok: false, error } rather than thrown, because
 * Next.js hides thrown error messages from the browser in production.
 */
import { getGame } from "@/games";
import { IllegalIntentError, type AnyGameManifest, type EnginePlayer, type GameState } from "./game-contract";
import { adminSupabase } from "./supabase/admin";
import { userSupabase } from "./supabase/server";

export type ActionResult<T = null> = { ok: true; data: T } | { ok: false; error: string };

const ok = <T>(data: T): ActionResult<T> => ({ ok: true, data });
const fail = (error: string): ActionResult<never> => ({ ok: false, error });

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // no I or O: they look like 1 and 0
const ROOM_TTL_HOURS = 12;
const MAX_WRITE_ATTEMPTS = 6;

interface RoomRow {
  id: string;
  code: string;
  game_slug: string;
  status: "lobby" | "playing" | "finished" | "closed";
  settings: unknown;
  public_state: unknown;
  version: number;
  host_player_id: string | null;
}

interface PlayerRow {
  id: string;
  user_id: string;
  nickname: string;
  is_host: boolean;
  joined_at: string;
}

class ActionError extends Error {}

async function requireUserId(): Promise<string> {
  const supabase = await userSupabase();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new ActionError("Your session expired. Refresh the page.");
  return data.user.id;
}

function normalizeCode(code: string): string {
  return code.trim().toUpperCase();
}

async function loadRoom(code: string): Promise<RoomRow> {
  const { data, error } = await adminSupabase()
    .from("rooms")
    .select("id, code, game_slug, status, settings, public_state, version, host_player_id")
    .eq("code", normalizeCode(code))
    .neq("status", "closed")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new ActionError("No room with that code.");
  return data as RoomRow;
}

async function loadPlayers(roomId: string): Promise<PlayerRow[]> {
  const { data, error } = await adminSupabase()
    .from("players")
    .select("id, user_id, nickname, is_host, joined_at")
    .eq("room_id", roomId)
    .order("joined_at");
  if (error) throw new Error(error.message);
  return data as PlayerRow[];
}

async function loadPrivate(roomId: string): Promise<Record<string, unknown>> {
  const { data, error } = await adminSupabase().from("player_private").select("player_id, state").eq("room_id", roomId);
  if (error) throw new Error(error.message);
  return Object.fromEntries((data ?? []).map((r) => [r.player_id as string, r.state]));
}

function gameFor(room: RoomRow): AnyGameManifest {
  const game = getGame(room.game_slug);
  if (!game) throw new Error(`Unknown game ${room.game_slug}`);
  return game;
}

/** Wrap an action body so expected failures become { ok: false } results. */
async function run<T>(body: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return ok(await body());
  } catch (e) {
    if (e instanceof ActionError || e instanceof IllegalIntentError) return fail(e.message);
    console.error(e);
    return fail("Something went wrong. Try again.");
  }
}

/**
 * Load the room, compute the next state with `step`, and write it guarded by the
 * version number. If another request wrote in between, reload and try again.
 * `step` returns null to mean "nothing to write".
 */
async function mutateRoom(
  code: string,
  step: (ctx: {
    room: RoomRow;
    game: AnyGameManifest;
    players: PlayerRow[];
    state: GameState<unknown, unknown>;
  }) => { state: GameState<unknown, unknown>; status: RoomRow["status"] } | null,
): Promise<void> {
  for (let attempt = 0; attempt < MAX_WRITE_ATTEMPTS; attempt++) {
    const room = await loadRoom(code);
    const [players, priv] = await Promise.all([loadPlayers(room.id), loadPrivate(room.id)]);
    const result = step({ room, game: gameFor(room), players, state: { public: room.public_state, private: priv } });
    if (!result) return;

    const { data, error } = await adminSupabase().rpc("apply_room_state", {
      p_room_id: room.id,
      p_expected_version: room.version,
      p_status: result.status,
      p_public: result.state.public,
      p_private: result.state.private,
    });
    if (error) throw new Error(error.message);
    if (data !== null) return; // written
    // Version conflict: someone else wrote first. Back off briefly and retry.
    await new Promise((r) => setTimeout(r, 20 + Math.random() * 60 * (attempt + 1)));
  }
  throw new ActionError("The room is busy. Try again.");
}

function requireMember(players: PlayerRow[], userId: string): PlayerRow {
  const me = players.find((p) => p.user_id === userId);
  if (!me) throw new ActionError("You're not in this room.");
  return me;
}

function enginePlayers(players: PlayerRow[]): EnginePlayer[] {
  return players.filter((p) => !p.is_host).map((p) => ({ id: p.id, nickname: p.nickname }));
}

// ---------------------------------------------------------------------------
// Public actions
// ---------------------------------------------------------------------------

/** Current server time, used by browsers to correct for clock skew. */
export async function getServerTime(): Promise<number> {
  return Date.now();
}

export async function createRoom(gameSlug: string, rawSettings: unknown): Promise<ActionResult<{ code: string }>> {
  return run(async () => {
    const userId = await requireUserId();
    const game = getGame(gameSlug);
    if (!game) throw new ActionError("Unknown game.");
    const settings = game.engine.parseSettings(rawSettings);
    const db = adminSupabase();

    // Close stale rooms so their codes can be reused.
    const cutoff = new Date(Date.now() - ROOM_TTL_HOURS * 3600_000).toISOString();
    await db.from("rooms").update({ status: "closed" }).lt("updated_at", cutoff).neq("status", "closed");

    for (let attempt = 0; attempt < 10; attempt++) {
      const code = Array.from(
        { length: 4 },
        () => CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)],
      ).join("");
      const { data: room, error } = await db
        .from("rooms")
        .insert({ code, game_slug: game.slug, settings })
        .select("id")
        .single();
      if (error?.code === "23505") continue; // code collision, pick another
      if (error) throw new Error(error.message);

      const { data: host, error: hostError } = await db
        .from("players")
        .insert({ room_id: room.id, user_id: userId, nickname: "Host", is_host: true })
        .select("id")
        .single();
      if (hostError) throw new Error(hostError.message);
      await db.from("rooms").update({ host_player_id: host.id }).eq("id", room.id);
      return { code };
    }
    throw new ActionError("Couldn't find a free room code. Try again.");
  });
}

export interface RoomPreview {
  roomId: string;
  code: string;
  gameSlug: string;
  status: RoomRow["status"];
  isMember: boolean;
}

/** What a device needs before it can subscribe: does the room exist, and am I in it? */
export async function getRoomPreview(code: string): Promise<ActionResult<RoomPreview>> {
  return run(async () => {
    const userId = await requireUserId();
    const room = await loadRoom(code);
    const { data } = await adminSupabase()
      .from("players")
      .select("id")
      .eq("room_id", room.id)
      .eq("user_id", userId)
      .maybeSingle();
    return { roomId: room.id, code: room.code, gameSlug: room.game_slug, status: room.status, isMember: !!data };
  });
}

export async function joinRoom(code: string, rawNickname: string): Promise<ActionResult<{ playerId: string }>> {
  return run(async () => {
    const userId = await requireUserId();
    const room = await loadRoom(code);
    const players = await loadPlayers(room.id);

    const existing = players.find((p) => p.user_id === userId);
    if (existing) return { playerId: existing.id }; // reconnecting

    if (room.status !== "lobby") throw new ActionError("This game has already started.");

    const nickname = rawNickname.trim().replace(/\s+/g, " ");
    if (nickname.length < 1 || nickname.length > 16) throw new ActionError("Nicknames are 1 to 16 characters.");
    if (players.some((p) => p.nickname.toLowerCase() === nickname.toLowerCase())) {
      throw new ActionError("Someone already has that name.");
    }

    const game = gameFor(room);
    const { max } = game.playerLimits(game.engine.parseSettings(room.settings));
    if (players.filter((p) => !p.is_host).length >= Math.min(max, game.maxPlayers)) {
      throw new ActionError("The room is full.");
    }

    const { data, error } = await adminSupabase()
      .from("players")
      .insert({ room_id: room.id, user_id: userId, nickname })
      .select("id")
      .single();
    if (error?.code === "23505") throw new ActionError("Someone already has that name.");
    if (error) throw new Error(error.message);
    return { playerId: data.id };
  });
}

/** Host only: remove a player from the lobby. */
export async function kickPlayer(code: string, playerId: string): Promise<ActionResult> {
  return run(async () => {
    const userId = await requireUserId();
    const room = await loadRoom(code);
    const players = await loadPlayers(room.id);
    if (!requireMember(players, userId).is_host) throw new ActionError("Only the host can remove players.");
    if (room.status !== "lobby") throw new ActionError("You can only remove players in the lobby.");
    const target = players.find((p) => p.id === playerId);
    if (!target || target.is_host) throw new ActionError("No such player.");
    await adminSupabase().from("players").delete().eq("id", playerId);
    // Touch the room so every subscriber refetches (delete events can't be RLS-filtered).
    await adminSupabase().from("rooms").update({ updated_at: new Date().toISOString() }).eq("id", room.id);
    return null;
  });
}

export async function startGame(code: string): Promise<ActionResult> {
  return run(async () => {
    const userId = await requireUserId();
    await mutateRoom(code, ({ room, game, players }) => {
      if (!requireMember(players, userId).is_host) throw new ActionError("Only the host can start the game.");
      if (room.status !== "lobby") throw new ActionError("The game has already started.");
      const settings = game.engine.parseSettings(room.settings);
      const roster = enginePlayers(players);
      const problem = game.engine.validateStart(roster.length, settings);
      if (problem) throw new ActionError(problem);
      const state = game.engine.init(roster, settings, { now: Date.now(), random: Math.random });
      return { state, status: "playing" };
    });
    return null;
  });
}

export async function sendIntent(code: string, rawIntent: unknown): Promise<ActionResult> {
  return run(async () => {
    const userId = await requireUserId();
    await mutateRoom(code, ({ room, game, players, state }) => {
      const me = requireMember(players, userId);
      if (room.status !== "playing") throw new ActionError("The game isn't running.");
      const intent = game.engine.parseIntent(rawIntent);
      const next = game.engine.reduce(state, intent, {
        now: Date.now(),
        random: Math.random,
        actorId: me.id,
        actorIsHost: me.is_host,
      });
      if (next === state) return null;
      return { state: next, status: game.engine.isOver(next.public) ? "finished" : "playing" };
    });
    return null;
  });
}

/** Any member may call this once a phase deadline has passed. The server checks its own clock. */
export async function tickRoom(code: string): Promise<ActionResult> {
  return run(async () => {
    const userId = await requireUserId();
    await mutateRoom(code, ({ room, game, players, state }) => {
      requireMember(players, userId);
      if (room.status !== "playing" || !game.engine.tick) return null;
      const next = game.engine.tick(state, { now: Date.now(), random: Math.random });
      if (next === state) return null;
      return { state: next, status: game.engine.isOver(next.public) ? "finished" : "playing" };
    });
    return null;
  });
}

/** Host only: back to the lobby with the same players, ready for another round. */
export async function returnToLobby(code: string): Promise<ActionResult> {
  return run(async () => {
    const userId = await requireUserId();
    const room = await loadRoom(code);
    const players = await loadPlayers(room.id);
    if (!requireMember(players, userId).is_host) throw new ActionError("Only the host can do that.");
    const db = adminSupabase();
    await db.from("player_private").delete().eq("room_id", room.id);
    const { error } = await db
      .from("rooms")
      .update({ status: "lobby", public_state: null, version: room.version + 1, updated_at: new Date().toISOString() })
      .eq("id", room.id);
    if (error) throw new Error(error.message);
    return null;
  });
}
