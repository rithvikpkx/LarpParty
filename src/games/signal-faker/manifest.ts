import type { GameManifest } from "@/platform/game-contract";
import { defaultSettings, engine, type Intent, type PrivateState, type PublicState, type Settings } from "./engine";
import { HostView, PlayerView, SettingsForm } from "./views";
export const signalFaker: GameManifest<Settings, PublicState, PrivateState, Intent> = {
  slug: "signal-faker",
  name: "Signal Faker",
  description: "One player has a different instruction. Act together, spot the Faker and vote.",
  minPlayers: 3,
  maxPlayers: 12,
  defaultSettings,
  playerLimits: () => ({ min: 3, max: 12 }),
  SettingsForm,
  HostView,
  PlayerView,
  engine,
};
