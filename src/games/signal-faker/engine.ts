import { IllegalIntentError, type EngineContext, type GameEngine, type GameState } from "@/platform/game-contract";

type Phase = "action" | "perform" | "discussion" | "vote" | "results" | "over";
export type Settings = { rounds: number };
export type PrivateState = {
  faker: boolean;
  prompt: string;
  vote: string | null;
  locked: boolean;
  response: string;
  turns: number;
};
export type PublicState = {
  phase: Phase;
  round: number;
  rounds: number;
  ids: string[];
  deadline: number | null;
  locked: string[];
  category: Category;
  usedCategories: Category[];
  responses: Record<string, string>;
  scores: Record<string, number>;
  result: {
    faker: string;
    accused: string | null;
    caught: boolean;
    votes: Record<string, string | null>;
    humanPrompt: string;
    fakerPrompt: string;
    gains: Record<string, number>;
  } | null;
};
export type Intent = { type: "advance" | "lock" } | { type: "vote"; target: string } | { type: "answer"; text: string };
type State = GameState<PublicState, PrivateState>;
type Category = "hands" | "numbers" | "pointing" | "faces" | "words";
type Prompt = { category: Category; human: string; faker: string };
const prompts: Prompt[] = [
  {
    category: "hands",
    human: "Raise your hand if you have ever missed an important alarm.",
    faker: "The question is about a morning mishap. Decide whether to raise your hand.",
  },
  {
    category: "hands",
    human: "Raise your hand if you have ever eaten dessert for breakfast.",
    faker: "The question is about an unusual meal. Decide whether to raise your hand.",
  },
  {
    category: "hands",
    human: "Raise your hand if you have ever waved back at someone who wasn't waving at you.",
    faker: "The question is about an awkward social moment. Decide whether to raise your hand.",
  },
  {
    category: "numbers",
    human: "Hold up the number of siblings you have, up to five.",
    faker: "The number is about someone's family. Hold up a number of fingers, up to five.",
  },
  {
    category: "numbers",
    human: "Hold up how many cups of water you've had today, up to five.",
    faker: "The number is about something people drink. Hold up a number of fingers, up to five.",
  },
  {
    category: "numbers",
    human: "Hold up how many pets you have, up to five.",
    faker: "The number is about animals at home. Hold up a number of fingers, up to five.",
  },
  {
    category: "pointing",
    human: "Point at the person most likely to forget their keys.",
    faker: "The group is choosing someone who can be absent-minded. Point at a player.",
  },
  {
    category: "pointing",
    human: "Point at the person most likely to survive a zombie movie.",
    faker: "The group is choosing someone who would handle a crisis well. Point at a player.",
  },
  {
    category: "pointing",
    human: "Point at the person who would be the best game show host.",
    faker: "The group is choosing someone entertaining in front of a crowd. Point at a player.",
  },
  {
    category: "faces",
    human: "Show the face you make when you see your favorite food.",
    faker: "The expression is about a pleasant surprise. Make a face that blends in.",
  },
  {
    category: "faces",
    human: "Show the face you make when you hear a terrible pun.",
    faker: "The expression is a reaction to a joke. Make a face that blends in.",
  },
  {
    category: "faces",
    human: "Show your face when you realize you forgot an assignment.",
    faker: "The expression is about realizing something went wrong. Make a face that blends in.",
  },
  {
    category: "words",
    human: "Name a place where you would like to spend a rainy afternoon.",
    faker: "The question is about a place to spend time indoors. Name a place.",
  },
  {
    category: "words",
    human: "Name a food you would bring to a picnic.",
    faker: "The question is about food for an outdoor gathering. Name a food.",
  },
  {
    category: "words",
    human: "Name something you might find in a backpack.",
    faker: "The question is about an item people carry around. Name an item.",
  },
];
export const defaultSettings: Settings = { rounds: 3 };

function begin(s: State, ctx: EngineContext): State {
  const minimum = Math.min(...s.public.ids.map((id) => s.private[id]?.turns ?? 0));
  const eligible = s.public.ids.filter((id) => (s.private[id]?.turns ?? 0) === minimum);
  const faker = eligible[Math.floor(ctx.random() * eligible.length)];
  const available = prompts.filter((p) => !(s.public.usedCategories ?? []).includes(p.category));
  const pool = available.length ? available : prompts;
  const prompt = pool[Math.floor(ctx.random() * pool.length)];
  return {
    public: {
      ...s.public,
      phase: "action",
      round: s.public.round + 1,
      deadline: ctx.now + (prompt.category === "words" ? 45000 : 25000),
      locked: [],
      category: prompt.category,
      usedCategories: [...(available.length ? (s.public.usedCategories ?? []) : []), prompt.category],
      responses: {},
      result: null,
    },
    private: Object.fromEntries(
      s.public.ids.map((id) => [
        id,
        {
          faker: id === faker,
          prompt: id === faker ? prompt.faker : prompt.human,
          vote: null,
          locked: false,
          response: "",
          turns: (s.private[id]?.turns ?? 0) + (id === faker ? 1 : 0),
        },
      ]),
    ),
  };
}
function advance(s: State, ctx: EngineContext): State {
  const p = s.public;
  if (p.phase === "action")
    return {
      ...s,
      public: {
        ...p,
        phase: "perform",
        deadline: ctx.now + (p.category === "words" ? 12000 : 5000),
        responses: p.category === "words" ? Object.fromEntries(p.ids.map((id) => [id, s.private[id].response])) : {},
      },
    };
  if (p.phase === "perform") return { ...s, public: { ...p, phase: "discussion", deadline: ctx.now + 35000 } };
  if (p.phase === "discussion") return { ...s, public: { ...p, phase: "vote", deadline: ctx.now + 30000 } };
  if (p.phase === "vote") {
    const faker = p.ids.find((id) => s.private[id].faker)!;
    const votes = Object.fromEntries(p.ids.map((id) => [id, s.private[id].vote]));
    const counts: Record<string, number> = {};
    for (const vote of Object.values(votes)) if (vote) counts[vote] = (counts[vote] ?? 0) + 1;
    const max = Math.max(0, ...Object.values(counts));
    const leaders = Object.keys(counts).filter((id) => counts[id] === max);
    const accused = leaders.length === 1 ? leaders[0] : null;
    const caught = accused === faker;
    const gains = Object.fromEntries(
      p.ids.map((id) => [id, caught ? (id === faker ? 0 : 100) : id === faker ? 150 : 0]),
    );
    const scores = Object.fromEntries(p.ids.map((id) => [id, p.scores[id] + gains[id]]));
    const human = p.ids.find((id) => id !== faker)!;
    return {
      ...s,
      public: {
        ...p,
        phase: "results",
        deadline: ctx.now + 25000,
        scores,
        result: {
          faker,
          accused,
          caught,
          votes,
          humanPrompt: s.private[human].prompt,
          fakerPrompt: s.private[faker].prompt,
          gains,
        },
      },
    };
  }
  if (p.phase === "results")
    return p.round >= p.rounds ? { ...s, public: { ...p, phase: "over", deadline: null } } : begin(s, ctx);
  throw new IllegalIntentError("The game is over.");
}
export const engine: GameEngine<Settings, PublicState, PrivateState, Intent> = {
  parseSettings: (raw) => {
    const n = typeof raw === "object" && raw !== null && "rounds" in raw ? Number(raw.rounds) : NaN;
    return { rounds: Number.isFinite(n) ? Math.min(5, Math.max(3, Math.round(n))) : 3 };
  },
  validateStart: (n) => (n < 3 || n > 12 ? "Signal Faker needs 3–12 players." : null),
  parseIntent: (raw) => {
    if (typeof raw !== "object" || raw === null || !("type" in raw)) throw new IllegalIntentError("Invalid action.");
    const r = raw as Record<string, unknown>;
    if (r.type === "advance" || r.type === "lock") return { type: r.type };
    if (r.type === "vote" && typeof r.target === "string") return { type: "vote", target: r.target };
    if (r.type === "answer" && typeof r.text === "string") return { type: "answer", text: r.text };
    throw new IllegalIntentError("Invalid action.");
  },
  init: (players, settings, ctx) => {
    const ids = players.map((p) => p.id);
    return begin(
      {
        public: {
          phase: "action",
          round: 0,
          rounds: settings.rounds,
          ids,
          deadline: null,
          locked: [],
          category: "hands",
          usedCategories: [],
          responses: {},
          scores: Object.fromEntries(ids.map((id) => [id, 0])),
          result: null,
        },
        private: {},
      },
      ctx,
    );
  },
  reduce: (s, intent, ctx) => {
    if (intent.type === "advance") {
      if (!ctx.actorIsHost) throw new IllegalIntentError("Only the host can advance.");
      return advance(s, ctx);
    }
    const id = ctx.actorId;
    const me = s.private[id];
    if (ctx.actorIsHost || !me) throw new IllegalIntentError("You are not a player.");
    if (intent.type === "answer") {
      const text = intent.text.trim();
      if (
        s.public.phase !== "action" ||
        s.public.category !== "words" ||
        (s.public.deadline !== null && ctx.now >= s.public.deadline) ||
        !text ||
        text.length > 100
      )
        throw new IllegalIntentError("Answer must be 1–100 characters and submitted before time is up.");
      return { ...s, private: { ...s.private, [id]: { ...me, response: text } } };
    }
    if (s.public.phase !== "vote" || (s.public.deadline !== null && ctx.now >= s.public.deadline))
      throw new IllegalIntentError("Voting is closed.");
    if (me.locked) throw new IllegalIntentError("Your vote is locked.");
    if (intent.type === "vote") {
      if (intent.target === id || !s.private[intent.target]) throw new IllegalIntentError("Choose another player.");
      return { ...s, private: { ...s.private, [id]: { ...me, vote: intent.target } } };
    }
    if (!me.vote) throw new IllegalIntentError("Choose a suspect first.");
    const locked = [...s.public.locked, id];
    const updated: State = {
      public: { ...s.public, locked },
      private: { ...s.private, [id]: { ...me, locked: true } },
    };
    return locked.length === s.public.ids.length ? advance(updated, ctx) : updated;
  },
  tick: (s, ctx) => (s.public.deadline !== null && ctx.now >= s.public.deadline ? advance(s, ctx) : s),
  deadline: (p) => p.deadline,
  isOver: (p) => p.phase === "over",
};
