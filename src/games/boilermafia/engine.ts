/**
 * BoilerMafia engine. Pure TypeScript: no React, no Supabase, no clocks, no
 * Math.random. Everything time- or chance-based comes in through ctx.
 * See SPEC.md for the rules this implements.
 */
import {
  IllegalIntentError,
  type EngineContext,
  type EnginePlayer,
  type GameEngine,
  type IntentContext,
  type PlayerId,
} from "@/platform/game-contract";
import type { Intent, PrivateState, PublicState, Role, Settings, State, Team, Verdict, VoteTarget } from "./types";

export const DAWN_SECONDS = 12;
export const VERDICT_SECONDS = 12;

const NIGHT_ROLES: Role[] = ["werewolf", "doctor", "seer"];

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

export const defaultSettings: Settings = {
  minPlayers: 5,
  maxPlayers: 12,
  werewolves: 2,
  doctors: 1,
  seers: 1,
  revealSeconds: 15,
  nightSeconds: 45,
  daySeconds: 120,
};

function clampInt(raw: unknown, fallback: number, min: number, max: number): number {
  const n = typeof raw === "number" ? raw : typeof raw === "string" && raw.trim() !== "" ? Number(raw) : NaN;
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

function parseSettings(raw: unknown): Settings {
  const r = (typeof raw === "object" && raw !== null ? raw : {}) as Record<string, unknown>;
  const d = defaultSettings;
  const maxPlayers = clampInt(r.maxPlayers, d.maxPlayers, 3, 20);
  const minPlayers = clampInt(r.minPlayers, d.minPlayers, 3, maxPlayers);
  return {
    minPlayers,
    maxPlayers,
    werewolves: clampInt(r.werewolves, d.werewolves, 1, 6),
    doctors: clampInt(r.doctors, d.doctors, 0, 3),
    seers: clampInt(r.seers, d.seers, 0, 3),
    revealSeconds: clampInt(r.revealSeconds, d.revealSeconds, 5, 60),
    nightSeconds: clampInt(r.nightSeconds, d.nightSeconds, 15, 180),
    daySeconds: clampInt(r.daySeconds, d.daySeconds, 30, 600),
  };
}

function validateStart(playerCount: number, s: Settings): string | null {
  if (playerCount < s.minPlayers) return `Need at least ${s.minPlayers} players (have ${playerCount}).`;
  if (playerCount > s.maxPlayers) return `At most ${s.maxPlayers} players allowed (have ${playerCount}).`;
  if (s.werewolves + s.doctors + s.seers > playerCount) {
    return `Too many special roles (${s.werewolves + s.doctors + s.seers}) for ${playerCount} players.`;
  }
  if (s.werewolves * 2 >= playerCount) return "Werewolves must be fewer than half the players.";
  return null;
}

// ---------------------------------------------------------------------------
// Intents
// ---------------------------------------------------------------------------

function parseIntent(raw: unknown): Intent {
  if (typeof raw !== "object" || raw === null) throw new IllegalIntentError("Malformed action.");
  const r = raw as Record<string, unknown>;
  switch (r.type) {
    case "ready":
      return { type: "ready" };
    case "advance":
      return { type: "advance" };
    case "nightAction":
      if (typeof r.target !== "string") throw new IllegalIntentError("Pick a target.");
      return { type: "nightAction", target: r.target };
    case "vote":
      if (typeof r.target !== "string") throw new IllegalIntentError("Pick someone to vote for.");
      return { type: "vote", target: r.target };
    default:
      throw new IllegalIntentError("Unknown action.");
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function shuffle<T>(items: T[], random: () => number): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const isAlive = (s: State, id: PlayerId) => s.public.alive.includes(id);
const roleOf = (s: State, id: PlayerId): Role | undefined => s.private[id]?.role;

function aliveWithRole(s: State, role: Role): PlayerId[] {
  return s.public.alive.filter((id) => roleOf(s, id) === role);
}

function winnerOf(s: State): Team | null {
  const wolves = aliveWithRole(s, "werewolf").length;
  const others = s.public.alive.length - wolves;
  if (wolves === 0) return "village";
  if (wolves >= others) return "werewolves";
  return null;
}

function mapPrivate(s: State, fn: (p: PrivateState, id: PlayerId) => PrivateState): Record<PlayerId, PrivateState> {
  const out: Record<PlayerId, PrivateState> = {};
  for (const [id, p] of Object.entries(s.private)) out[id] = fn(p, id);
  return out;
}

/** Remove a player from the alive list and reveal their role. */
function kill(s: State, id: PlayerId): State {
  return {
    ...s,
    public: {
      ...s.public,
      alive: s.public.alive.filter((a) => a !== id),
      revealedRoles: { ...s.public.revealedRoles, [id]: s.private[id].role },
    },
  };
}

// ---------------------------------------------------------------------------
// Phase transitions
// ---------------------------------------------------------------------------

function enterNight(s: State, ctx: EngineContext, settings: { nightSeconds: number }): State {
  return {
    public: {
      ...s.public,
      phase: "night",
      round: s.public.round + 1,
      deadline: ctx.now + settings.nightSeconds * 1000,
      votes: {},
    },
    private: mapPrivate(s, (p) => ({ ...p, nightTarget: null, packVotes: {} })),
  };
}

function resolveNight(s: State, ctx: EngineContext): State {
  // Tally wolf votes; plurality wins, ties broken randomly.
  const tally = new Map<PlayerId, number>();
  for (const wolf of aliveWithRole(s, "werewolf")) {
    const t = s.private[wolf].nightTarget;
    if (t) tally.set(t, (tally.get(t) ?? 0) + 1);
  }
  let target: PlayerId | null = null;
  if (tally.size > 0) {
    const top = Math.max(...tally.values());
    const tied = [...tally.entries()].filter(([, n]) => n === top).map(([id]) => id);
    target = tied[Math.floor(ctx.random() * tied.length)];
  }

  const saved = new Set(
    aliveWithRole(s, "doctor")
      .map((id) => s.private[id].nightTarget)
      .filter((t): t is PlayerId => t !== null),
  );
  const killed = target && !saved.has(target) ? target : null;

  let next: State = s;
  if (killed) next = kill(next, killed);
  return {
    ...next,
    public: {
      ...next.public,
      phase: "dawn",
      deadline: ctx.now + DAWN_SECONDS * 1000,
      lastNight: { killed },
      winner: winnerOf(next),
    },
  };
}

function enterDay(s: State, ctx: EngineContext, settings: { daySeconds: number }): State {
  return {
    ...s,
    public: { ...s.public, phase: "day", deadline: ctx.now + settings.daySeconds * 1000, votes: {} },
  };
}

function resolveDay(s: State, ctx: EngineContext): State {
  const tally: Record<VoteTarget, number> = {};
  for (const voter of s.public.alive) {
    const t = s.public.votes[voter];
    if (t) tally[t] = (tally[t] ?? 0) + 1;
  }
  const entries = Object.entries(tally);
  let verdict: Verdict;
  if (entries.length === 0) {
    verdict = { eliminated: null, reason: "no-votes", tally };
  } else {
    const top = Math.max(...entries.map(([, n]) => n));
    const leaders = entries.filter(([, n]) => n === top).map(([id]) => id);
    if (leaders.length > 1) verdict = { eliminated: null, reason: "tie", tally };
    else if (leaders[0] === "skip") verdict = { eliminated: null, reason: "skip", tally };
    else verdict = { eliminated: leaders[0], reason: "majority", tally };
  }

  let next: State = s;
  if (verdict.eliminated) next = kill(next, verdict.eliminated);
  return {
    ...next,
    public: {
      ...next.public,
      phase: "verdict",
      deadline: ctx.now + VERDICT_SECONDS * 1000,
      lastVerdict: verdict,
      winner: winnerOf(next),
    },
  };
}

function enterOver(s: State): State {
  const revealedRoles: Record<PlayerId, Role> = {};
  for (const [id, p] of Object.entries(s.private)) revealedRoles[id] = p.role;
  return { ...s, public: { ...s.public, phase: "over", deadline: null, revealedRoles } };
}

/** Move to the next phase as if the current one's timer ran out. */
function advance(s: State, ctx: EngineContext): State {
  const settings = s.public.timers;
  switch (s.public.phase) {
    case "reveal":
      return enterNight(s, ctx, settings);
    case "night":
      return resolveNight(s, ctx);
    case "dawn":
      return s.public.winner ? enterOver(s) : enterDay(s, ctx, settings);
    case "day":
      return resolveDay(s, ctx);
    case "verdict":
      return s.public.winner ? enterOver(s) : enterNight(s, ctx, settings);
    case "over":
      throw new IllegalIntentError("The game is over.");
  }
}

function nightActorsDone(s: State): boolean {
  return s.public.alive
    .filter((id) => NIGHT_ROLES.includes(s.private[id].role))
    .every((id) => s.private[id].nightTarget !== null);
}

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

function init(players: EnginePlayer[], settings: Settings, ctx: EngineContext): State {
  const order = shuffle(
    players.map((p) => p.id),
    ctx.random,
  );
  const roles: Role[] = [
    ...Array<Role>(settings.werewolves).fill("werewolf"),
    ...Array<Role>(settings.doctors).fill("doctor"),
    ...Array<Role>(settings.seers).fill("seer"),
  ].slice(0, players.length);
  while (roles.length < players.length) roles.push("villager");

  const roleById: Record<PlayerId, Role> = {};
  order.forEach((id, i) => (roleById[id] = roles[i]));
  const wolves = order.filter((id) => roleById[id] === "werewolf");

  const priv: Record<PlayerId, PrivateState> = {};
  for (const p of players) {
    const role = roleById[p.id];
    priv[p.id] = {
      role,
      packmates: role === "werewolf" ? wolves.filter((w) => w !== p.id) : [],
      nightTarget: null,
      packVotes: {},
      seerResults: [],
    };
  }

  const roleCounts: Record<Role, number> = { werewolf: 0, doctor: 0, seer: 0, villager: 0 };
  for (const r of roles) roleCounts[r]++;

  const pub: PublicState = {
    phase: "reveal",
    round: 0,
    playerIds: players.map((p) => p.id),
    alive: players.map((p) => p.id),
    deadline: ctx.now + settings.revealSeconds * 1000,
    ready: [],
    roleCounts,
    lastNight: null,
    votes: {},
    lastVerdict: null,
    revealedRoles: {},
    winner: null,
    timers: { nightSeconds: settings.nightSeconds, daySeconds: settings.daySeconds },
  };
  return { public: pub, private: priv };
}

function reduce(s: State, intent: Intent, ctx: IntentContext): State {
  const { phase } = s.public;
  const actor = ctx.actorId;

  if (intent.type === "advance") {
    if (!ctx.actorIsHost) throw new IllegalIntentError("Only the host screen can advance the game.");
    return advance(s, ctx);
  }

  if (ctx.actorIsHost || !s.private[actor]) throw new IllegalIntentError("You're not in this game.");
  if (phase === "over") throw new IllegalIntentError("The game is over.");

  switch (intent.type) {
    case "ready": {
      if (phase !== "reveal") throw new IllegalIntentError("Too late, the night has begun.");
      if (s.public.ready.includes(actor)) return s;
      const next: State = { ...s, public: { ...s.public, ready: [...s.public.ready, actor] } };
      return next.public.ready.length >= next.public.playerIds.length ? advance(next, ctx) : next;
    }

    case "nightAction": {
      if (phase !== "night") throw new IllegalIntentError("You can only do that at night.");
      if (!isAlive(s, actor)) throw new IllegalIntentError("The dead don't get a turn.");
      const me = s.private[actor];
      const target = intent.target;
      if (!isAlive(s, target)) throw new IllegalIntentError("That player isn't alive.");

      let priv = s.private;
      switch (me.role) {
        case "villager":
          throw new IllegalIntentError("Villagers sleep through the night.");
        case "werewolf": {
          if (roleOf(s, target) === "werewolf") throw new IllegalIntentError("You can't attack a fellow werewolf.");
          priv = mapPrivate(s, (p, id) => {
            if (p.role !== "werewolf") return p;
            const packVotes = { ...p.packVotes, [actor]: target };
            return id === actor ? { ...p, nightTarget: target, packVotes } : { ...p, packVotes };
          });
          break;
        }
        case "doctor": {
          if (me.nightTarget !== null) throw new IllegalIntentError("You've already chosen who to protect.");
          priv = { ...priv, [actor]: { ...me, nightTarget: target } };
          break;
        }
        case "seer": {
          if (me.nightTarget !== null) throw new IllegalIntentError("You've already had your vision tonight.");
          if (target === actor) throw new IllegalIntentError("You already know yourself.");
          const result = { round: s.public.round, target, isWerewolf: roleOf(s, target) === "werewolf" };
          priv = { ...priv, [actor]: { ...me, nightTarget: target, seerResults: [...me.seerResults, result] } };
          break;
        }
      }
      const next: State = { ...s, private: priv };
      return nightActorsDone(next) ? resolveNight(next, ctx) : next;
    }

    case "vote": {
      if (phase !== "day") throw new IllegalIntentError("Voting is closed.");
      if (!isAlive(s, actor)) throw new IllegalIntentError("The dead don't vote.");
      if (intent.target !== "skip" && !isAlive(s, intent.target)) {
        throw new IllegalIntentError("You can only vote for someone alive.");
      }
      const next: State = { ...s, public: { ...s.public, votes: { ...s.public.votes, [actor]: intent.target } } };
      const allVoted = next.public.alive.every((id) => next.public.votes[id] !== undefined);
      return allVoted ? resolveDay(next, ctx) : next;
    }
  }
}

function tick(s: State, ctx: EngineContext): State {
  const { deadline, phase } = s.public;
  if (phase === "over" || deadline === null || ctx.now < deadline) return s;
  return advance(s, ctx);
}

export const engine: GameEngine<Settings, PublicState, PrivateState, Intent> = {
  parseSettings,
  validateStart,
  parseIntent,
  init,
  reduce,
  tick,
  deadline: (pub) => (pub.phase === "over" ? null : pub.deadline),
  isOver: (pub) => pub.phase === "over",
};
