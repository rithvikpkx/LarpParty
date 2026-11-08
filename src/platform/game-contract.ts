/**
 * The game plug-in contract.
 *
 * The platform knows nothing about a specific game beyond this file. A game is
 * a folder under src/games/<slug>/ that exports one GameManifest and is listed
 * in src/games/index.ts.
 *
 * Data flow: a view calls dispatch(intent) -> server action -> engine.reduce
 * -> Postgres -> Realtime -> every view re-renders with the new state.
 */
import type { ComponentType } from "react";

export type PlayerId = string;

/** A player as the engine sees them. The host screen is never an engine player. */
export interface EnginePlayer {
  id: PlayerId;
  nickname: string;
}

/** Supplied by the server on every engine call. Engines must not read clocks or Math.random themselves. */
export interface EngineContext {
  /** Server time, epoch milliseconds. */
  now: number;
  /** Uniform random number in [0, 1). Seeded in tests. */
  random: () => number;
}

export interface IntentContext extends EngineContext {
  /** Player row id of whoever sent the intent. */
  actorId: PlayerId;
  /** True when the sender is the room's host screen. */
  actorIsHost: boolean;
}

/** Full game state. `public` is readable by everyone in the room; `private[id]` only by that player. */
export interface GameState<Pub, Priv> {
  public: Pub;
  private: Record<PlayerId, Priv>;
}

/** Throw this from reduce() to reject an intent. The message is shown to the player. */
export class IllegalIntentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IllegalIntentError";
  }
}

export interface GameEngine<Settings, Pub, Priv, Intent> {
  /** Sanitize untrusted settings from the browser. Must always return valid settings. */
  parseSettings(raw: unknown): Settings;
  /** Return an error message if the game cannot start with this many players, else null. */
  validateStart(playerCount: number, settings: Settings): string | null;
  /** Validate the shape of an untrusted intent. Throw IllegalIntentError if malformed. */
  parseIntent(raw: unknown): Intent;

  init(players: EnginePlayer[], settings: Settings, ctx: EngineContext): GameState<Pub, Priv>;
  /** Pure and deterministic given ctx. Throws IllegalIntentError on illegal intents. */
  reduce(state: GameState<Pub, Priv>, intent: Intent, ctx: IntentContext): GameState<Pub, Priv>;
  /**
   * Optional timer advancement. Clients ask the server to tick once deadline() has
   * passed; the server calls this with its own clock. Return the same object if
   * nothing should change.
   */
  tick?(state: GameState<Pub, Priv>, ctx: EngineContext): GameState<Pub, Priv>;
  /** When the next tick is due (epoch ms), or null if no timer is running. */
  deadline?(publicState: Pub): number | null;
  /** True once the game has a final result. The room moves to "finished". */
  isOver(publicState: Pub): boolean;
}

/** A row from the players table, as views see it. */
export interface RoomPlayer {
  id: PlayerId;
  nickname: string;
  isHost: boolean;
  connected: boolean;
}

export interface DispatchResult {
  ok: boolean;
  error?: string;
}

export interface GameViewProps<Pub, Priv, Intent> {
  roomCode: string;
  /** Everyone in the room, including the host screen (isHost = true). */
  players: RoomPlayer[];
  me: RoomPlayer;
  publicState: Pub;
  /** This device's private state. Null on the host screen. */
  privateState: Priv | null;
  dispatch: (intent: Intent) => Promise<DispatchResult>;
  /** Current server time in epoch ms, corrected for this device's clock skew. */
  serverNow: () => number;
  /** Host only: send everyone back to the lobby with the same players. */
  playAgain?: () => Promise<void>;
}

export interface SettingsFormProps<Settings> {
  value: Settings;
  onChange: (next: Settings) => void;
}

export interface GameManifest<Settings, Pub, Priv, Intent> {
  slug: string;
  name: string;
  /** Shown on the home card. */
  description: string;
  /** Art shown on the home card and game page (an id from src/components/ui Art, e.g. "wolf"). */
  art?: import("@/components/ui").ArtName;
  /** Hard limits for the lobby. Settings may narrow these. */
  minPlayers: number;
  maxPlayers: number;
  defaultSettings: Settings;
  /** Read the effective player limits out of a game's settings. */
  playerLimits(settings: Settings): { min: number; max: number };
  SettingsForm: ComponentType<SettingsFormProps<Settings>>;
  HostView: ComponentType<GameViewProps<Pub, Priv, Intent>>;
  PlayerView: ComponentType<GameViewProps<Pub, Priv, Intent>>;
  engine: GameEngine<Settings, Pub, Priv, Intent>;
}

// The registry holds games with different type parameters side by side. The
// platform treats their state as opaque JSON, so it erases the generics here.
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- type erasure for the heterogeneous registry; each game is fully typed inside its own folder.
export type AnyGameManifest = GameManifest<any, any, any, any>;
