# LarpParty

A browser-based party game platform in the style of Jackbox. One device (the Host screen) creates a game and shows a room code. Everyone else joins on their phone with that code and a nickname. No accounts, no app install.

This file is the source of truth for how we build. Agents and humans both follow it. When a decision changes, update this file in the same PR.

## Team and ownership

Three people, each working with their own coding agent.

| Person  | Role                      | Owns                                                                                                 |
| ------- | ------------------------- | ---------------------------------------------------------------------------------------------------- |
| Rithvik | Infrastructure engineer   | `src/platform/`, `src/app/` routing shell, `supabase/`, Vercel config, CI, the game plug-in contract |
| Dash    | Game and website engineer | Individual games under `src/games/`, game UI, home page cards                                        |
| Ojas    | Game and website engineer | Individual games under `src/games/`, game UI, home page cards                                        |

Rule of thumb: game engineers should be able to ship a new game without touching anything outside `src/games/<slug>/` plus one line in the game registry. If they need a platform change, they open an issue or PR against `src/platform/` and Rithvik reviews it.

## Current state (read this first)

Last updated 2026-11-08. Keep this section current; it is how context survives between agent sessions.

**Live**

- Site: https://larpparty.rithvik.si (custom domain). Also https://larpparty.vercel.app.
- Games registered: BoilerMafia (Phase 1, complete), Monster Seeking Match and Signal Faker (Dash's, in progress). Shy Guy Says is design-only.
- UI: 18 switchable styles (see "UI styles"). Default for new devices: Black & Gold.

**History**

- PR #1: Phase 1 MVP. The platform and BoilerMafia were agent-written under an "AI override" from Rithvik, including the human-owned pieces (migrations, RLS, contract, server actions, engine). Humans should still read and own them.
- PR #2: `.vercelignore` excludes docs, `supabase/`, tests and `/e2e/` from deploys. The required-review rule was dropped.
- PR #3: the 18 UI styles. The style mockups came from the "LarpParty Style Lab" artifact.

**Infrastructure**

| Thing        | Where                                                                                                                                                                                                                                                                                        |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Git          | https://github.com/rithvikpkx/LarpParty. `main` auto-deploys to production through the Vercel GitHub integration. Every pushed branch gets a preview deploy. Previews are behind Vercel login (Deployment Protection), so phones need a Vercel login or a shareable link from the dashboard. |
| Vercel       | Project `larpparty`, team `rithvikpkx-7614s-projects` (Hobby). Env vars for Production and Preview: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`.                                                                                               |
| Domain       | `rithvik.si` DNS lives at Hostinger (nameservers `*.dns-parking.com`). `larpparty.rithvik.si` is a CNAME to `f6081776e4fb0ebd.vercel-dns-017.com`. The root `rithvik.si` stays on Hostinger.                                                                                                 |
| Supabase     | Project ref `zitumyodkyfbtlwcjmqp` (owned by a teammate's account because Rithvik's account is at the 2-free-project cap). Anonymous sign-ins are enabled in its dashboard. Free tier: it pauses after 7 days idle; unpause it from the dashboard before a party.                            |
| Prod secrets | On Rithvik's laptop only: `~/larpparty-prod.env` (URL, publishable key, secret key, `SUPABASE_DB_URL`). Never commit it.                                                                                                                                                                     |

**Runbook**

- **Local dev:** start Docker, then `supabase start -x studio,imgproxy,storage-api,edge-runtime,logflare,vector,mailpit,postgres-meta,supavisor`. `.env.local` points at `http://127.0.0.1:54321` with the local keys from `supabase status -o env`. Then `pnpm dev`, or `pnpm build && pnpm start` for prod-like testing.
- **New migration:** add `supabase/migrations/<timestamp>_name.sql`. Locally run `supabase migration up`. For prod, run `set -a && . ~/larpparty-prod.env && set +a && supabase db push --db-url "$SUPABASE_DB_URL"`. Apply additive migrations to prod _before_ merging code that needs them; preview deploys share the prod database.
- **Checks before a PR:** `pnpm test`, `pnpm lint`, `pnpm typecheck`, `pnpm build`.
- **End-to-end tests:** these are Playwright scripts in `e2e/`. They aren't part of `pnpm test` and need `npm i playwright` in some scratch folder.
  - `game.mjs`: a host plus 6 phones play a full BoilerMafia game. It checks RLS privacy, refresh/rejoin, voting, the winner and play again. Run it as `BASE=<site> SUPABASE_URL=<url> ANON_KEY=<publishable key> node e2e/game.mjs`.
  - `themes.mjs`: screenshots every style on every screen, and checks that the host's style reaches phones live and that a phone's override sticks.
  - `perf.mjs`: measures FPS and style-switch cost at 4× CPU throttle.
  - Each run creates about 10 anonymous users, and Supabase rate-limits anonymous sign-ins per IP.
- **Deploy:** merge to `main`. To check production, curl the site, then run `e2e/game.mjs` against `https://larpparty.rithvik.si`.

**Gotchas we hit**

- The CLIs (`pnpm` 10, `vercel`) are installed under `~/.nvm/versions/node/v24.22.2/bin`, which may not be on an agent shell's PATH. The shell is zsh: use `${(P)name}`, not `${!name}`.
- `vercel link` / `vercel env pull` rewrites `.env.local` and once blanked `NEXT_PUBLIC_SUPABASE_URL`. If the browser says "Missing NEXT_PUBLIC_SUPABASE_URL", check that file and rebuild. `NEXT_PUBLIC_*` values are inlined at build time.
- `prettier-plugin-tailwindcss` trims leading spaces inside className string literals, so `` `stage${dark ? " is-night" : ""}` `` became `stageis-night`. Build class lists with full strings (`dark ? "stage is-night" : "stage"`) or `[...].filter(Boolean).join(" ")`.
- TypeScript is pinned to 5.x; TS 7 is native and breaks the Next build. pnpm must stay on 10, because Vercel's lockfile support lags newer versions.
- Don't pipe `pnpm build` into `head`: the pipe closing kills the build halfway.
- A `.vercelignore` pattern without a leading slash matches at any depth. `supabase/` once excluded `src/platform/supabase/`; that's why it is `/supabase/`.
- `[data-style]` CSS tokens that use `var(--u)` must be declared on `.scr`, not on the html-level style block, because `--u` is only defined on screens.

## Tech stack

| Layer       | Choice                                                | Why                                                                             |
| ----------- | ----------------------------------------------------- | ------------------------------------------------------------------------------- |
| Framework   | Next.js (App Router), TypeScript strict               | Vercel-native, server actions give us a free authoritative backend              |
| Styling     | Tailwind CSS                                          | Fast iteration, consistent spacing/type scale, easy Apple-style minimalism      |
| Database    | Supabase Postgres                                     | Free tier, SQL we can learn, Realtime built in                                  |
| Realtime    | Supabase Realtime (Postgres Changes first)            | Browsers hold the WebSocket to Supabase, not Vercel. See Architecture.          |
| Identity    | Supabase anonymous auth + nickname                    | Gives each device a stable user id so Row Level Security can hide private state |
| Hosting     | Vercel Hobby                                          | Free, preview deploy per PR                                                     |
| Tests       | Vitest for game engines; Playwright scripts in `e2e/` | Game logic is pure functions; e2e scripts drive real host + phone browsers      |
| Package mgr | pnpm                                                  |                                                                                 |

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

The site is served at `larpparty.rithvik.si` (a CNAME to Vercel), so there is no Next.js `basePath`. QR join links use `window.location.origin`, so they follow whichever domain the host screen is on. Serving at `rithvik.si/larpparty` instead would need `basePath`, prefixed `/art/` image URLs, and a proxy (for example a Cloudflare Worker) in front of Hostinger. We decided against it.

### Game plug-in contract

Every game is a folder under `src/games/<slug>/` that exports one manifest object and is registered in `src/games/index.ts`. The platform knows nothing about any specific game beyond this contract.

```ts
// Summary. The real type lives in src/platform/game-contract.ts.
interface GameManifest<Settings, PublicState, PrivateState, Intent> {
  slug: string; // "boilermafia"
  name: string; // "BoilerMafia"
  description: string; // shown on the home card
  minPlayers: number; // hard limits; settings may narrow them
  maxPlayers: number;
  defaultSettings: Settings;
  playerLimits(settings): { min; max };
  SettingsForm: ComponentType<{ value; onChange }>; // shown to the host at creation
  HostView: ComponentType<GameViewProps>; // the big screen
  PlayerView: ComponentType<GameViewProps>; // each phone
  engine: {
    parseSettings(raw: unknown): Settings; // sanitize untrusted input from the browser
    validateStart(playerCount, settings): string | null;
    parseIntent(raw: unknown): Intent; // throws IllegalIntentError if malformed
    init(players, settings, ctx): { public; private: Record<playerId, PrivateState> };
    reduce(state, intent, ctx): newState; // pure, deterministic, server-only, throws IllegalIntentError
    tick?(state, ctx): newState; // timer advancement; return the same object if nothing changes
    deadline?(public): number | null; // when the next tick is due
    isOver(public): boolean; // room moves to "finished"
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
- **Views must be built from `@/components/ui` and the theme classes, never hard-coded colours.** See UI styles below. A view with `bg-indigo-950` or `text-white` won't change when the user picks a style.

### UI styles (themes)

The site has 18 switchable styles (Liquid Glass, Comic Pop, Neo-Brutalist, Tide Pool, Claymation, ASCII Terminal, Desktop 98, Neon Arcade, Pixel Retro, Paper Sketch, Sakura, Noir, Storybook, The Daily Village, Game Show, Tabletop, Blueprint, Black & Gold). The interactive mockup they came from is the "LarpParty Style Lab" artifact.

How it works:

- `<html data-style="...">` picks the style. An inline script in `src/app/layout.tsx` sets it before first paint, from localStorage, so there is no flash.
- `src/themes/themes.css` holds the screen system plus one token block per style. Components only read tokens (`--bg --fg --muted --panel --line --accent --accent-fg --field --r --shadow --font-d --font-b ...`) through shared classes: `.scr .col .panel .btn .chip .pick .tile .eyebrow .disp .art .timer .narr .room-code .code-boxes .field .notice`.
- `src/themes/registry.ts` lists the styles and the Google Fonts each needs. Only the active style's fonts are downloaded.
- `src/themes/store.ts` decides the active style: the host's pick for the room (`rooms.theme`, set with the `setRoomTheme` server action) is what the TV shows and what phones follow by default. A phone can pick its own from the style picker and later tap "Match the host". Outside rooms, each device uses its own last pick. Default: Black & Gold.
- Screens wrap content in `<Screen kind="tv|phone|page">`. TV screens are designed at 1280×720 and scale to fit; phones at 390 wide. Sizes use `calc(var(--u) * N)` where N is design pixels.
- Add `is-night` to a screen's className for the dark palette (night phases); every style defines one.
- Art comes from `<Art name="wolf" />`, which shows a Fluent Emoji image, a pixel sprite (Pixel Retro, Desktop 98) or ASCII art (Terminal) depending on the style. New art: add `public/art/<name>.webp` (192px), `public/art/pixel/<name>.png` (24px) and an ASCII entry in `src/themes/ascii.ts`.

Performance rules for styles: animate only `transform` and `opacity`; no Lottie on phones; per-screen decorations are cheap static CSS; `html.lite` (the "Reduce effects" toggle, or devices with ≤2GB memory) turns off moving decorations and blur. Liquid Glass refraction runs only on the host TV in Chromium.

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
  components/ui/        Themed primitives: Screen, Panel, Button, PickList, Timer, Narration, Art, CodeInput, Stepper, StylePicker.
  themes/               Style registry, themes.css, the style store, ASCII art.
supabase/
  migrations/           SQL migrations, numbered. Written by Rithvik.
  seed.sql
```

## Engineering standards

Principles we actually follow: separation of concerns, spec-driven development, test-driven development for game logic, and a design that would scale if it had to. We are not chasing 100% coverage. Functionality first.

- **TypeScript strict** everywhere. No `any` without a comment explaining why.
- **Spec before code.** Every game starts with `SPEC.md`: phases, roles, intents, win conditions, settings, and edge cases (disconnects, ties, min players). The agent should refuse to write an engine without one.
- **TDD for engines only.** Write the failing engine test, then make it pass. UI components do not need unit tests. Run `e2e/game.mjs` before merging platform or BoilerMafia changes.
- **Lint and format** with ESLint and Prettier on save and in CI.
- **Branches and PRs.** Branch from `main`, open a PR, Vercel preview deploy must build. Squash merge.
- **Commit messages** are short imperative sentences, optionally prefixed with the area: `platform:`, `boilermafia:`, `repo:`.
- **Secrets** live in `.env.local` and Vercel project settings, never in git. The Supabase service role key is server-only.
- **Design**: users choose one of 18 styles (see UI styles). Whatever the style: large touch targets (44px+) on phone views, motion only on transform and opacity, readable contrast in both day and night palettes.

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

6. New Party Game: "Babel Wire" (The Multi-Language Telephone Game) Vibe: Absurd mistranslation chaos, global telephone, and language degradation. The Hook: A classic telephone game where every time a message passes from one player to the next, the server automatically runs it through a randomized translation chain (e.g., English
   → Swahili
   → Japanese
   → Portuguese
   → English), mutating the sentence into absolute nonsense by the end. Step-by-Step Scenario & Flow: Secret Prompt Phase: Every player types a normal, innocent sentence or phrase on their phone (e.g., "I need to rush to class across campus before it starts raining"). The Mutation Chain: Player A’s sentence is sent to the backend. The free translation API mutates it through 3 to 4 random international languages sequentially before translating it back into English. The Delivery: Player B receives the corrupted, hilarious result on their screen (e.g., "The mechanical sky is crying while I run to the metal box"). Drawing or Interpretation Phase: Player B must either draw what they think that sentence means or write a brand-new response. The Grand Reveal (End Goal): The main screen displays the original prompt side-by-side with the final mutated monstrosity and the hilarious timeline of how it degraded step-by-step. Points are awarded for the funniest mutations or for correctly guessing the original core intent.

7. Hot Potato Bomb (Inspired by Mario Party Hot Potato minigames) The Hook: Rapid-fire trivia or execution under an exploding timer. Gameplay Loop: A virtual ticking bomb appears on the main screen with a live countdown (e.g., 15 seconds). A rapid prompt appears: "Name a building on Purdue campus that starts with M!" The player holding the "potato" must type a correct answer or tap a fast button, then press a "Pass" button to instantly fling the bomb to another player's phone screen. Whoever is holding the bomb when it detonates loses life points.

8. Purdue Party Game: "Bell Tower Bluff: The Legend of PAL 3.0"Vibe: Fibbage meets Quiplash—hyper-focused on real Purdue campus myths, brutal course lore (CS 240, ECE exams), iconic traditions (Breakfast Club, Grand Prix), and legendary campus landmarks.The Hook: Every round presents a absurd, 100% real (or completely made-up) fact about Purdue University with a missing blank. Players type out a fake, highly believable lie on their phones to trick their friends, while trying to spot the actual truth hidden among the crowd.Step-by-Step Scenario & FlowThe Prompt Phase: The main screen displays a Purdue-specific campus headline or legend with a missing blank:Prompt 1 (Campus Curse): "According to Purdue myth, if you walk under the Bell Tower before graduation, you won't graduate in 4 years—unless you run directly into ______."Prompt 2 (Legendary Campus Chaos): "During a legendary Finals Week storm, engineering students famously tried to fix the broken campus Wi-Fi (PAL 3.0) by duct-taping a router to ______."Prompt 3 (Breakfast Club Lore): "At 5:00 AM on a Home Game Saturday, a student dressed as a giant hot dog was spotted getting thrown out of Harry's Chocolate Shop for trying to pay with ______."The Deception Phase: Every player uses their phone interface to type out a hilarious, convincing lie to fill in the blank (e.g., "a 24-pack of Mad Mushroom Cheesesticks" or "their CS 240 midterm score").The Voting Matrix: The main screen shuffles all player-submitted lies together with the actual historical/campus truth. Players vote on their phones for what they think is the real answer.The Scoring Twist:Truth Points: Earn $+100\text{ pts}$ for picking the actual real answer."Bait" Bonus: Earn $+50\text{ pts}$ every time a classmate falls for your fake lie.

9. Purdue Course Syllabus Trivia & Roguelike Quest ("Degree Speedrun") Instead of just boring static multiple-choice questions, transform Purdue course syllabi (from AAE, CS, MFET, MET, etc.) into an interactive Roguelike Quiz Crawler with fun objectives: The Hook: "Degree Speedrun" — You are an undergraduate trying to survive 8 semesters in 5 minutes by beating course boss battles using actual syllabus data. Step-by-Step Scenario & Flow: Major Selection: Choose your major on your phone (e.g., CS 180, AAE 251, MET 102, MFET 250). Course Boss Encounters: Each level is a brutal course syllabus. To pass the midterm boss, you must answer rapid-fire, high-yield MCQ trivia extracted directly from official Purdue course learning objectives, coding logic, or lab safety rules. Fun Objectives & Perks: Survive a curve: Answer 3 questions right in a row to trigger a "Class Curve" shield. Office Hours Help: Use a one-time "TA Hint" lifeline that eliminates two wrong choices. GPA Meter: Every wrong answer drops your GPA; if it hits 1.0, you face academic probation (sudden death mini-game).

10. Purdue Party Game: "Deep Cut: The Ross-Ade Trench" (Purdue Rarity Engine)Vibe: Krillion.io meets high-stakes, infinitely scalable multiplayer party trivia.The Hook: In Deep Cut, players race against a 20-second timer to submit valid Purdue-related answers on their phones. Common answers yield surface-level points, while obscure, deeply specific knowledge plunges you deeper into the scoring tiers. The system is built to ingest and expand into any campus domain dynamically—from syllabus data to daily dining menus.Step-by-Step Scenario & FlowPrompt Dispatch Phase: The main display reveals a hyper-specific category prompt pulled from dynamic campus datasets:Prompt 1 (Purdue CS & Engineering Syllabi): "Name a compiler flag, tool, error message, or data structure concept featured in the CS 240, CS 180, or ECE 264 syllabi."Prompt 2 (Ford Dining Court Real-Time Menu): "Name a dish, sauce, station, or dietary option from today's live Ford Dining Court menu."Prompt 3 (Purdue Campus Lore & Locations): "Name an academic building, basement lab, or tunnel connection on the Purdue campus."Submission Phase (20-Second Phone Lock): Players type their answers into their phone touchscreens before the timer expires.Scenario A (CS Syllabus Prompt):Player A submits: Segmentation Fault (Obvious/common $\rightarrow$ 10 pts).Player B submits: Valgrind (Mid-depth recall $\rightarrow$ 40 pts).Player C submits: -Wuninitialized (Obscure compiler flag $\rightarrow$ 80 pts).Player D submits: void *(*func_ptr)(void *) (Deepest cut / complex signature $\rightarrow$ 100 pts).Scenario B (Ford Dining Court Menu Prompt):Player A submits: Brick Oven Pizza (Surface-level $\rightarrow$ 10 pts).Player B submits: Vegetarian Curry (Mid-depth $\rightarrow$ 40 pts).Player C submits: On-The-Go Box (Deep cut $\rightarrow$ 80 pts).Player D submits: Halal Station Seasoned Tofu (Gem tier / hyper-specific daily item $\rightarrow$ 100 pts).High-Stakes Party Twist ("Stolen Deep Cut"):If two or more players in the room type the exact same deep-cut answer, their rarity collapses down to Surface Tier (10 pts) because it is no longer unique.Risk/Reward Loop: Do you play a safe answer to lock in 40 points, or risk typing an obscure malloc memory leak edge-case or daily dining special that someone else might also guess?How "Deep Cut" Expands Infinitely Beyond ThisBecause this game relies on structured datasets, your team can continuously feed new content into the Supabase database without changing any game logic: ┌─────────────────────────────────────┐
    │ Dataset Ingestion Engine │
    └──────────────────┬──────────────────┘
    │
    ┌───────────────────────────┼───────────────────────────┐
    ▼ ▼ ▼
    ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
    │ Purdue Syllabi │ │ Dining API │ │ Course Catalog │
    │ CS, ECE, AAE, │ │ Daily menus from │ │ Prereq chains, │
    │ MET, MFET │ │ Ford, Wiley, │ │ professor names, │
    │ │ │ Windsor, Earhart │ │ exam locations │
    └──────────────────┘ └──────────────────┘ └──────────────────┘
    Dynamic Course Syllabi: Extract topics, assignment names, compiler flags, and lab tools straight from syllabi across all majors (CS, ECE, AAE, MET, MFET, IE).Live Dining Court Menus: Hook into daily dining API feeds to turn real-time breakfast, lunch, and dinner menus from Ford, Wiley, Windsor, and Earhart into instant trivia pools.Course Catalog & Prereq Chains: Generate prompts around prerequisite paths (e.g., "Name a course that lists CS 180 as a prerequisite" or "Name a professor who has taught AAE 251").Campus Culture & Student Life: Expand to local campus spots, dorm names, bus routes, Purdue sports stats, and historic tradition lore.

## Open decisions

- DNS: decided. The subdomain `larpparty.rithvik.si` is a CNAME to Vercel (see Current state).
- Whether the Host device is also a player. Decided for MVP: the Host is a narrator-only screen with an `is_host` player row. A manifest may opt into host-as-player later.
- Narration delivery: on-screen text for MVP. Text-to-speech is a Phase 2 candidate.
- Fonts load from Google Fonts per style (one stylesheet request when a style is first used). If we ever need offline or stricter privacy, self-host them with `next/font`.
- Keep-alive strategy for the Supabase free-tier pause.
- Supabase project ownership: decided. Project `zitumyodkyfbtlwcjmqp` is owned by a teammate's account (Rithvik's is at the 2-free-project cap). Rithvik administers it through the DB connection string in `~/larpparty-prod.env`.
- Anonymous sign-in rate limit is per IP, and a whole party shares one IP. `supabase/config.toml` raises it to 200 an hour. Check the hosted project's Auth rate limits match.
