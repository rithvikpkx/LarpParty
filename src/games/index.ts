/**
 * Game registry. The only file game engineers edit outside their own folder:
 * add one import and one array entry per game.
 */
import type { AnyGameManifest } from "@/platform/game-contract";
import { boilermafia } from "./boilermafia/manifest";
import { monsterSeekingMatch } from "./monster-seeking-match/manifest";

export const games: AnyGameManifest[] = [boilermafia, monsterSeekingMatch];

export function getGame(slug: string): AnyGameManifest | undefined {
  return games.find((g) => g.slug === slug);
}
