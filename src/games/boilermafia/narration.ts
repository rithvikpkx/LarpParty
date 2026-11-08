/**
 * The narrator's script. Pure functions from state to lines of text; the Host
 * screen reveals them one at a time. Variants rotate by round so repeated
 * nights don't read identically.
 */
import type { PublicState, Role } from "./types";

type NameOf = (id: string) => string;

export const ROLE_LABEL: Record<Role, string> = {
  werewolf: "Werewolf",
  doctor: "Doctor",
  seer: "Seer",
  villager: "Villager",
};

const article = (role: Role) => (role === "werewolf" ? "a" : role === "villager" ? "a" : "the");

const NIGHT_OPENERS = [
  "It was a dark night in the forest...",
  "Fog rolls in over the rooftops of the village...",
  "The wind howls. Somewhere, a dog stops barking...",
  "The moon is full, and nobody is sleeping well...",
];

const DAWN_OPENERS = [
  "The sun rises over the village.",
  "Morning comes, grey and cold.",
  "A rooster crows. The village stirs.",
];

function pick<T>(list: T[], round: number): T {
  return list[(Math.max(1, round) - 1) % list.length];
}

export function narrate(pub: PublicState, nameOf: NameOf): string[] {
  switch (pub.phase) {
    case "reveal":
      return [
        "Welcome to BoilerMafia.",
        "Look at your phone. Quietly. Tell no one what you see.",
        `Among you are ${pub.roleCounts.werewolf} ${pub.roleCounts.werewolf === 1 ? "werewolf" : "werewolves"}.`,
        "Tap “I'm ready” when you know your role.",
      ];

    case "night": {
      const lines = [pick(NIGHT_OPENERS, pub.round), "Everyone, close your eyes."];
      lines.push("Werewolves, wake up. Choose your victim on your phone.");
      if (pub.roleCounts.doctor > 0) lines.push("Doctor, choose someone to protect.");
      if (pub.roleCounts.seer > 0) lines.push("Seer, choose someone to see into.");
      lines.push("Keep your eyes closed until morning.");
      return lines;
    }

    case "dawn": {
      const lines = [pick(DAWN_OPENERS, pub.round), "Everyone, open your eyes."];
      const killed = pub.lastNight?.killed;
      if (killed) {
        const role = pub.revealedRoles[killed];
        lines.push(`${nameOf(killed)} was found dead at dawn.`);
        if (role) lines.push(`They were ${article(role)} ${ROLE_LABEL[role]}.`);
      } else {
        lines.push("By some miracle, everyone survived the night.");
      }
      if (pub.winner) lines.push("And with that, it is over...");
      return lines;
    }

    case "day":
      return [
        "The village gathers in the square.",
        "Somebody here is lying. Talk it out.",
        "Vote on your phone. The most votes is banished.",
      ];

    case "verdict": {
      const v = pub.lastVerdict;
      const lines = ["The votes are in."];
      if (!v || v.reason === "no-votes") lines.push("Nobody voted. The village shrugs and goes home.");
      else if (v.reason === "tie") lines.push("It's a tie. Nobody is banished today.");
      else if (v.reason === "skip") lines.push("The village chooses mercy. Nobody is banished.");
      else if (v.eliminated) {
        const role = pub.revealedRoles[v.eliminated];
        lines.push(`The village has banished ${nameOf(v.eliminated)}.`);
        if (role) lines.push(`They were ${article(role)} ${ROLE_LABEL[role]}.`);
      }
      if (pub.winner) lines.push("And with that, it is over...");
      else lines.push("Night falls again.");
      return lines;
    }

    case "over":
      return pub.winner === "village"
        ? ["The last werewolf is gone.", "The village wins."]
        : ["The werewolves outnumber the village.", "The werewolves win."];
  }
}

export const PHASE_TITLE: Record<PublicState["phase"], string> = {
  reveal: "Your role",
  night: "Night",
  dawn: "Dawn",
  day: "Day",
  verdict: "Verdict",
  over: "Game over",
};
