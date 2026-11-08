import { describe, expect, it } from "vitest";
import { defaultSettings, engine } from "./engine";
const players = ["a", "b", "c", "d"].map((id) => ({ id, nickname: id }));
const ctx = { now: 1000, random: () => 0 };
const host = { ...ctx, actorId: "host", actorIsHost: true };
const actor = (id: string) => ({ ...ctx, actorId: id, actorIsHost: false });
function voting() {
  let s = engine.init(players, defaultSettings, ctx);
  s = engine.reduce(s, { type: "advance" }, host);
  s = engine.reduce(s, { type: "advance" }, host);
  return engine.reduce(s, { type: "advance" }, host);
}
describe("Signal Faker", () => {
  it("privately assigns one Faker and matching human instructions", () => {
    const s = engine.init(players, defaultSettings, ctx);
    expect(Object.values(s.private).filter((p) => p.faker)).toHaveLength(1);
    expect(s.private.b.prompt).toBe(s.private.c.prompt);
    expect(s.private.a.prompt).not.toBe(s.private.b.prompt);
    expect(JSON.stringify(s.public)).not.toContain(s.private.a.prompt);
    expect(JSON.stringify(s.public)).not.toContain(s.private.b.prompt);
  });
  it("catches the Faker with a unique plurality and awards humans", () => {
    let s = voting();
    for (const id of ["b", "c", "d"]) s = engine.reduce(s, { type: "vote", target: "a" }, actor(id));
    expect(s.public.result).toBeNull();
    s = engine.reduce(s, { type: "advance" }, host);
    expect(s.public.result?.caught).toBe(true);
    expect(s.public.scores).toEqual({ a: 0, b: 100, c: 100, d: 100 });
    expect(s.public.result?.votes.b).toBe("a");
  });
  it("awards the Faker on a tied vote or no votes", () => {
    let s = voting();
    s = engine.reduce(s, { type: "vote", target: "a" }, actor("b"));
    s = engine.reduce(s, { type: "vote", target: "b" }, actor("a"));
    s = engine.reduce(s, { type: "advance" }, host);
    expect(s.public.result?.accused).toBeNull();
    expect(s.public.scores.a).toBe(150);
    expect(engine.reduce(voting(), { type: "advance" }, host).public.scores.a).toBe(150);
  });
  it("rejects invalid and late votes, and resolves after everyone locks", () => {
    let s = voting();
    expect(() => engine.reduce(s, { type: "vote", target: "b" }, actor("b"))).toThrow();
    expect(() => engine.reduce(s, { type: "vote", target: "a" }, { ...actor("b"), now: s.public.deadline! })).toThrow();
    for (const id of ["a", "b", "c", "d"]) {
      s = engine.reduce(s, { type: "vote", target: id === "a" ? "b" : "a" }, actor(id));
      s = engine.reduce(s, { type: "lock" }, actor(id));
    }
    expect(s.public.phase).toBe("results");
  });
  it("advances on deadline and starts a fresh round", () => {
    let s = engine.init(players, defaultSettings, ctx);
    expect(engine.tick!(s, { ...ctx, now: 25999 })).toBe(s);
    s = engine.tick!(s, { ...ctx, now: 26000 });
    expect(s.public.phase).toBe("perform");
    s = engine.reduce(s, { type: "advance" }, host);
    s = engine.reduce(s, { type: "advance" }, host);
    s = engine.reduce(s, { type: "advance" }, host);
    s = engine.reduce(s, { type: "advance" }, host);
    expect(s.public.phase).toBe("action");
    expect(s.public.round).toBe(2);
    expect(s.public.result).toBeNull();
  });
  it("rotates Faker assignments fairly even with repeated random values", () => {
    let s = engine.init(players, { rounds: 5 }, ctx);
    const seen = new Set<string>();
    for (let round = 0; round < 4; round++) {
      seen.add(players.find((p) => s.private[p.id].faker)!.id);
      for (let i = 0; i < 4; i++) s = engine.reduce(s, { type: "advance" }, host);
      s = engine.reduce(s, { type: "advance" }, host);
    }
    expect(seen.size).toBe(4);
  });
  it("keeps written answers private until the reveal", () => {
    let s = engine.init(players, { rounds: 5 }, { ...ctx, random: () => 0.999 });
    expect(s.public.category).toBe("words");
    s = engine.reduce(s, { type: "answer", text: "A library" }, actor("a"));
    expect(JSON.stringify(s.public)).not.toContain("A library");
    s = engine.reduce(s, { type: "advance" }, host);
    expect(s.public.responses.a).toBe("A library");
    expect(() => engine.reduce(s, { type: "answer", text: "late" }, actor("a"))).toThrow();
  });
});
