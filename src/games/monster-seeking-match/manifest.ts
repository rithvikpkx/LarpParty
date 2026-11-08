import type { GameManifest } from "@/platform/game-contract";
import { defaultSettings, engine, type Intent, type PrivateState, type PublicState, type Settings } from "./engine";
import { HostView, PlayerView, SettingsForm } from "./views";
export const monsterSeekingMatch: GameManifest<Settings, PublicState, PrivateState, Intent> = {
  slug: "monster-seeking-match",
  name: "Monster Seeking Match",
  description: "Secret monsters, private messages and dates with a bite.",
  art: "ghost",
  minPlayers: 3,
  maxPlayers: 12,
  defaultSettings,
  playerLimits: () => ({ min: 3, max: 12 }),
  SettingsForm,
  HostView,
  PlayerView,
  engine,
};
