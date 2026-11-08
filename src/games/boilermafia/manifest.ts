import type { GameManifest } from "@/platform/game-contract";
import { defaultSettings, engine } from "./engine";
import { HostView } from "./HostView";
import { PlayerView } from "./PlayerView";
import { SettingsForm } from "./SettingsForm";
import type { Intent, PrivateState, PublicState, Settings } from "./types";

export const boilermafia: GameManifest<Settings, PublicState, PrivateState, Intent> = {
  slug: "boilermafia",
  name: "BoilerMafia",
  description: "Werewolves hide among the villagers. Lie, deduce and vote before the village falls.",
  art: "wolf",
  minPlayers: 3,
  maxPlayers: 20,
  defaultSettings,
  playerLimits: (s) => ({ min: s.minPlayers, max: s.maxPlayers }),
  SettingsForm,
  HostView,
  PlayerView,
  engine,
};
