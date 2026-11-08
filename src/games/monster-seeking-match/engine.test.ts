import { describe, expect, it } from "vitest";
import { defaultSettings, engine } from "./engine";

const players = ["a", "b", "c", "d"].map((id) => ({ id, nickname: id }));
const clock = { now: 1000, random: () => 0.99 };
const actor = (id: string) => ({ ...clock, actorId: id, actorIsHost: false });
const host = { ...clock, actorId: "host", actorIsHost: true };

describe("Monster Seeking Match", () => {
  it("keeps messages private and enforces limits", () => {
    let state = engine.init(players, defaultSettings, clock);
    state = engine.reduce(state, { type: "advance" }, host);
    for (let i = 0; i < 6; i++)
      state = engine.reduce(state, { type: "message", target: "b", text: `hello ${i}` }, actor("a"));
    expect(state.private.b.messages).toHaveLength(6);
    expect(state.private.c.messages).toHaveLength(0);
    expect(JSON.stringify(state.public)).not.toContain("hello");
    expect(() => engine.reduce(state, { type: "message", target: "b", text: "extra" }, actor("a"))).toThrow();
  });
  it("accepts three through eight rounds and clamps invalid settings", () => {
    for (let rounds = 3; rounds <= 8; rounds++) expect(engine.parseSettings({ rounds }).rounds).toBe(rounds);
    expect(engine.parseSettings({ rounds: 1 }).rounds).toBe(3);
    expect(engine.parseSettings({ rounds: 20 }).rounds).toBe(8);
  });
  it("allows a Serial Flirt twelve messages", () => {
    let state = engine.init(players, defaultSettings, clock);
    state.private.a.role = "Serial Flirt";
    state = engine.reduce(state, { type: "advance" }, host);
    for (let i = 0; i < 12; i++)
      state = engine.reduce(state, { type: "message", target: "b", text: "hello" }, actor("a"));
    expect(() => engine.reduce(state, { type: "message", target: "b", text: "extra" }, actor("a"))).toThrow();
  });
  it("resolves mutual dates, simultaneous vampire transfers and rejection bonuses", () => {
    let state = engine.init(players, defaultSettings, clock);
    state.private.a.role = "Vampire";
    state.private.b.role = "Vampire";
    state.private.c.role = "Ghost";
    state = engine.reduce(state, { type: "advance" }, host);
    state = engine.reduce(state, { type: "advance" }, host);
    for (const [id, target] of [
      ["a", "b"],
      ["b", "a"],
      ["c", "a"],
    ])
      state = engine.reduce(state, { type: "choose", target }, actor(id));
    state = engine.reduce(state, { type: "advance" }, host);
    expect(state.public.scores).toEqual({ a: 100, b: 100, c: 100, d: 0 });
    expect(state.public.matches).toEqual([["a", "b"]]);
  });
  it("rejects late actions and advances expired phases", () => {
    const state = engine.init(players, defaultSettings, clock);
    expect(() => engine.reduce(state, { type: "ready" }, { ...actor("a"), now: 31000 })).toThrow();
    expect(engine.tick!(state, { ...clock, now: 31000 }).public.phase).toBe("texting");
  });
  it("reveals each current-round message once and every date choice after dating", () => {
    let state = engine.init(players, defaultSettings, clock);
    state = engine.reduce(state, { type: "advance" }, host);
    state = engine.reduce(state, { type: "message", target: "b", text: "Meet me" }, actor("a"));
    expect(state.public.reveal).toBeNull();
    state = engine.reduce(state, { type: "advance" }, host);
    state = engine.reduce(state, { type: "choose", target: "b" }, actor("a"));
    state = engine.reduce(state, { type: "lock" }, actor("a"));
    state = engine.reduce(state, { type: "advance" }, host);
    expect(state.public.reveal?.messages).toHaveLength(1);
    expect(state.public.reveal?.choices).toEqual({ a: "b", b: null, c: null, d: null });
    expect(state.public.reveal?.order[0]).toBe("a");
    expect(state.public.deadline).toBe(1000 + (1 + 4) * 5000 + 12000);
    state = engine.reduce(state, { type: "advance" }, host);
    expect(state.public.reveal).toBeNull();
    expect(state.private.a.messages).toHaveLength(0);
    expect(state.private.b.messages).toHaveLength(0);
  });
});
