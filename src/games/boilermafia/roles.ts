import type { ArtName } from "@/components/ui";
import type { Role } from "./types";

export const ROLE_ART: Record<Role, ArtName> = { werewolf: "wolf", doctor: "doctor", seer: "seer", villager: "farmer" };

export const ROLE_BLURB: Record<Role, string> = {
  werewolf: "Each night, choose a villager to eliminate with your pack. By day, blend in.",
  doctor: "Each night, protect one player from the werewolves. You may protect yourself.",
  seer: "Each night, look into one player's soul and learn whether they are a werewolf.",
  villager: "Find the werewolves and vote them out before they get you.",
};

/** "a Werewolf", "the Doctor". */
export const article = (role: Role) => (role === "werewolf" || role === "villager" ? "a" : "the");
