"use client";

/** Each phone: this player's private role and whatever they can do right now. */
import { useState } from "react";
import { Art, Button, Eyebrow, Notice, Panel, PickList, Screen, StyleButton, Timer, Toast } from "@/components/ui";
import type { GameViewProps } from "@/platform/game-contract";
import { PHASE_TITLE, ROLE_LABEL } from "./narration";
import { article, ROLE_ART, ROLE_BLURB } from "./roles";
import type { Intent, PrivateState, PublicState } from "./types";

type Props = GameViewProps<PublicState, PrivateState, Intent>;

export function PlayerView({ me, players, publicState: pub, privateState: priv, dispatch, serverNow }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showRole, setShowRole] = useState(false);

  const nameOf = (id: string) => players.find((p) => p.id === id)?.nickname ?? "Someone";
  const send = async (intent: Intent) => {
    setBusy(true);
    setError(null);
    const res = await dispatch(intent);
    setBusy(false);
    if (!res.ok) setError(res.error ?? "That didn't work.");
  };

  if (!priv) {
    return (
      <Screen kind="phone" className="is-night">
        <Notice title="Joining the game…" />
      </Screen>
    );
  }

  const alive = pub.alive.includes(me.id);
  const role = priv.role;
  const dark = pub.phase === "reveal" || pub.phase === "night" || !alive;
  const screenClass = pub.phase === "reveal" ? "role" : pub.phase === "night" || pub.phase === "day" ? "vote" : "role";

  return (
    <Screen
      kind="phone"
      className={dark ? `${screenClass} is-night` : screenClass}
      kanji={pub.phase === "night" ? "夜" : "狼"}
    >
      <div className="role-head">
        <div>
          <Eyebrow>
            {PHASE_TITLE[pub.phase]}
            {pub.round > 0 && pub.phase !== "over" ? ` · Round ${pub.round}` : ""}
          </Eyebrow>
          <b>{me.nickname}</b>
        </div>
        <div className="right">
          {pub.phase !== "over" && <Timer deadline={pub.deadline} now={serverNow} className="timer-sm" />}
          {pub.phase !== "reveal" && (
            <button type="button" className="btn ghost sm" onClick={() => setShowRole((v) => !v)}>
              {showRole ? ROLE_LABEL[role] : "Role"}
            </button>
          )}
          <StyleButton />
        </div>
      </div>

      {!alive && pub.phase !== "over" ? (
        <Notice art="skull" title="You are dead">
          You were {article(role)} {ROLE_LABEL[role]}. Stay quiet and watch the big screen. {pub.alive.length} players
          still alive.
        </Notice>
      ) : (
        <PhaseBody pub={pub} priv={priv} meId={me.id} nameOf={nameOf} send={send} busy={busy} />
      )}

      {error && <Toast>{error}</Toast>}
    </Screen>
  );
}

interface BodyProps {
  pub: PublicState;
  priv: PrivateState;
  meId: string;
  nameOf: (id: string) => string;
  send: (intent: Intent) => Promise<void>;
  busy: boolean;
}

function PhaseBody(props: BodyProps) {
  const { pub, priv, meId, nameOf, send, busy } = props;
  switch (pub.phase) {
    case "reveal": {
      const ready = pub.ready.includes(meId);
      return (
        <>
          <Panel label="ROLE" className="role-card">
            <Art name={ROLE_ART[priv.role]} />
            <div className="you">You are</div>
            <h2 className="disp">
              {article(priv.role)} {ROLE_LABEL[priv.role]}
            </h2>
            <p>{ROLE_BLURB[priv.role]}</p>
            {priv.role === "werewolf" && (
              <span className="chip pack">
                {priv.packmates.length ? `Your pack: ${priv.packmates.map(nameOf).join(", ")}` : "You hunt alone."}
              </span>
            )}
            <i className="deco card-back" />
          </Panel>
          <Button className="cta" wide disabled={ready || busy} onClick={() => void send({ type: "ready" })}>
            {ready ? "Waiting for everyone…" : "I'm ready"}
          </Button>
        </>
      );
    }
    case "night":
      return <NightAction {...props} />;
    case "dawn":
      return (
        <Notice art="sun" title="Morning has come">
          {pub.lastNight?.killed
            ? `${nameOf(pub.lastNight.killed)} did not survive the night.`
            : "Everyone survived the night."}{" "}
          Look at the big screen.
        </Notice>
      );
    case "day":
      return <DayVote {...props} />;
    case "verdict": {
      const v = pub.lastVerdict;
      return (
        <Notice art="skull" title="The votes are in">
          {v?.eliminated ? `${nameOf(v.eliminated)} has been banished.` : "Nobody was banished."}
        </Notice>
      );
    }
    case "over": {
      const won = pub.winner === "werewolves" ? priv.role === "werewolf" : priv.role !== "werewolf";
      return (
        <Notice art={won ? "trophy" : "skull"} title={won ? "You won" : "You lost"}>
          {pub.winner === "village" ? "The village wins." : "The werewolves win."} You were {article(priv.role)}{" "}
          {ROLE_LABEL[priv.role]}.
        </Notice>
      );
    }
  }
}

function Heading({ title, hint }: { title: string; hint?: string }) {
  return (
    <div>
      <h2 className="disp">{title}</h2>
      {hint && <p className="hint">{hint}</p>}
    </div>
  );
}

function NightAction({ pub, priv, meId, nameOf, send, busy }: BodyProps) {
  // Villagers get a decoy list so nobody can tell roles apart by who is tapping their phone.
  const [decoy, setDecoy] = useState<string | null>(null);
  const others = pub.alive.filter((id) => id !== meId);

  if (priv.role === "werewolf") {
    const targets = others.filter((id) => !priv.packmates.includes(id));
    const votesFor = (id: string) =>
      Object.entries(priv.packVotes)
        .filter(([wolf, t]) => t === id && wolf !== meId)
        .map(([wolf]) => nameOf(wolf));
    return (
      <>
        <Heading
          title="Choose your victim"
          hint="The pack's most popular pick is attacked. You can change your mind."
        />
        <PickList
          options={targets.map((id) => ({
            id,
            label: nameOf(id),
            detail: votesFor(id).length ? `🐺 ${votesFor(id).join(", ")}` : undefined,
          }))}
          selected={priv.nightTarget}
          onPick={(id) => void send({ type: "nightAction", target: id })}
          disabled={busy}
        />
      </>
    );
  }

  if (priv.role === "doctor") {
    return (
      <>
        <Heading
          title={priv.nightTarget ? `Protecting ${nameOf(priv.nightTarget)}` : "Who will you protect?"}
          hint={priv.nightTarget ? "Your choice is locked in. Close your eyes." : "You may protect yourself."}
        />
        <PickList
          options={pub.alive.map((id) => ({ id, label: id === meId ? `${nameOf(id)} (you)` : nameOf(id) }))}
          selected={priv.nightTarget}
          onPick={(id) => void send({ type: "nightAction", target: id })}
          disabled={busy || priv.nightTarget !== null}
        />
      </>
    );
  }

  if (priv.role === "seer") {
    const tonight = priv.seerResults.find((r) => r.round === pub.round);
    return (
      <>
        <Heading
          title={tonight ? "Your vision" : "Whose soul will you see?"}
          hint={tonight ? undefined : "You get one look per night."}
        />
        {tonight ? (
          <Panel className="vision">
            <Art name={tonight.isWerewolf ? "wolf" : "seer"} />
            <h2 className="disp" style={{ fontSize: "1.5em" }}>
              {nameOf(tonight.target)} {tonight.isWerewolf ? "is a Werewolf" : "is not a Werewolf"}
            </h2>
          </Panel>
        ) : (
          <PickList
            options={others.map((id) => ({ id, label: nameOf(id) }))}
            selected={null}
            onPick={(id) => void send({ type: "nightAction", target: id })}
            disabled={busy}
          />
        )}
        <SeerHistory priv={priv} nameOf={nameOf} skipRound={pub.round} />
      </>
    );
  }

  return (
    <>
      <Heading title="Who do you suspect?" hint="You're asleep. This is just for you; nobody sees it." />
      <PickList options={others.map((id) => ({ id, label: nameOf(id) }))} selected={decoy} onPick={setDecoy} />
    </>
  );
}

function DayVote({ pub, priv, meId, nameOf, send, busy }: BodyProps) {
  const myVote = pub.votes[meId] ?? null;
  const values = Object.values(pub.votes);
  const total = Math.max(1, values.length);
  const count = (id: string) => values.filter((t) => t === id).length;
  const detail = (id: string) => (count(id) ? `${count(id)} vote${count(id) === 1 ? "" : "s"}` : undefined);
  return (
    <>
      <Heading
        title="Who should be banished?"
        hint="Most votes is banished. You can change your vote until time runs out."
      />
      <PickList
        options={[
          ...pub.alive
            .filter((id) => id !== meId)
            .map((id) => ({ id, label: nameOf(id), detail: detail(id), share: count(id) / total })),
          { id: "skip", label: "Skip vote", detail: detail("skip"), share: count("skip") / total },
        ]}
        selected={myVote}
        onPick={(id) => void send({ type: "vote", target: id })}
        disabled={busy}
      />
      {priv.role === "seer" && <SeerHistory priv={priv} nameOf={nameOf} />}
    </>
  );
}

function SeerHistory({
  priv,
  nameOf,
  skipRound,
}: {
  priv: PrivateState;
  nameOf: (id: string) => string;
  skipRound?: number;
}) {
  const past = priv.seerResults.filter((r) => r.round !== skipRound);
  if (past.length === 0) return null;
  return (
    <div className="history">
      <Eyebrow>Your visions</Eyebrow>
      {past.map((r) => (
        <span key={r.round}>
          Night {r.round}: {nameOf(r.target)} {r.isWerewolf ? "is a Werewolf" : "is not a Werewolf"}
        </span>
      ))}
    </div>
  );
}
