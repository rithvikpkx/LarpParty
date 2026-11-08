"use client";

/** The big screen. Narrator only: it shows public state and never any roles until they are revealed. */
import { useState } from "react";
import { Button } from "@/components/Button";
import { Countdown } from "@/components/Countdown";
import type { GameViewProps } from "@/platform/game-contract";
import { narrate, PHASE_TITLE, ROLE_LABEL } from "./narration";
import type { Intent, PrivateState, PublicState, VoteTarget } from "./types";
import { Narration, ROLE_STYLE } from "./ui";

type Props = GameViewProps<PublicState, PrivateState, Intent>;

const BACKDROP: Record<PublicState["phase"], string> = {
  reveal: "from-[#10132a] to-night",
  night: "from-[#070914] to-[#020308]",
  dawn: "from-[#3a2a4a] via-[#2a1f3a] to-night",
  day: "from-[#2b3a5c] via-[#1c2540] to-night",
  verdict: "from-[#3a1a22] via-[#1f1420] to-night",
  over: "from-[#1d1b3a] to-night",
};

export function HostView({ roomCode, players, publicState: pub, dispatch, serverNow, playAgain }: Props) {
  const [busy, setBusy] = useState(false);
  const nameOf = (id: string) => players.find((p) => p.id === id)?.nickname ?? "Someone";
  const lines = narrate(pub, nameOf);

  const advance = async () => {
    setBusy(true);
    await dispatch({ type: "advance" });
    setBusy(false);
  };

  const advanceLabel: Record<PublicState["phase"], string> = {
    reveal: "Begin the night",
    night: "End the night",
    dawn: pub.winner ? "Reveal the winner" : "Start the day",
    day: "End voting",
    verdict: pub.winner ? "Reveal the winner" : "Next night",
    over: "",
  };

  return (
    <main
      className={`relative flex min-h-dvh flex-col bg-gradient-to-b ${BACKDROP[pub.phase]} text-white transition-colors duration-1000`}
    >
      <header className="flex items-center justify-between px-8 pt-6 text-white/60 lg:px-14 lg:pt-10">
        <div className="text-sm font-medium tracking-wide">
          BoilerMafia · Room <span className="font-semibold text-white/90">{roomCode}</span>
        </div>
        <div className="text-sm font-medium">{pub.round > 0 && pub.phase !== "over" ? `Round ${pub.round}` : ""}</div>
      </header>

      <section className="flex flex-1 flex-col items-center justify-center px-8 text-center lg:px-14">
        <p className="text-sm font-semibold tracking-[0.3em] text-white/50 uppercase">{PHASE_TITLE[pub.phase]}</p>
        {pub.deadline !== null && pub.phase !== "over" && (
          <Countdown
            deadline={pub.deadline}
            now={serverNow}
            className="font-display mt-3 text-6xl font-semibold lg:text-7xl"
          />
        )}
        <Narration
          key={`${pub.phase}-${pub.round}`}
          lines={lines}
          className="font-display mt-10 max-w-4xl text-3xl leading-snug font-medium text-white lg:text-5xl"
        />
      </section>

      {pub.phase === "day" && <VoteBoard pub={pub} nameOf={nameOf} />}
      {pub.phase === "verdict" && pub.lastVerdict && <TallyBoard tally={pub.lastVerdict.tally} nameOf={nameOf} />}
      {pub.phase === "over" && <RoleReveal pub={pub} nameOf={nameOf} />}

      <footer className="flex flex-wrap items-end justify-between gap-6 px-8 pb-8 lg:px-14 lg:pb-10">
        <PlayerStrip pub={pub} nameOf={nameOf} />
        <div className="flex gap-3">
          {pub.phase === "over" ? (
            playAgain && (
              <Button size="xl" onClick={() => void playAgain()}>
                Play again
              </Button>
            )
          ) : (
            <Button
              size="lg"
              variant="secondary"
              className="!bg-white/10 !text-white hover:!bg-white/20"
              disabled={busy}
              onClick={advance}
            >
              {advanceLabel[pub.phase]} →
            </Button>
          )}
        </div>
      </footer>
    </main>
  );
}

function PlayerStrip({ pub, nameOf }: { pub: PublicState; nameOf: (id: string) => string }) {
  return (
    <ul className="flex max-w-4xl flex-wrap gap-2">
      {pub.playerIds.map((id) => {
        const alive = pub.alive.includes(id);
        const role = pub.revealedRoles[id];
        const ready = pub.phase === "reveal" && pub.ready.includes(id);
        return (
          <li
            key={id}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-base font-medium transition ${
              alive ? "bg-white/10 text-white" : "bg-white/5 text-white/40 line-through"
            }`}
          >
            {!alive && role && <span aria-hidden>{ROLE_STYLE[role].emoji}</span>}
            {nameOf(id)}
            {ready && <span className="text-emerald-300">✓</span>}
          </li>
        );
      })}
    </ul>
  );
}

function VoteBoard({ pub, nameOf }: { pub: PublicState; nameOf: (id: string) => string }) {
  const voted = pub.alive.filter((id) => pub.votes[id] !== undefined).length;
  const counts: Record<string, string[]> = {};
  for (const [voter, target] of Object.entries(pub.votes)) (counts[target] ??= []).push(nameOf(voter));
  const rows = Object.entries(counts).sort((a, b) => b[1].length - a[1].length);
  return (
    <section className="mx-auto mb-6 w-full max-w-4xl px-8">
      <p className="mb-3 text-center text-white/60">
        {voted} of {pub.alive.length} voted
      </p>
      <ul className="grid gap-2 sm:grid-cols-2">
        {rows.map(([target, voters]) => (
          <li key={target} className="animate-rise flex items-center justify-between rounded-2xl bg-white/8 px-5 py-3">
            <span className="text-xl font-semibold">{target === "skip" ? "Skip" : nameOf(target)}</span>
            <span className="text-sm text-white/60">{voters.join(", ")}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function TallyBoard({ tally, nameOf }: { tally: Record<VoteTarget, number>; nameOf: (id: string) => string }) {
  const rows = Object.entries(tally).sort((a, b) => b[1] - a[1]);
  if (rows.length === 0) return null;
  const max = rows[0][1];
  return (
    <section className="mx-auto mb-6 w-full max-w-3xl space-y-2 px-8">
      {rows.map(([target, n]) => (
        <div key={target} className="flex items-center gap-4">
          <span className="w-40 truncate text-right text-lg">{target === "skip" ? "Skip" : nameOf(target)}</span>
          <div className="h-8 flex-1 overflow-hidden rounded-full bg-white/5">
            <div className="animate-fade bg-blood/70 h-full rounded-full" style={{ width: `${(n / max) * 100}%` }} />
          </div>
          <span className="w-8 text-lg font-semibold tabular-nums">{n}</span>
        </div>
      ))}
    </section>
  );
}

function RoleReveal({ pub, nameOf }: { pub: PublicState; nameOf: (id: string) => string }) {
  return (
    <section className="mx-auto mb-8 grid w-full max-w-5xl grid-cols-2 gap-3 px-8 sm:grid-cols-3 lg:grid-cols-4">
      {pub.playerIds.map((id, i) => {
        const role = pub.revealedRoles[id];
        const winnerTeam = pub.winner === "werewolves" ? role === "werewolf" : role !== "werewolf";
        return (
          <div
            key={id}
            style={{ animationDelay: `${i * 80}ms` }}
            className={`animate-rise rounded-2xl p-4 ring-1 ${winnerTeam ? "bg-white/12 ring-white/30" : "bg-white/5 ring-white/10"}`}
          >
            <div className="text-3xl">{role ? ROLE_STYLE[role].emoji : "?"}</div>
            <div className={`mt-2 text-lg font-semibold ${pub.alive.includes(id) ? "" : "text-white/50 line-through"}`}>
              {nameOf(id)}
            </div>
            <div className="text-sm text-white/60">{role ? ROLE_LABEL[role] : ""}</div>
          </div>
        );
      })}
    </section>
  );
}
