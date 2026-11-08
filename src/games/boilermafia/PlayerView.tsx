"use client";

/** Each phone. Shows this player's private role and the actions available to them right now. */
import { useState } from "react";
import { Button } from "@/components/Button";
import { Countdown } from "@/components/Countdown";
import type { GameViewProps } from "@/platform/game-contract";
import { PHASE_TITLE, ROLE_LABEL } from "./narration";
import type { Intent, PrivateState, PublicState } from "./types";
import { PickList, ROLE_STYLE } from "./ui";

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
      <Shell>
        <p className="text-white/60">Joining the game…</p>
      </Shell>
    );
  }

  const alive = pub.alive.includes(me.id);
  const role = priv.role;
  const style = ROLE_STYLE[role];

  return (
    <Shell>
      <header className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold tracking-[0.25em] text-white/40 uppercase">{PHASE_TITLE[pub.phase]}</p>
          <p className="mt-1 text-lg font-semibold">{me.nickname}</p>
        </div>
        <div className="flex items-center gap-3">
          {pub.deadline !== null && pub.phase !== "over" && (
            <Countdown deadline={pub.deadline} now={serverNow} className="text-2xl font-semibold" />
          )}
          {pub.phase !== "reveal" && (
            <button
              type="button"
              onClick={() => setShowRole((v) => !v)}
              className="rounded-full bg-white/10 px-3 py-1.5 text-sm font-medium text-white/80 active:scale-95"
            >
              {showRole ? `${style.emoji} ${ROLE_LABEL[role]}` : "Role"}
            </button>
          )}
        </div>
      </header>

      <div className="mt-8 flex-1">
        {!alive && pub.phase !== "over" ? (
          <Dead pub={pub} role={role} />
        ) : (
          <PhaseBody pub={pub} priv={priv} meId={me.id} nameOf={nameOf} send={send} busy={busy} />
        )}
      </div>

      {error && (
        <p role="alert" className="animate-rise bg-blood/15 text-blood mt-4 rounded-2xl px-4 py-3 text-center text-sm">
          {error}
        </p>
      )}
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="bg-night flex min-h-dvh flex-col px-5 pt-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-white">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col">{children}</div>
    </main>
  );
}

function Dead({ pub, role }: { pub: PublicState; role: PrivateState["role"] }) {
  return (
    <div className="animate-rise pt-10 text-center">
      <div className="text-6xl">🪦</div>
      <h2 className="mt-6 text-2xl font-semibold">You are dead</h2>
      <p className="mt-2 text-white/60">
        You were {role === "werewolf" ? "a" : role === "villager" ? "a" : "the"} {ROLE_LABEL[role]}. Stay quiet and
        watch the big screen.
      </p>
      <p className="mt-8 text-sm text-white/40">{pub.alive.length} players still alive</p>
    </div>
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
    case "reveal":
      return (
        <RoleCard
          priv={priv}
          nameOf={nameOf}
          ready={pub.ready.includes(meId)}
          onReady={() => send({ type: "ready" })}
          busy={busy}
        />
      );
    case "night":
      return <NightAction {...props} />;
    case "dawn":
      return (
        <Notice emoji="🌅" title="Morning has come">
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
        <Notice emoji="⚖️" title="The votes are in">
          {v?.eliminated ? `${nameOf(v.eliminated)} has been banished.` : "Nobody was banished."}
        </Notice>
      );
    }
    case "over": {
      const won = pub.winner === "werewolves" ? priv.role === "werewolf" : priv.role !== "werewolf";
      return (
        <Notice emoji={won ? "🏆" : "💀"} title={won ? "You won" : "You lost"}>
          {pub.winner === "village" ? "The village wins." : "The werewolves win."} You were{" "}
          {priv.role === "werewolf" || priv.role === "villager" ? "a" : "the"} {ROLE_LABEL[priv.role]}.
        </Notice>
      );
    }
  }
}

function RoleCard({
  priv,
  nameOf,
  ready,
  onReady,
  busy,
}: {
  priv: PrivateState;
  nameOf: (id: string) => string;
  ready: boolean;
  onReady: () => void;
  busy: boolean;
}) {
  const style = ROLE_STYLE[priv.role];
  return (
    <div className="animate-rise flex h-full flex-col">
      <div className={`rounded-[2rem] bg-gradient-to-b p-8 text-center ring-1 ${style.tint}`}>
        <div className="text-7xl">{style.emoji}</div>
        <p className="mt-6 text-sm font-semibold tracking-[0.25em] text-white/60 uppercase">You are</p>
        <h2 className="font-display mt-1 text-4xl font-semibold">
          {priv.role === "werewolf" || priv.role === "villager" ? "a" : "the"} {ROLE_LABEL[priv.role]}
        </h2>
        <p className="mt-4 text-white/75">{style.blurb}</p>
        {priv.packmates.length > 0 && (
          <p className="mt-6 rounded-2xl bg-black/25 px-4 py-3 text-sm">
            Your pack: <span className="font-semibold">{priv.packmates.map(nameOf).join(", ")}</span>
          </p>
        )}
        {priv.role === "werewolf" && priv.packmates.length === 0 && (
          <p className="mt-6 rounded-2xl bg-black/25 px-4 py-3 text-sm">You hunt alone.</p>
        )}
      </div>
      <div className="mt-auto pt-8">
        <Button size="xl" className="w-full" disabled={ready || busy} onClick={onReady}>
          {ready ? "Waiting for everyone…" : "I'm ready"}
        </Button>
      </div>
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
      <Action title="Choose your victim" hint="The pack's most popular pick is attacked. You can change your mind.">
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
      </Action>
    );
  }

  if (priv.role === "doctor") {
    return (
      <Action
        title={priv.nightTarget ? `Protecting ${nameOf(priv.nightTarget)}` : "Who will you protect?"}
        hint={priv.nightTarget ? "Your choice is locked in. Close your eyes." : "You may protect yourself."}
      >
        <PickList
          options={pub.alive.map((id) => ({ id, label: id === meId ? `${nameOf(id)} (you)` : nameOf(id) }))}
          selected={priv.nightTarget}
          onPick={(id) => void send({ type: "nightAction", target: id })}
          disabled={busy || priv.nightTarget !== null}
        />
      </Action>
    );
  }

  if (priv.role === "seer") {
    const tonight = priv.seerResults.find((r) => r.round === pub.round);
    return (
      <Action
        title={tonight ? "Your vision" : "Whose soul will you see?"}
        hint={tonight ? undefined : "You get one look per night."}
      >
        {tonight ? (
          <div className="animate-rise rounded-[2rem] bg-white/8 p-8 text-center">
            <div className="text-6xl">{tonight.isWerewolf ? "🐺" : "🕊️"}</div>
            <p className="mt-4 text-2xl font-semibold">
              {nameOf(tonight.target)} {tonight.isWerewolf ? "is a Werewolf" : "is not a Werewolf"}
            </p>
          </div>
        ) : (
          <PickList
            options={others.map((id) => ({ id, label: nameOf(id) }))}
            selected={null}
            onPick={(id) => void send({ type: "nightAction", target: id })}
            disabled={busy}
          />
        )}
        <SeerHistory priv={priv} nameOf={nameOf} skipRound={pub.round} />
      </Action>
    );
  }

  return (
    <Action title="Who do you suspect?" hint="You're asleep. This is just for you, nobody sees it.">
      <PickList options={others.map((id) => ({ id, label: nameOf(id) }))} selected={decoy} onPick={setDecoy} />
    </Action>
  );
}

function DayVote({ pub, priv, meId, nameOf, send, busy }: BodyProps) {
  const myVote = pub.votes[meId] ?? null;
  const count = (id: string) => Object.values(pub.votes).filter((t) => t === id).length;
  const detail = (id: string) => (count(id) ? `${count(id)} vote${count(id) === 1 ? "" : "s"}` : undefined);
  return (
    <Action
      title="Who should be banished?"
      hint="Most votes is banished. You can change your vote until time runs out."
    >
      <PickList
        options={[
          ...pub.alive.filter((id) => id !== meId).map((id) => ({ id, label: nameOf(id), detail: detail(id) })),
          { id: "skip", label: "Skip vote", detail: detail("skip") },
        ]}
        selected={myVote}
        onPick={(id) => void send({ type: "vote", target: id })}
        disabled={busy}
      />
      {priv.role === "seer" && <SeerHistory priv={priv} nameOf={nameOf} />}
    </Action>
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
    <div className="mt-8">
      <p className="text-xs font-semibold tracking-[0.2em] text-white/40 uppercase">Your visions</p>
      <ul className="mt-2 space-y-1 text-sm text-white/70">
        {past.map((r) => (
          <li key={r.round}>
            Night {r.round}: {nameOf(r.target)} {r.isWerewolf ? "🐺 is a Werewolf" : "🕊️ is not a Werewolf"}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Action({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="animate-rise">
      <h2 className="font-display text-3xl font-semibold">{title}</h2>
      {hint && <p className="mt-2 text-white/60">{hint}</p>}
      <div className="mt-6">{children}</div>
    </section>
  );
}

function Notice({ emoji, title, children }: { emoji: string; title: string; children: React.ReactNode }) {
  return (
    <div className="animate-rise pt-10 text-center">
      <div className="text-6xl">{emoji}</div>
      <h2 className="font-display mt-6 text-3xl font-semibold">{title}</h2>
      <p className="mt-3 text-lg text-white/70">{children}</p>
    </div>
  );
}
