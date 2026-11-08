import type { GameState, PlayerId } from "@/platform/game-contract";

export type Role = "werewolf" | "doctor" | "seer" | "villager";
export type Team = "village" | "werewolves";
export type Phase = "reveal" | "night" | "dawn" | "day" | "verdict" | "over";

export interface Settings {
  minPlayers: number;
  maxPlayers: number;
  werewolves: number;
  doctors: number;
  seers: number;
  revealSeconds: number;
  nightSeconds: number;
  daySeconds: number;
}

export type VoteTarget = PlayerId | "skip";

export interface Verdict {
  eliminated: PlayerId | null;
  reason: "majority" | "tie" | "skip" | "no-votes";
  tally: Record<VoteTarget, number>;
}

export interface PublicState {
  phase: Phase;
  round: number;
  playerIds: PlayerId[];
  alive: PlayerId[];
  /** Epoch ms when the current phase auto-advances, or null. */
  deadline: number | null;
  /** Players who acknowledged their role during reveal. */
  ready: PlayerId[];
  roleCounts: Record<Role, number>;
  lastNight: { killed: PlayerId | null } | null;
  votes: Record<PlayerId, VoteTarget>;
  lastVerdict: Verdict | null;
  revealedRoles: Record<PlayerId, Role>;
  winner: Team | null;
  /** Phase lengths copied from settings so reduce() doesn't need settings passed in. */
  timers: { nightSeconds: number; daySeconds: number };
}

export interface SeerResult {
  round: number;
  target: PlayerId;
  isWerewolf: boolean;
}

export interface PrivateState {
  role: Role;
  packmates: PlayerId[];
  nightTarget: PlayerId | null;
  /** Werewolves only: each wolf's current pick this night. */
  packVotes: Record<PlayerId, PlayerId>;
  seerResults: SeerResult[];
}

export type Intent =
  | { type: "ready" }
  | { type: "nightAction"; target: PlayerId }
  | { type: "vote"; target: VoteTarget }
  | { type: "advance" };

export type State = GameState<PublicState, PrivateState>;
