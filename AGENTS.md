# LarpParty

A browser-based party game platform in the style of Jackbox. One device (the Host screen) creates a game and shows a room code. Everyone else joins on their phone with that code and a nickname. No accounts, no app install.

This file is the source of truth for how we build. Agents and humans both follow it. When a decision changes, update this file in the same PR.

## Team and ownership

Three people, each working with their own coding agent.

| Person  | Role                          | Owns                                                                                                 |
| ------- | ----------------------------- | ---------------------------------------------------------------------------------------------------- |
| Rithvik | Infrastructure engineer       | `src/platform/`, `src/app/` routing shell, `supabase/`, Vercel config, CI, the game plug-in contract  |
| Dash    | Game and website engineer     | Individual games under `src/games/`, game UI, home page cards                                        |
| Ojas    | Game and website engineer     | Individual games under `src/games/`, game UI, home page cards                                        |

Rule of thumb: game engineers should be able to ship a new game without touching anything outside `src/games/<slug>/` plus one line in the game registry. If they need a platform change, they open an issue or PR against `src/platform/` and Rithvik reviews it.

## Tech stack

| Layer        | Choice                                         | Why                                                                                          |
| ------------ | ---------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Framework    | Next.js (App Router), TypeScript strict        | Vercel-native, server actions give us a free authoritative backend                            |
| Styling      | Tailwind CSS                                   | Fast iteration, consistent spacing/type scale, easy Apple-style minimalism                    |
| Database     | Supabase Postgres                              | Free tier, SQL we can learn, Realtime built in                                               |
| Realtime     | Supabase Realtime (Postgres Changes first)     | Browsers hold the WebSocket to Supabase, not Vercel. See Architecture.                        |
| Identity     | Supabase anonymous auth + nickname             | Gives each device a stable user id so Row Level Security can hide private state               |
| Hosting      | Vercel Hobby                                   | Free, preview deploy per PR                                                                   |
| Tests        | Vitest for game engines, Playwright later      | Game logic is pure functions and is the thing worth testing                                   |
| Package mgr  | pnpm                                           |                                                                                               |

Everything must run on free tiers. Known free-tier constraints:

- Supabase free projects pause after 7 days with no activity. Someone unpauses from the dashboard before a party. We may add a weekly keep-alive later.
- Supabase Realtime free tier: roughly 200 concurrent connections and 2M messages per month. Plenty for a room of 15 phones.
- Vercel Hobby serverless functions cannot hold long-lived connections. We never need them to, because Realtime connections terminate at Supabase.

## Architecture

### The one idea to understand

The server is the only thing allowed to change game state. Phones and the Host screen send intents ("I vote for Dash", "I tap RED"). A Next.js server action validates the intent, runs the game's reducer, and writes the new state to Postgres. Supabase Realtime pushes the changed rows to every subscribed device. Clients render whatever state they receive. They never compute game outcomes locally.

```
phone / host screen
   │  intent (server action call over HTTPS)
   ▼
Next.js server action on Vercel
   │  load room + players, run game reducer, validate
   ▼
Supabase Postgres  ──► write-ahead log ──► Supabase Realtime server
                                                   │  WebSocket push
                                                   ▼
                                    every device subscribed to that room
```

Why this shape:

- Hidden information stays hidden. Roles live in a per-player private row protected by Row Level Security, so a Werewolf's phone cannot read the Seer's role.
- Cheating is hard. The client can ask to kill someone, but the reducer decides whether that player is allowed to.
- Reconnect is free. State is in the database, so a refreshed phone just resubscribes and re-renders.
- Timing games work. The server action stamps `now()` when the intent arrives, so Shy Guy Says compares server times, not phone clocks.

### Supabase Realtime, from first principles

Postgres writes every change to a write-ahead log before committing. Supabase runs a separate Realtime server that reads that log through logical replication and forwards change events to browsers over WebSockets. Three primitives:

- **Postgres Changes**: subscribe to inserts/updates/deletes on a table, filtered by column (for example `room_id=eq.<id>`). Respects RLS, so each subscriber only sees rows it is allowed to read. This is what we use first.
- **Broadcast**: ephemeral pub/sub messages between clients on a channel. Nothing is stored. Useful later for cursor-style or high-frequency signals.
- **Presence**: who is currently connected to a channel. Useful for the lobby's "connected" dot.

We start with Postgres Changes because the database is already our source of truth and it requires no extra moving parts. If a game ever needs more than a few updates per second per room, switch that game to Broadcast sent from the server action.

### Data model

The real schema is `supabase/migrations/20261108000001_init.sql`.

- **rooms**: id, 4-letter code (unique among non-closed rooms), game slug, status (lobby / playing / finished / closed), settings JSON, public state JSON, `version` (optimistic concurrency), host player id, created/updated at.
- **players**: id, room id, auth user id, nickname (unique per room, case-insensitive), is host, connected, joined at. The Host screen has a player row with `is_host = true` so it can read the room; engines never see it.
- **player_private**: player id, room id, auth user id, state JSON. Private state is a separate table, not a column on players, because RLS filters rows, not columns.
- Later, if needed: **actions** log table for replay and debugging.

Public state is everything every device may see (phase, alive list, timer end time, vote tallies). Private state is what only that player may see (role, secret prompt). RLS: room members read the room row and all player rows; a player reads only their own `player_private` row. Browsers have no write grants at all; server actions write with the service-role key.

Writes go through the `apply_room_state` Postgres function, which updates the room and every private row in one transaction, guarded by the expected `version`. On a version conflict the server action reloads and retries. Rooms untouched for 12 hours are closed when the next room is created, which frees their codes.

### Timers on serverless

Vercel functions can't run background timers. Engines put a deadline in public state and expose it through `engine.deadline()`. Once that time passes on a device (using a skew-corrected server clock), the device calls the `tickRoom` server action, and the server checks its own clock before calling `engine.tick()`. The Host screen nudges first, and phones are a fallback a couple of seconds later. Duplicate ticks are harmless.

### Realtime on the client

`src/platform/useRoom.ts` subscribes to Postgres Changes on `rooms`, `players` and `player_private` for the room, and treats every event as "refetch the room". It also refetches on reconnect, on tab focus, and every 6 seconds as a safety net. That is simpler than merging partial payloads and survives phones sleeping.

### Identity and joining

No login. On first visit the client signs in anonymously with Supabase, which yields a stable user id persisted in the browser. Players type a nickname when joining a room.

Do not key identity on IP address. Everyone at a party is on the same Wi-Fi and shares one public IP, so every phone would collide.

### Routes

```
/                      home: cards for every registered game
/[game]                game landing: Create game or Join with code
/[game]/[code]         the room. Renders HostView if this device created it, else PlayerView
```

Deciding how `rithvik.si/larpparty` reaches Vercel is open. Preferred: a subdomain (`larpparty.rithvik.si`) pointed at Vercel by DNS, which avoids Next.js `basePath` and keeps QR join URLs short. Fall back to `basePath` only if the root domain must stay on Hostinger.

### Game plug-in contract

Every game is a folder under `src/games/<slug>/` that exports one manifest object and is registered in `src/games/index.ts`. The platform knows nothing about any specific game beyond this contract.

```ts
// Summary. The real type lives in src/platform/game-contract.ts.
interface GameManifest<Settings, PublicState, PrivateState, Intent> {
  slug: string;                       // "boilermafia"
  name: string;                       // "BoilerMafia"
  description: string;                // shown on the home card
  minPlayers: number;                 // hard limits; settings may narrow them
  maxPlayers: number;
  defaultSettings: Settings;
  playerLimits(settings): { min; max };
  SettingsForm: ComponentType<{ value; onChange }>;   // shown to the host at creation
  HostView: ComponentType<GameViewProps>;             // the big screen
  PlayerView: ComponentType<GameViewProps>;           // each phone
  engine: {
    parseSettings(raw: unknown): Settings;            // sanitize untrusted input from the browser
    validateStart(playerCount, settings): string | null;
    parseIntent(raw: unknown): Intent;                // throws IllegalIntentError if malformed
    init(players, settings, ctx): { public; private: Record<playerId, PrivateState> };
    reduce(state, intent, ctx): newState;   // pure, deterministic, server-only, throws IllegalIntentError
    tick?(state, ctx): newState;            // timer advancement; return the same object if nothing changes
    deadline?(public): number | null;       // when the next tick is due
    isOver(public): boolean;                // room moves to "finished"
  };
}
// ctx = { now, random } (+ actorId, actorIsHost for reduce). Engines never read clocks or Math.random directly.
// GameViewProps = { roomCode, players, me, publicState, privateState, dispatch, serverNow, playAgain? }
```

Rules for a game folder:

- `engine.ts` is pure TypeScript with no React and no Supabase imports. It is the part we test.
- Views receive state and a `dispatch(intent)` function from platform hooks. They never call Supabase directly.
- Each game has a `SPEC.md` written before code (see Engineering standards).
- A game folder may contain anything else it needs: assets, narration scripts, sub-components.

### Repo layout

```
src/
  app/                  Next.js routes. Thin. Owned by Rithvik.
  platform/             Room lifecycle, join flow, realtime hooks, server actions, game contract, supabase client. Owned by Rithvik.
  games/
    index.ts            Registry: the only file game engineers edit outside their folder.
    boilermafia/
      SPEC.md
      manifest.ts
      engine.ts
      engine.test.ts
      HostView.tsx
      PlayerView.tsx
      SettingsForm.tsx
  components/           Shared design-system primitives (Button, Card, Timer). Anyone may add; keep them generic.
supabase/
  migrations/           SQL migrations, numbered. Written by Rithvik.
  seed.sql
```

## Engineering standards

Principles we actually follow: separation of concerns, spec-driven development, test-driven development for game logic, and a design that would scale if it had to. We are not chasing 100% coverage. Functionality first.

- **TypeScript strict** everywhere. No `any` without a comment explaining why.
- **Spec before code.** Every game starts with `SPEC.md`: phases, roles, intents, win conditions, settings, and edge cases (disconnects, ties, min players). The agent should refuse to write an engine without one.
- **TDD for engines only.** Write the failing engine test, then make it pass. UI components do not need unit tests. Playwright end-to-end tests for the join flow come after the MVP.
- **Lint and format** with ESLint and Prettier on save and in CI.
- **Branches and PRs.** Branch from `main`, open a PR, at least one teammate reviews, Vercel preview deploy must build. Squash merge.
- **Commit messages** are short imperative sentences, optionally prefixed with the area: `platform:`, `boilermafia:`, `repo:`.
- **Secrets** live in `.env.local` and Vercel project settings, never in git. The Supabase service role key is server-only.
- **Design** is minimal and Apple-leaning: generous whitespace, one accent color, system font stack, large touch targets on phone views, subtle motion.

## Learning contract between humans and agents

The team's goal is to come out of this technically strong and employable, not just to have a working site. The agent is a pair programmer, not a vending machine.

**Humans write the code that does the heavy lifting or defines structure.** Examples:

- Database migrations and RLS policies
- The game contract type and the game registry
- Route structure in `src/app/`
- Server actions that validate and dispatch intents
- Each game's engine state machine (the `reduce` function skeleton and phase transitions)
- Anything the human says they want to write

**Agents write the code that is tedious or peripheral.** Examples:

- UI components and styling
- Test scaffolding and fixtures once the human has written the first test
- Validation helpers, formatters, utilities
- Animations
- Configuration boilerplate

**Protocol when an agent reaches human-owned code:**

1. Stop before writing it.
2. Give a brief: what the file is for, its inputs and outputs, how it connects to neighbors, and the two or three concepts the human needs. Link one or two short, high-quality resources (official docs preferred).
3. Offer to review once the human has a draft.
4. If the human replies "AI override", write it, then explain what you wrote and why in a few sentences.

**Agents also:**

- Explain non-obvious choices in plain language as they go.
- Prefer boring, readable code over clever code.
- Keep this file updated when a decision changes.

## Dev phases

### Phase 1: MVP

Done when all of the following are true on the deployed URL:

1. Home page shows a card for BoilerMafia.
2. Clicking it offers Create game or Join with code.
3. Create game asks for settings (min/max players, role counts, timers), then shows a room code and a QR code on the Host screen.
4. Phones join with the code and a nickname and appear in the lobby in real time.
5. Host starts the game. Roles are assigned randomly and shown privately on each phone.
6. Scripted narration advances on the Host screen ("It was a dark night in the forest...").
7. Night actions (kill, heal, investigate) are taken on phones by the roles that have them.
8. Day voting round on phones, result on the Host screen.
9. Cycle repeats until a win condition is met and the Host screen shows the winner.
10. A refreshed phone rejoins the same room in the same state.

### Phase 2: The website becomes the game

Two classes of games: fun games picked directly from the home page, and a tournament mode that randomly selects a subset of simpler games and chains them with a running leaderboard. Add richer animation and a persistent party session across games. Design details to be specified when Phase 1 ships.

## Games

### 1. BoilerMafia (Phase 1)

Online Werewolf with a scripted narrator.

- Host creates the lobby and chooses role counts, min/max players, and phase timers.
- Players join by code, get a random role privately on their phone.
- Night: narrator script plays on the Host screen; roles with actions act on their phones (Werewolf kills, Doctor heals, Seer investigates).
- Day: narrator announces results; everyone votes on their phone; the most-voted player is eliminated.
- Repeat until villagers or werewolves win.

### 2. Monster Seeking Match

Secret-dating social deduction over 4 to 5 in-game days.

- Each player gets a hidden monster identity with its own win condition and power (Vampire, Werewolf, Ghost, Serial Flirt).
- Texting phase: 90-second timer. Standard players send up to 3 private DMs; Serial Flirt sends up to 6.
- Date night: each phone shows a wheel of alive players; tap one to ask out.
- Scoring: mutual match gives both +100. Vampire steals 50% of their date's round points on a match. Werewolf scores 3x on odd rounds and 0 on even rounds. Ghost earns +100 when rejected.
- Host screen shows a live leaderboard across rounds.

### 3. Signal Faker

Physical gesture game inspired by Fakin' It. One hidden impostor gets a different prompt.

- Everyone receives a prompt privately. Humans get the real one; the impostor gets a generic safe one.
- Categories: hand gesture ("Raise your hand if you have failed a driving test"), number count ("Hold up fingers for how many siblings you have"), point out ("Point at the person who takes longest to reply to texts").
- Host screen runs a 3-2-1 audio countdown; everyone acts simultaneously in real life.
- If a phone disconnects during the countdown, that player's avatar shows a neutral pose so they do not out the impostor.
- 30-second debate, then everyone votes on their phone. Most votes is unmasked.

### 4. Push the Button

Rapid rating or doodle prompts where one hidden Alien receives a subtly different prompt.

- Humans: "Rate how delicious raw broccoli is, 1 to 10." Alien: "Rate how delicious chocolate fudge cake is, 1 to 10."
- 20-second submission on phones.
- Host screen displays all answers in a grid.
- Any player can slam the on-screen Push the Button trigger to pause and accuse. Correct accusation: humans win. Wrong: the Alien wins.

### 5. Shy Guy Says

Reaction elimination inspired by Mario Party.

- Host screen shows an animated host with a RED and a WHITE flag, including fake-outs (raise halfway, pull back).
- Phones show two large buttons, RED and WHITE.
- Server records the time the correct flag locks. A tap is valid if it is the right color and arrives within 1200 ms of that time, measured on the server.
- Wrong color or too slow eliminates the player for the round. Rounds repeat until one champion remains.

## Open decisions

- DNS: subdomain pointed at Vercel versus `basePath` under `rithvik.si`.
- Whether the Host device is also a player. Decided for MVP: the Host is a narrator-only screen with an `is_host` player row. A manifest may opt into host-as-player later.
- Narration delivery: on-screen text for MVP. Text-to-speech is a Phase 2 candidate.
- Keep-alive strategy for the Supabase free-tier pause.
- Supabase project ownership. Rithvik's account is at the 2-active-free-project cap, so the `larpparty` project is owned by a teammate's account, with Rithvik invited as a member.
- Anonymous sign-in rate limit is per IP, and a whole party shares one IP. `supabase/config.toml` raises it to 200 an hour. Check the hosted project's Auth rate limits match.
