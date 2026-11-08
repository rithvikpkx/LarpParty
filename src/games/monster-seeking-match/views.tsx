"use client";
import { useState } from "react";
import { Countdown } from "@/components/Countdown";
import type { GameViewProps, SettingsFormProps } from "@/platform/game-contract";
import type { Intent, PrivateState, PublicState, Settings } from "./engine";

type Props = GameViewProps<PublicState, PrivateState, Intent>;
const button = "rounded-2xl bg-fuchsia-600 px-5 py-3 font-semibold text-white disabled:opacity-40";
const card = "rounded-3xl bg-white/10 p-5";
export function SettingsForm({ value, onChange }: SettingsFormProps<Settings>) {
  return (
    <label className="flex items-center justify-between">
      Rounds{" "}
      <select
        className="rounded-xl border p-3"
        value={value.rounds}
        onChange={(e) => onChange({ rounds: Number(e.target.value) })}
      >
        {[3, 4, 5, 6, 7, 8].map((n) => (
          <option key={n} value={n}>
            {n} rounds
          </option>
        ))}
      </select>
    </label>
  );
}
export function HostView({ roomCode, players, publicState: p, dispatch, serverNow, playAgain }: Props) {
  const name = (id: string) => players.find((x) => x.id === id)?.nickname ?? "Player";
  const [error, setError] = useState("");
  return (
    <main className="min-h-dvh bg-gradient-to-br from-indigo-950 via-purple-950 to-rose-950 p-8 text-white">
      <div className="mx-auto max-w-4xl space-y-8">
        <header className="flex justify-between text-white/70">
          <span>Monster Seeking Match · {roomCode}</span>
          <span>
            Round {p.round} / {p.rounds}
          </span>
        </header>
        <section className="py-8 text-center">
          <p className="text-sm tracking-widest text-pink-300 uppercase">{p.phase}</p>
          <h1 className="mt-4 text-4xl font-semibold sm:text-6xl">
            {
              {
                reveal: "Meet your inner monster",
                texting: "Make a connection",
                dating: "Who gets your heart?",
                results: "The dates are in",
                over: "Love is a monster",
              }[p.phase]
            }
          </h1>
          {p.deadline && <Countdown deadline={p.deadline} now={serverNow} className="mt-6 text-4xl" />}
          <p className="mt-4 text-white/70">
            {p.phase === "texting"
              ? "Send a few private messages from your phone."
              : p.phase === "dating"
                ? `${p.locked.length} of ${p.ids.length} dates locked in`
                : p.phase === "reveal"
                  ? "Check your phone for your secret role."
                  : ""}
          </p>
        </section>
        {(p.phase === "results" || p.phase === "over") && (
          <section className={card}>
            <h2 className="mb-4 text-2xl font-bold">{p.phase === "over" ? "Final standings" : "Leaderboard"}</h2>
            {p.phase === "results" && (
              <p className="mb-4 text-pink-200">
                {p.matches.length
                  ? p.matches.map(([a, b]) => `${name(a)} ♥ ${name(b)}`).join(" · ")
                  : "No mutual matches this round!"}
              </p>
            )}
            {[...p.ids]
              .sort((a, b) => p.scores[b] - p.scores[a])
              .map((id) => (
                <div key={id} className="flex justify-between border-t border-white/10 py-3">
                  <span>
                    {name(id)} {p.roles[id] && <span className="text-white/60">· {p.roles[id]}</span>}
                  </span>
                  <span>
                    {p.scores[id]} pts{" "}
                    {p.phase === "results" && (
                      <span className="text-pink-200">
                        ({p.gains[id] >= 0 ? "+" : ""}
                        {p.gains[id]})
                      </span>
                    )}
                  </span>
                </div>
              ))}
          </section>
        )}
        {error && <p role="alert">{error}</p>}
        <div className="text-center">
          {p.phase !== "over" ? (
            <button
              className={button}
              onClick={async () => {
                const r = await dispatch({ type: "advance" });
                setError(r.error ?? "");
              }}
            >
              Advance phase
            </button>
          ) : (
            playAgain && (
              <button className={button} onClick={() => void playAgain()}>
                Play again
              </button>
            )
          )}
        </div>
      </div>
    </main>
  );
}
export function PlayerView({ players, me, publicState: p, privateState: secret, dispatch, serverNow }: Props) {
  const [target, setTarget] = useState("");
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const name = (id: string) => players.find((x) => x.id === id)?.nickname ?? "Player";
  const send = async (intent: Intent) => {
    setBusy(true);
    const r = await dispatch(intent);
    setError(r.error ?? "");
    setBusy(false);
    return r.ok;
  };
  if (!secret) return <main className="p-8">Loading your secret role…</main>;
  const descriptions = {
    Vampire: "On a mutual date, steal half your date’s round points.",
    Werewolf: "Mutual dates score triple on odd rounds and zero on even rounds.",
    Ghost: "Choose someone who rejects you to earn 100 points.",
    "Serial Flirt": "Send twelve messages each round instead of six.",
  };
  return (
    <main className="min-h-dvh bg-gradient-to-br from-indigo-950 via-purple-950 to-rose-950 p-5 text-white">
      <div className="mx-auto max-w-lg space-y-5">
        <header className="flex justify-between text-sm text-white/70">
          <span>
            Round {p.round} / {p.rounds}
          </span>
          <span>
            {p.phase} {p.deadline && <Countdown deadline={p.deadline} now={serverNow} />}
          </span>
        </header>
        <section className={card}>
          <p className="text-xs tracking-widest text-pink-300 uppercase">Your secret identity</p>
          <h1 className="mt-2 text-3xl font-bold">{secret.role}</h1>
          <p className="mt-2 text-white/70">{descriptions[secret.role]}</p>
          <p className="mt-3">Your score: {p.scores[me.id]} pts</p>
        </section>
        {p.phase === "reveal" && (
          <button
            className={button}
            disabled={busy || p.ready.includes(me.id)}
            onClick={() => void send({ type: "ready" })}
          >
            {p.ready.includes(me.id) ? "Ready!" : "I’m ready"}
          </button>
        )}
        {p.phase === "texting" && (
          <section className={card}>
            <h2 className="text-xl font-bold">Send a secret message</h2>
            <p className="mt-1 text-sm text-white/70">
              {Math.max(0, (secret.role === "Serial Flirt" ? 12 : 6) - secret.sent)} messages left this round
            </p>
            <select
              aria-label="Recipient"
              className="mt-4 w-full rounded-xl bg-white p-3 text-black"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
            >
              <option value="">Choose a player</option>
              {p.ids
                .filter((id) => id !== me.id)
                .map((id) => (
                  <option key={id} value={id}>
                    {name(id)}
                  </option>
                ))}
            </select>
            <textarea
              aria-label="Message"
              className="mt-3 w-full rounded-xl bg-white p-3 text-black"
              maxLength={200}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Make your move…"
            />
            <button
              className={button}
              disabled={busy || !target || !text.trim()}
              onClick={async () => {
                if (await send({ type: "message", target, text })) setText("");
              }}
            >
              Send message
            </button>
          </section>
        )}
        {p.phase === "dating" && (
          <section className={card}>
            <h2 className="text-xl font-bold">Pick your date</h2>
            <p className="my-3 text-white/70">A mutual match earns 100 points before powers.</p>
            <div className="grid gap-2">
              {p.ids
                .filter((id) => id !== me.id)
                .map((id) => (
                  <button
                    key={id}
                    disabled={busy || secret.locked}
                    onClick={() => void send({ type: "choose", target: id })}
                    className={`rounded-xl p-3 text-left ${secret.choice === id ? "bg-pink-500" : "bg-white/10"}`}
                  >
                    {name(id)}
                  </button>
                ))}
            </div>
            <button
              className={`${button} mt-4`}
              disabled={busy || !secret.choice || secret.locked}
              onClick={() => void send({ type: "lock" })}
            >
              {secret.locked ? "Date locked ♥" : "Lock in date"}
            </button>
          </section>
        )}
        {(p.phase === "results" || p.phase === "over") && (
          <section className={card}>
            <h2 className="text-xl font-bold">{p.phase === "over" ? "Final scores" : "Round results"}</h2>
            {[...p.ids]
              .sort((a, b) => p.scores[b] - p.scores[a])
              .map((id) => (
                <p className="mt-2" key={id}>
                  {name(id)}: {p.scores[id]} pts {p.roles[id] && `· ${p.roles[id]}`}
                </p>
              ))}
          </section>
        )}
        {secret.messages.length > 0 && (
          <section className={card}>
            <h2 className="mb-3 text-xl font-bold">Your messages</h2>
            {secret.messages.map((m, i) => (
              <p key={i} className="mb-2 rounded-xl bg-white/10 p-3">
                <span className="text-pink-200">{m.from === me.id ? `You → ${name(m.to)}` : name(m.from)}:</span>{" "}
                {m.text}
              </p>
            ))}
          </section>
        )}
        {error && (
          <p role="alert" className="text-pink-200">
            {error}
          </p>
        )}
      </div>
    </main>
  );
}
