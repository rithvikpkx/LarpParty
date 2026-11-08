import { describe, expect, it } from "vitest";
import { IllegalIntentError, type EnginePlayer, type IntentContext } from "@/platform/game-contract";
import { DAWN_SECONDS, engine, VERDICT_SECONDS } from "./engine";
import type { Intent, Role, Settings, State } from "./types";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

/** Deterministic RNG (mulberry32) so role shuffles are reproducible. */
function seeded(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const T0 = 1_000_000;
const HOST = "host";

function players(n: number): EnginePlayer[] {
  return Array.from({ length: n }, (_, i) => ({ id: `p${i + 1}`, nickname: `Player ${i + 1}` }));
}

function settings(overrides: Partial<Settings> = {}): Settings {
  return { ...engine.parseSettings({}), ...overrides };
}

function start(n = 6, overrides: Partial<Settings> = {}, seed = 1): State {
  return engine.init(players(n), settings(overrides), { now: T0, random: seeded(seed) });
}

function idsWithRole(state: State, role: Role): string[] {
  return Object.entries(state.private)
    .filter(([, p]) => p.role === role)
    .map(([id]) => id);
}

function act(state: State, actorId: string, intent: Intent, now = T0, seed = 2): State {
  const ctx: IntentContext = { now, random: seeded(seed), actorId, actorIsHost: actorId === HOST };
  return engine.reduce(state, intent, ctx);
}

/** Skip the reveal phase via the host. */
function toNight(state: State): State {
  return act(state, HOST, { type: "advance" });
}

/** Run a full night where wolves kill `target` and the doctor (if any) protects `save`. */
function playNight(state: State, target: string, save?: string): State {
  let s = state;
  for (const wolf of idsWithRole(s, "werewolf").filter((id) => s.public.alive.includes(id))) {
    s = act(s, wolf, { type: "nightAction", target });
  }
  for (const doc of idsWithRole(s, "doctor").filter((id) => s.public.alive.includes(id))) {
    s = act(s, doc, { type: "nightAction", target: save ?? doc });
  }
  for (const seer of idsWithRole(s, "seer").filter((id) => s.public.alive.includes(id))) {
    const other = s.public.alive.find((id) => id !== seer)!;
    s = act(s, seer, { type: "nightAction", target: other });
  }
  return s;
}

function villagers(state: State): string[] {
  return state.public.alive.filter((id) => state.private[id].role !== "werewolf");
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("parseSettings", () => {
  it("fills defaults and clamps out-of-range values", () => {
    const s = engine.parseSettings({ werewolves: 99, nightSeconds: 1, maxPlayers: "x" });
    expect(s.werewolves).toBe(6);
    expect(s.nightSeconds).toBe(15);
    expect(s.maxPlayers).toBe(12);
  });

  it("keeps minPlayers <= maxPlayers", () => {
    const s = engine.parseSettings({ minPlayers: 10, maxPlayers: 4 });
    expect(s.minPlayers).toBeLessThanOrEqual(s.maxPlayers);
  });
});

describe("validateStart", () => {
  it("rejects too few players", () => {
    expect(engine.validateStart(4, settings({ minPlayers: 5 }))).toMatch(/at least 5/);
  });
  it("rejects more special roles than players", () => {
    expect(engine.validateStart(3, settings({ minPlayers: 3, werewolves: 1, doctors: 1, seers: 2 }))).toMatch(/roles/);
  });
  it("rejects a wolf majority at the start", () => {
    expect(engine.validateStart(4, settings({ minPlayers: 3, werewolves: 2 }))).toMatch(/fewer than half/);
  });
  it("accepts a legal setup", () => {
    expect(engine.validateStart(6, settings())).toBeNull();
  });
});

describe("init", () => {
  it("assigns exactly the configured roles, villagers for the rest", () => {
    const s = start(7);
    expect(idsWithRole(s, "werewolf")).toHaveLength(2);
    expect(idsWithRole(s, "doctor")).toHaveLength(1);
    expect(idsWithRole(s, "seer")).toHaveLength(1);
    expect(idsWithRole(s, "villager")).toHaveLength(3);
    expect(s.public.roleCounts).toEqual({ werewolf: 2, doctor: 1, seer: 1, villager: 3 });
  });

  it("starts in reveal with everyone alive and a deadline", () => {
    const s = start(6);
    expect(s.public.phase).toBe("reveal");
    expect(s.public.alive).toHaveLength(6);
    expect(s.public.deadline).toBe(T0 + 15_000);
  });

  it("tells werewolves who their packmates are, and nobody else", () => {
    const s = start(6);
    const [w1, w2] = idsWithRole(s, "werewolf");
    expect(s.private[w1].packmates).toEqual([w2]);
    expect(s.private[w2].packmates).toEqual([w1]);
    for (const id of villagers(s)) expect(s.private[id].packmates).toEqual([]);
  });

  it("never puts roles in public state", () => {
    const s = start(6);
    // Only aggregate counts are public; nobody's individual role is.
    expect(s.public.revealedRoles).toEqual({});
    expect(JSON.stringify(s.public)).not.toMatch(/"role"/);
    for (const id of s.public.playerIds) expect(JSON.stringify(s.public)).not.toContain(`"${id}":"`);
  });

  it("is deterministic for a given seed", () => {
    expect(start(8, {}, 42)).toEqual(start(8, {}, 42));
  });
});

describe("reveal", () => {
  it("moves to night once everyone is ready", () => {
    let s = start(5, { minPlayers: 3, werewolves: 1 });
    for (const id of s.public.playerIds) s = act(s, id, { type: "ready" });
    expect(s.public.phase).toBe("night");
    expect(s.public.round).toBe(1);
    expect(s.public.deadline).toBe(T0 + 45_000);
  });

  it("only lets the host advance", () => {
    const s = start(6);
    expect(() => act(s, "p1", { type: "advance" })).toThrow(IllegalIntentError);
  });
});

describe("night", () => {
  it("kills the wolves' target and reveals their role at dawn", () => {
    let s = toNight(start(6));
    const victim = villagers(s).find((id) => s.private[id].role === "villager")!;
    s = playNight(s, victim);
    expect(s.public.phase).toBe("dawn");
    expect(s.public.lastNight).toEqual({ killed: victim });
    expect(s.public.alive).not.toContain(victim);
    expect(s.public.revealedRoles[victim]).toBe("villager");
    expect(s.public.deadline).toBe(T0 + DAWN_SECONDS * 1000);
  });

  it("lets the doctor save the target", () => {
    let s = toNight(start(6));
    const victim = villagers(s).find((id) => s.private[id].role === "villager")!;
    s = playNight(s, victim, victim);
    expect(s.public.phase).toBe("dawn");
    expect(s.public.lastNight).toEqual({ killed: null });
    expect(s.public.alive).toContain(victim);
  });

  it("gives the seer a private, accurate result", () => {
    let s = toNight(start(6));
    const [seer] = idsWithRole(s, "seer");
    const [wolf] = idsWithRole(s, "werewolf");
    s = act(s, seer, { type: "nightAction", target: wolf });
    expect(s.private[seer].seerResults).toEqual([{ round: 1, target: wolf, isWerewolf: true }]);
    expect(JSON.stringify(s.public)).not.toContain("isWerewolf");
  });

  it("shares pack votes between wolves", () => {
    let s = toNight(start(6));
    const [w1, w2] = idsWithRole(s, "werewolf");
    const victim = villagers(s)[0];
    s = act(s, w1, { type: "nightAction", target: victim });
    expect(s.private[w2].packVotes).toEqual({ [w1]: victim });
    expect(s.public.phase).toBe("night");
  });

  it("breaks a wolf tie randomly but always kills one of the tied targets", () => {
    let s = toNight(start(6));
    const [w1, w2] = idsWithRole(s, "werewolf");
    const [a, b] = villagers(s).filter((id) => s.private[id].role === "villager");
    s = act(s, w1, { type: "nightAction", target: a });
    s = act(s, w2, { type: "nightAction", target: b });
    s = act(s, HOST, { type: "advance" });
    expect([a, b]).toContain(s.public.lastNight?.killed);
  });

  it("kills nobody if wolves never vote", () => {
    let s = toNight(start(6));
    s = act(s, HOST, { type: "advance" });
    expect(s.public.lastNight).toEqual({ killed: null });
    expect(s.public.alive).toHaveLength(6);
  });

  it("rejects illegal night actions", () => {
    const s = toNight(start(6));
    const [w1, w2] = idsWithRole(s, "werewolf");
    const [seer] = idsWithRole(s, "seer");
    const villager = idsWithRole(s, "villager")[0];
    expect(() => act(s, w1, { type: "nightAction", target: w2 })).toThrow(/werewolf/i);
    expect(() => act(s, villager, { type: "nightAction", target: w1 })).toThrow(IllegalIntentError);
    expect(() => act(s, seer, { type: "nightAction", target: seer })).toThrow(IllegalIntentError);
    expect(() => act(s, w1, { type: "vote", target: villager })).toThrow(IllegalIntentError);
  });

  it("locks the seer's choice", () => {
    let s = toNight(start(6));
    const [seer] = idsWithRole(s, "seer");
    const others = s.public.alive.filter((id) => id !== seer);
    s = act(s, seer, { type: "nightAction", target: others[0] });
    expect(() => act(s, seer, { type: "nightAction", target: others[1] })).toThrow(IllegalIntentError);
  });
});

describe("timers", () => {
  it("does nothing before the deadline", () => {
    const s = start(6);
    expect(engine.tick!(s, { now: T0 + 1000, random: seeded(3) })).toBe(s);
  });

  it("advances the phase once the deadline passes", () => {
    const s = start(6);
    const next = engine.tick!(s, { now: T0 + 15_000, random: seeded(3) });
    expect(next.public.phase).toBe("night");
  });

  it("exposes the deadline", () => {
    expect(engine.deadline!(start(6).public)).toBe(T0 + 15_000);
  });
});

describe("day", () => {
  function toDay(n = 6): State {
    let s = toNight(start(n));
    s = act(s, HOST, { type: "advance" }); // empty night -> dawn
    s = act(s, HOST, { type: "advance" }); // dawn -> day
    return s;
  }

  it("eliminates the player with the most votes once everyone has voted", () => {
    let s = toDay();
    expect(s.public.phase).toBe("day");
    const villager = idsWithRole(s, "villager")[0];
    for (const id of s.public.alive) s = act(s, id, { type: "vote", target: villager === id ? "skip" : villager });
    expect(s.public.phase).toBe("verdict");
    expect(s.public.lastVerdict?.eliminated).toBe(villager);
    expect(s.public.lastVerdict?.reason).toBe("majority");
    expect(s.public.alive).not.toContain(villager);
    expect(s.public.deadline).toBe(T0 + VERDICT_SECONDS * 1000);
  });

  it("eliminates nobody on a tie", () => {
    let s = toDay(6);
    const [a, b] = s.public.alive;
    const voters = s.public.alive;
    voters.forEach((id, i) => {
      s = act(s, id, { type: "vote", target: i % 2 === 0 ? a : b });
    });
    expect(s.public.lastVerdict?.eliminated).toBeNull();
    expect(s.public.lastVerdict?.reason).toBe("tie");
  });

  it("eliminates nobody when skip wins", () => {
    let s = toDay();
    for (const id of s.public.alive) s = act(s, id, { type: "vote", target: "skip" });
    expect(s.public.lastVerdict?.eliminated).toBeNull();
    expect(s.public.lastVerdict?.reason).toBe("skip");
  });

  it("lets players change their vote before the day ends", () => {
    let s = toDay();
    const [voter, a, b] = s.public.alive;
    s = act(s, voter, { type: "vote", target: a });
    s = act(s, voter, { type: "vote", target: b });
    expect(s.public.votes[voter]).toBe(b);
  });

  it("rejects votes for dead players and from dead players", () => {
    let s = toNight(start(6));
    const victim = idsWithRole(s, "villager")[0];
    s = playNight(s, victim);
    s = act(s, HOST, { type: "advance" }); // dawn -> day
    const alive = s.public.alive[0];
    expect(() => act(s, alive, { type: "vote", target: victim })).toThrow(IllegalIntentError);
    expect(() => act(s, victim, { type: "vote", target: alive })).toThrow(IllegalIntentError);
  });

  it("goes to the next night after the verdict", () => {
    let s = toDay();
    for (const id of s.public.alive) s = act(s, id, { type: "vote", target: "skip" });
    s = act(s, HOST, { type: "advance" });
    expect(s.public.phase).toBe("night");
    expect(s.public.round).toBe(2);
    expect(s.public.votes).toEqual({});
    for (const p of Object.values(s.private)) expect(p.nightTarget).toBeNull();
  });
});

describe("win conditions", () => {
  it("village wins when the last werewolf is voted out", () => {
    let s = toNight(start(5, { minPlayers: 3, werewolves: 1 }));
    s = act(s, HOST, { type: "advance" }); // night -> dawn (no kill)
    s = act(s, HOST, { type: "advance" }); // dawn -> day
    const [wolf] = idsWithRole(s, "werewolf");
    for (const id of s.public.alive) s = act(s, id, { type: "vote", target: id === wolf ? "skip" : wolf });
    expect(s.public.phase).toBe("verdict");
    expect(s.public.winner).toBe("village");
    expect(engine.isOver(s.public)).toBe(false); // narration first
    s = act(s, HOST, { type: "advance" });
    expect(s.public.phase).toBe("over");
    expect(engine.isOver(s.public)).toBe(true);
    expect(Object.keys(s.public.revealedRoles)).toHaveLength(5);
  });

  it("werewolves win when they reach parity", () => {
    // 3 players: 1 wolf, 2 villagers. One night kill leaves 1 v 1.
    let s = toNight(start(3, { minPlayers: 3, werewolves: 1, doctors: 0, seers: 0 }));
    const victim = villagers(s)[0];
    s = playNight(s, victim);
    expect(s.public.phase).toBe("dawn");
    expect(s.public.winner).toBe("werewolves");
    s = act(s, HOST, { type: "advance" });
    expect(s.public.phase).toBe("over");
  });

  it("rejects intents once the game is over", () => {
    let s = toNight(start(3, { minPlayers: 3, werewolves: 1, doctors: 0, seers: 0 }));
    s = playNight(s, villagers(s)[0]);
    s = act(s, HOST, { type: "advance" });
    expect(() => act(s, HOST, { type: "advance" })).toThrow(IllegalIntentError);
  });
});

describe("parseIntent", () => {
  it("accepts well-formed intents", () => {
    expect(engine.parseIntent({ type: "vote", target: "skip" })).toEqual({ type: "vote", target: "skip" });
    expect(engine.parseIntent({ type: "ready", extra: 1 })).toEqual({ type: "ready" });
  });
  it("rejects garbage", () => {
    expect(() => engine.parseIntent(null)).toThrow(IllegalIntentError);
    expect(() => engine.parseIntent({ type: "nightAction" })).toThrow(IllegalIntentError);
    expect(() => engine.parseIntent({ type: "explode" })).toThrow(IllegalIntentError);
  });
});
