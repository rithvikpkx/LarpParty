import { IllegalIntentError, type GameEngine, type GameState } from "@/platform/game-contract";

type Role = "Vampire" | "Werewolf" | "Ghost" | "Serial Flirt";
type Phase = "reveal" | "texting" | "dating" | "results" | "over";
export type Settings = { rounds: number };
export type Message = { from: string; to: string; text: string; round: number };
export type PrivateState = { role: Role; messages: Message[]; sent: number; choice: string | null; locked: boolean };
export type PublicState = {
  phase: Phase;
  round: number;
  rounds: number;
  ids: string[];
  deadline: number | null;
  ready: string[];
  locked: string[];
  scores: Record<string, number>;
  gains: Record<string, number>;
  matches: [string, string][];
  roles: Record<string, Role>;
  reveal: { startedAt: number; messages: Message[]; choices: Record<string, string | null>; order: string[] } | null;
};
export type Intent =
  | { type: "ready" | "advance" | "lock" }
  | { type: "message"; target: string; text: string }
  | { type: "choose"; target: string };
type State = GameState<PublicState, PrivateState>;
export const defaultSettings: Settings = { rounds: 4 };

function next(s: State, now: number): State {
  const p = s.public;
  if (p.phase === "over") throw new IllegalIntentError("The game is over.");
  if (p.phase === "reveal") return { ...s, public: { ...p, phase: "texting", round: 1, deadline: now + 90000 } };
  if (p.phase === "texting") return { ...s, public: { ...p, phase: "dating", deadline: now + 30000 } };
  if (p.phase === "dating") {
    const gains: Record<string, number> = {};
    const matches: [string, string][] = [];
    for (const id of p.ids) {
      const me = s.private[id];
      const target = me.choice;
      const mutual = !!target && s.private[target]?.choice === id;
      let points = mutual ? 100 : 0;
      if (me.role === "Werewolf") points *= p.round % 2 ? 3 : 0;
      if (me.role === "Ghost" && target && !mutual) points += 100;
      gains[id] = points;
      if (mutual && target && id < target) matches.push([id, target]);
    }
    const base = { ...gains };
    for (const id of p.ids) {
      const target = s.private[id].choice;
      if (s.private[id].role === "Vampire" && target && s.private[target]?.choice === id) {
        const stolen = Math.floor(base[target] / 2);
        gains[id] += stolen;
        gains[target] -= stolen;
      }
    }
    const scores = Object.fromEntries(p.ids.map((id) => [id, p.scores[id] + gains[id]]));
    const messages = p.ids.flatMap((id) => s.private[id].messages.filter((m) => m.from === id && m.round === p.round));
    const choices = Object.fromEntries(p.ids.map((id) => [id, s.private[id].choice]));
    const order = [...p.locked, ...p.ids.filter((id) => !p.locked.includes(id))];
    const duration = Math.max(15000, (messages.length + order.length) * 5000 + 12000);
    return {
      ...s,
      public: {
        ...p,
        phase: "results",
        deadline: now + duration,
        gains,
        scores,
        matches,
        reveal: { startedAt: now, messages, choices, order },
      },
    };
  }
  if (p.round >= p.rounds)
    return {
      ...s,
      public: {
        ...p,
        phase: "over",
        deadline: null,
        roles: Object.fromEntries(p.ids.map((id) => [id, s.private[id].role])),
      },
    };
  return {
    public: { ...p, phase: "texting", round: p.round + 1, deadline: now + 90000, locked: [], reveal: null },
    private: Object.fromEntries(
      p.ids.map((id) => [id, { ...s.private[id], messages: [], sent: 0, choice: null, locked: false }]),
    ),
  };
}

export const engine: GameEngine<Settings, PublicState, PrivateState, Intent> = {
  parseSettings: (raw) => {
    const value = typeof raw === "object" && raw !== null && "rounds" in raw ? Number(raw.rounds) : NaN;
    return { rounds: Number.isFinite(value) ? Math.max(3, Math.min(8, Math.round(value))) : 4 };
  },
  validateStart: (count) => (count < 3 || count > 12 ? "This game needs 3–12 players." : null),
  parseIntent: (raw) => {
    if (!raw || typeof raw !== "object" || !("type" in raw)) throw new IllegalIntentError("Invalid action.");
    const r = raw as Record<string, unknown>;
    if (r.type === "ready" || r.type === "advance" || r.type === "lock") return { type: r.type };
    if (r.type === "choose" && typeof r.target === "string") return { type: "choose", target: r.target };
    if (r.type === "message" && typeof r.target === "string" && typeof r.text === "string")
      return { type: "message", target: r.target, text: r.text };
    throw new IllegalIntentError("Invalid action.");
  },
  init: (players, settings, ctx) => {
    const ids = players.map((p) => p.id);
    const roles: Role[] = ["Vampire", "Werewolf", "Ghost", "Serial Flirt"];
    const shuffled = [...ids];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(ctx.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return {
      public: {
        phase: "reveal",
        round: 0,
        rounds: settings.rounds,
        ids,
        deadline: ctx.now + 30000,
        ready: [],
        locked: [],
        scores: Object.fromEntries(ids.map((id) => [id, 0])),
        gains: {},
        matches: [],
        roles: {},
        reveal: null,
      },
      private: Object.fromEntries(
        shuffled.map((id, i) => [
          id,
          { role: roles[i % roles.length], messages: [], sent: 0, choice: null, locked: false },
        ]),
      ),
    };
  },
  reduce: (s, intent, ctx) => {
    if (intent.type === "advance") {
      if (!ctx.actorIsHost) throw new IllegalIntentError("Only the host can advance.");
      return next(s, ctx.now);
    }
    if (ctx.actorIsHost || !s.private[ctx.actorId]) throw new IllegalIntentError("You are not a player.");
    if (s.public.deadline !== null && ctx.now >= s.public.deadline)
      throw new IllegalIntentError("This phase has ended.");
    const id = ctx.actorId;
    const me = s.private[id];
    if (intent.type === "ready") {
      if (s.public.phase !== "reveal") throw new IllegalIntentError("The game has started.");
      const ready = [...new Set([...s.public.ready, id])];
      const updated = { ...s, public: { ...s.public, ready } };
      return ready.length === s.public.ids.length ? next(updated, ctx.now) : updated;
    }
    if (intent.type === "message") {
      const text = intent.text.trim();
      if (
        s.public.phase !== "texting" ||
        !s.private[intent.target] ||
        intent.target === id ||
        !text ||
        text.length > 200 ||
        me.sent >= (me.role === "Serial Flirt" ? 12 : 6)
      )
        throw new IllegalIntentError("Message cannot be sent.");
      const message = { from: id, to: intent.target, text, round: s.public.round };
      const recipient = s.private[intent.target];
      return {
        ...s,
        private: {
          ...s.private,
          [id]: { ...me, sent: me.sent + 1, messages: [...me.messages, message] },
          [intent.target]: { ...recipient, messages: [...recipient.messages, message] },
        },
      };
    }
    if (s.public.phase !== "dating") throw new IllegalIntentError("Dating is not open.");
    if (me.locked) throw new IllegalIntentError("Your choice is locked.");
    if (intent.type === "choose") {
      if (!s.private[intent.target] || intent.target === id) throw new IllegalIntentError("Choose another player.");
      return { ...s, private: { ...s.private, [id]: { ...me, choice: intent.target } } };
    }
    if (!me.choice) throw new IllegalIntentError("Choose a date first.");
    const locked = [...s.public.locked, id];
    const updated = { public: { ...s.public, locked }, private: { ...s.private, [id]: { ...me, locked: true } } };
    return locked.length === s.public.ids.length ? next(updated, ctx.now) : updated;
  },
  tick: (s, ctx) => (s.public.deadline !== null && ctx.now >= s.public.deadline ? next(s, ctx.now) : s),
  deadline: (p) => p.deadline,
  isOver: (p) => p.phase === "over",
};
