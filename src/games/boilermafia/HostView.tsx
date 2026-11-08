"use client";

/** The big screen. Narrator only: it shows public state, and roles only once they are revealed. */
import { useState } from "react";
import {
  Art,
  Button,
  Eyebrow,
  Narration,
  Panel,
  PickList,
  Screen,
  StyleButton,
  Timer,
  Toast,
  type ArtName,
} from "@/components/ui";
import type { GameViewProps } from "@/platform/game-contract";
import { narrate, PHASE_TITLE, ROLE_LABEL } from "./narration";
import { ROLE_ART } from "./roles";
import type { Intent, PrivateState, PublicState, VoteTarget } from "./types";

type Props = GameViewProps<PublicState, PrivateState, Intent>;

const KANJI: Record<PublicState["phase"], string> = {
  reveal: "宴",
  night: "夜",
  dawn: "朝",
  day: "昼",
  verdict: "決",
  over: "勝",
};
const PHASE_ART: Record<PublicState["phase"], ArtName> = {
  reveal: "crescent",
  night: "moon",
  dawn: "sun",
  day: "sun",
  verdict: "skull",
  over: "trophy",
};

export function HostView({ roomCode, players, publicState: pub, dispatch, serverNow, playAgain }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nameOf = (id: string) => players.find((p) => p.id === id)?.nickname ?? "Someone";

  const advance = async () => {
    setBusy(true);
    const res = await dispatch({ type: "advance" });
    setBusy(false);
    setError(res.ok ? null : (res.error ?? "Couldn't advance."));
  };

  if (pub.phase === "over") return <Winner pub={pub} nameOf={nameOf} playAgain={playAgain} />;

  const dark = pub.phase === "reveal" || pub.phase === "night";
  const advanceLabel: Record<Exclude<PublicState["phase"], "over">, string> = {
    reveal: "Begin the night",
    night: "End the night",
    dawn: pub.winner ? "Reveal the winner" : "Start the day",
    day: "End voting",
    verdict: pub.winner ? "Reveal the winner" : "Next night",
  };

  return (
    <Screen
      kind="tv"
      className={dark ? "stage is-night" : "stage"}
      kanji={KANJI[pub.phase]}
      rain={pub.phase === "night"}
    >
      <div className="stage-top">
        <Eyebrow>
          {PHASE_TITLE[pub.phase]}
          {pub.round > 0 ? ` · Round ${pub.round}` : ""}
        </Eyebrow>
        <Eyebrow>Room {roomCode}</Eyebrow>
      </div>

      <div className="stage-mid">
        <Art name={PHASE_ART[pub.phase]} className="moon" />
        <Timer deadline={pub.deadline} now={serverNow} />
      </div>

      <Narration key={`${pub.phase}-${pub.round}`} lines={narrate(pub, nameOf)} />

      {pub.phase === "day" && <VoteBoard pub={pub} nameOf={nameOf} />}
      {pub.phase === "verdict" && pub.lastVerdict && <TallyBoard tally={pub.lastVerdict.tally} nameOf={nameOf} />}

      <div className="stage-foot">
        <StyleButton />
        <div className="strip">
          {pub.playerIds.map((id) => {
            const alive = pub.alive.includes(id);
            const role = pub.revealedRoles[id];
            const ready = pub.phase === "reveal" && pub.ready.includes(id);
            return (
              <span key={id} className={["chip", !alive && "dead", ready && "ok"].filter(Boolean).join(" ")}>
                {nameOf(id)}
                {!alive && role ? ` · ${ROLE_LABEL[role]}` : ""}
              </span>
            );
          })}
        </div>
        <Button variant="ghost" disabled={busy} onClick={advance}>
          {advanceLabel[pub.phase]} →
        </Button>
      </div>
      {error && <Toast>{error}</Toast>}
    </Screen>
  );
}

function VoteBoard({ pub, nameOf }: { pub: PublicState; nameOf: (id: string) => string }) {
  const voted = pub.alive.filter((id) => pub.votes[id] !== undefined).length;
  const counts = new Map<string, string[]>();
  for (const [voter, target] of Object.entries(pub.votes))
    counts.set(target, [...(counts.get(target) ?? []), nameOf(voter)]);
  const rows = [...counts.entries()].sort((a, b) => b[1].length - a[1].length);
  const max = Math.max(1, ...rows.map(([, v]) => v.length));
  return (
    <div className="board">
      <p className="muted" style={{ margin: 0 }}>
        {voted} of {pub.alive.length} voted
      </p>
      <PickList
        selected={null}
        options={rows.map(([target, voters]) => ({
          id: target,
          label: target === "skip" ? "Skip" : nameOf(target),
          detail: voters.join(", "),
          share: voters.length / max,
        }))}
      />
    </div>
  );
}

function TallyBoard({ tally, nameOf }: { tally: Record<VoteTarget, number>; nameOf: (id: string) => string }) {
  const rows = Object.entries(tally).sort((a, b) => b[1] - a[1]);
  if (rows.length === 0) return null;
  const max = rows[0][1];
  return (
    <div className="board">
      <PickList
        selected={null}
        options={rows.map(([target, n]) => ({
          id: target,
          label: target === "skip" ? "Skip" : nameOf(target),
          detail: `${n} vote${n === 1 ? "" : "s"}`,
          share: n / max,
        }))}
      />
    </div>
  );
}

function Winner({
  pub,
  nameOf,
  playAgain,
}: {
  pub: PublicState;
  nameOf: (id: string) => string;
  playAgain?: () => Promise<void>;
}) {
  const lines = narrate(pub, nameOf);
  return (
    <Screen kind="tv" className="win" kanji="勝" pow>
      <Art name="trophy" className="trophy" />
      <Eyebrow>Game over · {pub.round} rounds</Eyebrow>
      <h1 className="disp">
        <span className="hl">{lines[lines.length - 1]}</span>
      </h1>
      <div className="roles">
        {pub.playerIds.map((id) => {
          const role = pub.revealedRoles[id];
          const onWinningTeam = pub.winner === "werewolves" ? role === "werewolf" : role !== "werewolf";
          return (
            <Panel key={id} className={onWinningTeam ? "rc" : "rc lost"}>
              {role && <Art name={ROLE_ART[role]} />}
              <b>{nameOf(id)}</b>
              <span>{role ? ROLE_LABEL[role] : ""}</span>
            </Panel>
          );
        })}
      </div>
      <div className="actions">
        {playAgain && <Button onClick={() => void playAgain()}>Play again</Button>}
        <StyleButton />
      </div>
    </Screen>
  );
}
