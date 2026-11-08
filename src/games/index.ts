/**
 * Game registry. The only file game engineers edit outside their own folder:
 * add one import and one array entry per game.
 */
import type { AnyGameManifest } from "@/platform/game-contract";
import { boilermafia } from "./boilermafia/manifest";
import { monsterSeekingMatch } from "./monster-seeking-match/manifest";
import { signalFaker } from "./signal-faker/manifest";

export const games: AnyGameManifest[] = [boilermafia, monsterSeekingMatch, signalFaker];

export function getGame(slug: string): AnyGameManifest | undefined {
  return games.find((g) => g.slug === slug);
}
