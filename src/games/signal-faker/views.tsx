"use client";
import { useEffect, useRef, useState } from "react";
import { Countdown } from "@/components/Countdown";
import type { GameViewProps, SettingsFormProps } from "@/platform/game-contract";
import type { Intent, PrivateState, PublicState, Settings } from "./engine";

type Props = GameViewProps<PublicState, PrivateState, Intent>;
const button = "rounded-2xl bg-cyan-300 px-5 py-3 font-bold text-slate-950 disabled:opacity-40";
const panel = "rounded-3xl border border-white/10 bg-white/10 p-5";
const categoryLabels = {
  hands: "Hand signals",
  numbers: "Finger count",
  pointing: "Point it out",
  faces: "Face the music",
  words: "Wordplay",
};
const categoryIcons = { hands: "✋", numbers: "🖐️", pointing: "👉", faces: "🎭", words: "💬" };
export function SettingsForm({ value, onChange }: SettingsFormProps<Settings>) {
  return (
    <div>
      <p className="mb-4 text-sm text-slate-600">
        Everyone needs to be together and able to see each other. The host screen runs the countdown.
      </p>
      <label className="flex items-center justify-between">
        Rounds{" "}
        <select
          className="rounded-xl border p-3"
          value={value.rounds}
          onChange={(e) => onChange({ rounds: Number(e.target.value) })}
        >
          {[3, 4, 5].map((n) => (
            <option key={n} value={n}>
              {n} rounds
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
export function HostView({ roomCode, players, publicState: p, dispatch, serverNow, playAgain }: Props) {
  const [error, setError] = useState("");
  const [sound, setSound] = useState(false);
  const [now, setNow] = useState(0);
  const audio = useRef<AudioContext | null>(null);
  const lastBeep = useRef("");
  const name = (id: string) => players.find((x) => x.id === id)?.nickname ?? "Player";
  useEffect(() => {
    const timer = setInterval(() => setNow(serverNow()), 200);
    return () => clearInterval(timer);
  }, [serverNow]);
  const seconds = p.deadline === null || now === 0 ? 0 : Math.max(0, Math.ceil((p.deadline - now) / 1000));
  useEffect(() => {
    if (!sound || p.phase !== "action" || now === 0 || seconds > 3 || !audio.current) return;
    const key = `${p.round}-${seconds}`;
    if (lastBeep.current === key) return;
    lastBeep.current = key;
    const ctx = audio.current;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.frequency.value = seconds === 0 ? 1040 : seconds === 1 ? 880 : 660;
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.2);
  }, [sound, p.phase, p.round, seconds, now]);
  return (
    <main className="min-h-dvh bg-gradient-to-br from-slate-950 via-indigo-950 to-cyan-950 p-6 text-white">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="flex flex-wrap justify-between gap-2 text-white/65">
          <span>Signal Faker · {roomCode}</span>
          <span>
            Round {p.round} / {p.rounds}
          </span>
        </header>
        <section key={`${p.round}-${p.phase}`} className="animate-rise py-8 text-center">
          <div aria-hidden="true" className={`mb-4 text-6xl ${p.phase === "perform" ? "animate-bounce" : ""}`}>
            {categoryIcons[p.category]}
          </div>
          <p className="text-sm tracking-[0.3em] text-cyan-300 uppercase">
            {categoryLabels[p.category]} · {p.phase}
          </p>
          <h1 className="mt-4 text-4xl font-bold sm:text-6xl">
            {
              {
                action:
                  p.category === "words"
                    ? "Write your answer"
                    : seconds === 0 && now
                      ? "Act now!"
                      : "Read. Blend in. Act.",
                perform: p.category === "words" ? "The answers are in!" : "Act now!",
                discussion: "Who looked suspicious?",
                vote: "Find the Faker",
                results: "The signal is in",
                over: "Final standings",
              }[p.phase]
            }
          </h1>
          {p.deadline && <Countdown deadline={p.deadline} now={serverNow} className="mt-5 text-6xl font-bold" />}
          <p className="mt-4 text-lg text-white/70">
            {p.phase === "action"
              ? p.category === "words"
                ? "Answer the secret question on your phone."
                : seconds <= 3 && now > 0
                  ? "Everyone act at zero!"
                  : "Read your phone. One player has a different instruction."
              : p.phase === "perform"
                ? p.category === "words"
                  ? "Compare the answers. Who had a different question?"
                  : "Everyone make your move!"
                : p.phase === "discussion"
                  ? "Discuss what you saw, but don’t show your phone."
                  : p.phase === "vote"
                    ? `${p.locked.length} of ${p.ids.length} votes locked on phones`
                    : ""}
          </p>
          {!sound && (
            <button
              className="mt-4 rounded-xl border border-white/30 px-4 py-2"
              onClick={() => {
                const ctx = new AudioContext();
                audio.current = ctx;
                void ctx.resume();
                setSound(true);
              }}
            >
              Enable countdown sound
            </button>
          )}
        </section>
        {p.category === "words" && ["perform", "discussion", "vote", "results", "over"].includes(p.phase) && (
          <section className={`${panel} animate-rise`}>
            <h2 className="mb-4 text-2xl font-bold">What everyone said</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {p.ids.map((id) => (
                <p key={id} className="rounded-xl bg-white/10 p-4">
                  <b className="text-cyan-200">{name(id)}</b>
                  <br />
                  {p.responses[id] || "No answer submitted"}
                </p>
              ))}
            </div>
          </section>
        )}
        {p.result && (p.phase === "results" || p.phase === "over") && (
          <section className={panel}>
            <h2 className="text-3xl font-bold">{p.result.caught ? "Faker caught!" : "The Faker got away!"}</h2>
            <p className="mt-3 text-xl">
              <strong>{name(p.result.faker)}</strong> was the Faker.{" "}
              {p.result.accused ? `${name(p.result.accused)} was accused.` : "The vote was tied or nobody voted."}
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <p className="rounded-xl bg-white/10 p-4">
                <b>Everyone else saw</b>
                <br />
                {p.result.humanPrompt}
              </p>
              <p className="rounded-xl bg-white/10 p-4">
                <b>The Faker saw</b>
                <br />
                {p.result.fakerPrompt}
              </p>
            </div>
            <h3 className="mt-5 font-bold">The votes</h3>
            {p.ids.map((id) => (
              <p key={id} className="mt-1 text-white/75">
                {name(id)} → {p.result!.votes[id] ? name(p.result!.votes[id]!) : "no vote"}
              </p>
            ))}
          </section>
        )}
        {(p.phase === "results" || p.phase === "over") && (
          <section className={panel}>
            <h2 className="mb-3 text-xl font-bold">Leaderboard</h2>
            {[...p.ids]
              .sort((a, b) => p.scores[b] - p.scores[a])
              .map((id) => (
                <p className="flex justify-between border-t border-white/10 py-2" key={id}>
                  <span>{name(id)}</span>
                  <span>
                    {p.scores[id]} pts {p.phase === "results" && `(+${p.result?.gains[id] ?? 0})`}
                  </span>
                </p>
              ))}
          </section>
        )}
        {error && <p role="alert">{error}</p>}
        <div className="text-center">
          {p.phase === "over" ? (
            playAgain && (
              <button className={button} onClick={() => void playAgain()}>
                Play again
              </button>
            )
          ) : (
            <button
              className={button}
              onClick={async () => {
                const r = await dispatch({ type: "advance" });
                setError(r.error ?? "");
              }}
            >
              Advance phase
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
export function PlayerView({ me, players, publicState: p, privateState: secret, dispatch, serverNow }: Props) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState({ round: p.round, text: "" });
  const answer = draft.round === p.round ? draft.text : "";
  const name = (id: string) => players.find((x) => x.id === id)?.nickname ?? "Player";
  const send = async (intent: Intent) => {
    setBusy(true);
    const r = await dispatch(intent);
    setError(r.error ?? "");
    setBusy(false);
  };
  if (!secret) return <main className="p-8">Reconnecting to your secret prompt…</main>;
  return (
    <main className="min-h-dvh bg-gradient-to-br from-slate-950 via-indigo-950 to-cyan-950 p-5 text-white">
      <div className="mx-auto max-w-lg space-y-5">
        <header className="flex justify-between text-white/60">
          <span>
            Round {p.round} / {p.rounds}
          </span>
          <span>
            {p.phase} {p.deadline && <Countdown deadline={p.deadline} now={serverNow} />}
          </span>
        </header>
        {p.phase === "action" && (
          <section className={panel}>
            <p className="text-xs tracking-widest text-cyan-300 uppercase">
              {categoryLabels[p.category]} · {secret.faker ? "You are the Faker · this is your hint" : "Your secret instruction"} · don’t show anyone
            </p>
            <h1 className="mt-4 text-3xl font-bold">{secret.prompt}</h1>
            {p.category === "words" ? (
              <div>
                <p className="mt-4 text-white/70">
                  Your answer will be shown to everyone when time runs out. You may update it until then.
                </p>
                <textarea
                  aria-label="Your answer"
                  maxLength={100}
                  className="mt-3 w-full rounded-xl bg-white p-3 text-slate-950"
                  value={answer}
                  onChange={(e) => setDraft({ round: p.round, text: e.target.value })}
                  placeholder="Type your answer…"
                />
                <button
                  className={button}
                  disabled={busy || !answer.trim()}
                  onClick={() => void send({ type: "answer", text: answer })}
                >
                  Submit answer
                </button>
                {secret.response && <p className="mt-2 text-cyan-200">Saved: {secret.response}</p>}
              </div>
            ) : (
              <p className="mt-5 text-white/70">
                Watch the host screen. Act together at zero, then discuss what you saw.
              </p>
            )}
          </section>
        )}
        {p.phase === "perform" && (
          <section className={`${panel} animate-pulse`}>
            <h1 className="text-3xl font-bold">
              {p.category === "words" ? "Answers are on the host screen!" : "Act now!"}
            </h1>
            <p className="mt-3">{p.category === "words" ? "Compare everyone’s answers." : secret.prompt}</p>
          </section>
        )}
        {p.phase === "discussion" && (
          <section className={panel}>
            <h1 className="text-3xl font-bold">Talk it out</h1>
            <p className="mt-3 text-white/70">Who hesitated or acted strangely? Do not show your prompt.</p>
          </section>
        )}
        {p.phase === "vote" && (
          <section className={panel}>
            <h1 className="text-3xl font-bold">Who is the Faker?</h1>
            <p className="my-3 text-white/70">Choose a suspect, then lock your vote.</p>
            <div className="grid gap-2">
              {p.ids
                .filter((id) => id !== me.id)
                .map((id) => (
                  <button
                    key={id}
                    disabled={busy || secret.locked}
                    className={`rounded-xl p-4 text-left ${secret.vote === id ? "bg-cyan-300 text-slate-950" : "bg-white/10"}`}
                    onClick={() => void send({ type: "vote", target: id })}
                  >
                    {name(id)}
                  </button>
                ))}
            </div>
            <button
              className={`${button} mt-4`}
              disabled={busy || !secret.vote || secret.locked}
              onClick={() => void send({ type: "lock" })}
            >
              {secret.locked ? "Vote locked" : "Lock vote"}
            </button>
          </section>
        )}
        {(p.phase === "results" || p.phase === "over") && p.result && (
          <section className={panel}>
            <h1 className="text-3xl font-bold">{p.result.caught ? "Faker caught!" : "Faker escaped!"}</h1>
            <p className="mt-3">{name(p.result.faker)} was the Faker.</p>
            <p className="mt-2">
              You earned {p.result.gains[me.id]} points. Total: {p.scores[me.id]}
            </p>
            <p className="mt-4 text-white/70">Watch the host screen for the prompts and votes.</p>
          </section>
        )}
        <section className="text-sm text-white/60">
          Humans score 100 each if the Faker is caught. Otherwise the Faker scores 150. Highest total wins; tied votes
          catch nobody.
        </section>
        {error && (
          <p role="alert" className="text-rose-300">
            {error}
          </p>
        )}
      </div>
    </main>
  );
}
