"use client";
import { useEffect, useState } from "react";
import { Eyebrow, Screen, StyleButton, Timer } from "@/components/ui";
import type { GameViewProps, SettingsFormProps } from "@/platform/game-contract";
import type { Intent, PrivateState, PublicState, Settings } from "./engine";

type Props = GameViewProps<PublicState, PrivateState, Intent>;
// Themed classes from src/themes/themes.css, so every UI style applies to this game.
const button = "btn";
const card = "panel";
export function SettingsForm({ value, onChange }: SettingsFormProps<Settings>) {
  return (
    <div>
      <p className="muted mb-4 text-sm">
        Messages are private during texting, then all messages and date choices are shown to everyone during the
        results.
      </p>
      <label className="flex items-center justify-between gap-3">
        Rounds{" "}
        <select
          className="field"
          style={{ width: "auto" }}
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
    </div>
  );
}
export function HostView({ roomCode, players, publicState: p, dispatch, serverNow, playAgain }: Props) {
  const name = (id: string) => players.find((x) => x.id === id)?.nickname ?? "Player";
  const [error, setError] = useState("");
  return (
    <Screen kind="tv" className="is-night" kanji="恋">
      <div className="mx-auto w-full max-w-4xl space-y-8 overflow-y-auto">
        <header className="muted flex justify-between">
          <span>Monster Seeking Match · {roomCode}</span>
          <span>
            Round {p.round} / {p.rounds}
          </span>
        </header>
        <div className="panel relative overflow-hidden p-5 text-center">
          <div aria-hidden="true" className="text-5xl">
            🌙　☁️　🏚️　☁️　🦇
          </div>
          <Eyebrow className="mt-2">Welcome to Heartbreak Manor</Eyebrow>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            {p.ids.map((id, i) => (
              <div key={id} className="tile min-w-20 flex-col px-3 py-2">
                <div aria-hidden="true" className="text-2xl">
                  {["🎃", "🦇", "👻", "🐺", "🕸️", "🧛", "🧟", "🕯️", "🦉", "🔮", "🕷️", "🌙"][i % 12]}
                </div>
                <div className="mt-1 text-sm font-semibold">{name(id)}</div>
              </div>
            ))}
          </div>
          <p className="muted mt-3 text-xs">Costumes are disguises, not secret roles.</p>
        </div>
        <section className="py-8 text-center">
          <Eyebrow>{p.phase}</Eyebrow>
          <h1 className="disp mt-4 text-4xl sm:text-6xl">
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
          {p.deadline && (
            <div className="mt-6 text-4xl">
              <Timer deadline={p.deadline} now={serverNow} className="timer" />
            </div>
          )}
          <p className="muted mt-4">
            {p.phase === "texting"
              ? "Send a few private messages from your phone."
              : p.phase === "dating"
                ? `${p.locked.length} of ${p.ids.length} dates locked in`
                : p.phase === "reveal"
                  ? "Welcome to the manor. Check your phone for your secret role. Your messages will be revealed after date night."
                  : ""}
          </p>
        </section>
        {p.phase === "results" && p.reveal && <DateReveal p={p} name={name} serverNow={serverNow} />}
        {p.phase === "over" && (
          <section className={card}>
            <h2 className="disp mb-4 text-2xl">Final standings</h2>
            {[...p.ids]
              .sort((a, b) => p.scores[b] - p.scores[a])
              .map((id) => (
                <div key={id} className="flex justify-between border-t border-current/10 py-3">
                  <span>
                    {name(id)} {p.roles[id] && <span className="muted">· {p.roles[id]}</span>}
                  </span>
                  <span>{p.scores[id]} pts</span>
                </div>
              ))}
          </section>
        )}
        {error && (
          <p role="alert" className="toast">
            {error}
          </p>
        )}
        <div className="flex justify-center gap-3 text-center">
          <StyleButton />
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
    </Screen>
  );
}

function DateReveal({ p, name, serverNow }: { p: PublicState; name: (id: string) => string; serverNow: () => number }) {
  const [, setClock] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setClock((v) => v + 1), 500);
    return () => clearInterval(timer);
  }, []);
  const reveal = p.reveal!;
  const elapsed = Math.max(0, serverNow() - reveal.startedAt);
  const step = Math.floor(elapsed / 5000);
  const message = reveal.messages[step];
  const chooser = reveal.order[step - reveal.messages.length];
  const target = chooser ? reveal.choices[chooser] : null;
  const mutual = !!target && reveal.choices[target] === chooser;
  const theirChoice = target ? reveal.choices[target] : null;
  return (
    <section
      key={step}
      className="panel p-8 text-center"
      style={{ animation: "rise 600ms var(--ease) both" }}
      aria-live="polite"
    >
      {message ? (
        <>
          <p className="eyebrow">
            The manor mail · {step + 1} / {reveal.messages.length}
          </p>
          <h2 className="disp my-4 text-3xl">What did they say?</h2>
          <div className="mx-auto max-w-xl space-y-2 text-left">
            <p className="msg">
              <span style={{ color: "var(--accent-text, var(--accent))" }}>
                {name(message.from)} → {name(message.to)}:
              </span>{" "}
              {message.text}
            </p>
          </div>
        </>
      ) : chooser ? (
        <>
          <p className="eyebrow">
            Date night · {step - reveal.messages.length + 1} / {reveal.order.length}
          </p>
          <div className="my-6 text-4xl sm:text-5xl">🦇　{target ? "💌" : "🥀"}　👻</div>
          <h2 className="disp text-3xl">
            {target ? `${name(chooser)} asked ${name(target)}` : `${name(chooser)} stayed in tonight`}
          </h2>
          {target && elapsed % 5000 >= 2300 && (
            <p className="mt-4 text-xl" style={{ color: "var(--accent-text, var(--accent))" }}>
              {mutual
                ? "It’s a match! ♥"
                : theirChoice
                  ? `Rejected! ${name(target)} chose ${name(theirChoice)}.`
                  : `Rejected! ${name(target)} didn’t choose anyone.`}
            </p>
          )}
        </>
      ) : (
        <>
          <p className="eyebrow">The scoreboard</p>
          <h2 className="disp my-4 text-3xl">Hearts and heartbreak</h2>
          {[...p.ids]
            .sort((a, b) => p.scores[b] - p.scores[a])
            .map((id) => (
              <div key={id} className="mx-auto flex max-w-md justify-between border-t border-current/10 py-2">
                <span>{name(id)}</span>
                <span>
                  {p.scores[id]} pts ({p.gains[id] >= 0 ? "+" : ""}
                  {p.gains[id]})
                </span>
              </div>
            ))}
        </>
      )}
    </section>
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
  if (!secret)
    return (
      <Screen kind="phone" className="is-night">
        <p className="center-msg">Loading your secret role…</p>
      </Screen>
    );
  const descriptions = {
    Vampire: "On a mutual date, steal half your date’s round points.",
    Werewolf: "Mutual dates score triple on odd rounds and zero on even rounds.",
    Ghost: "Choose someone who rejects you to earn 100 points.",
    "Serial Flirt": "Send twelve messages each round instead of six.",
  };
  return (
    <Screen kind="phone" className="is-night" kanji="恋">
      <div className="space-y-5">
        <header className="role-head muted text-sm">
          <span>
            Round {p.round} / {p.rounds}
          </span>
          <span>
            {p.phase} {p.deadline && <Timer deadline={p.deadline} now={serverNow} className="timer-sm" />}{" "}
            <StyleButton />
          </span>
        </header>
        <section className={card}>
          <p className="eyebrow">Your secret identity</p>
          <h1 className="disp mt-2 text-3xl">{secret.role}</h1>
          <p className="muted mt-2">{descriptions[secret.role]}</p>
          <p className="mt-3 text-sm" style={{ color: "var(--accent-text, var(--accent))" }}>
            Messages and date choices will be shown to everyone after dating. Mutual dates earn 100 points before
            powers; the highest score wins.
          </p>
          <p className="mt-3">
            Your score: {p.phase === "results" ? p.scores[me.id] - (p.gains[me.id] ?? 0) : p.scores[me.id]} pts
          </p>
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
            <h2 className="disp text-xl">Send a secret message</h2>
            <p className="muted mt-1 text-sm">
              {Math.max(0, (secret.role === "Serial Flirt" ? 12 : 6) - secret.sent)} messages left this round
            </p>
            <select
              aria-label="Recipient"
              className="field mt-4"
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
              className="field mt-3"
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
            <h2 className="disp text-xl">Pick your date</h2>
            <p className="muted my-3">A mutual match earns 100 points before powers.</p>
            <div className="grid gap-2">
              {p.ids
                .filter((id) => id !== me.id)
                .map((id) => (
                  <button
                    key={id}
                    disabled={busy || secret.locked}
                    onClick={() => void send({ type: "choose", target: id })}
                    className={`pick ${secret.choice === id ? "on" : ""}`}
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
        {p.phase === "results" && (
          <section className={card}>Watch the manor screen for messages, dates, and the results!</section>
        )}
        {p.phase === "over" && (
          <section className={card}>
            <h2 className="disp text-xl">{p.phase === "over" ? "Final scores" : "Round results"}</h2>
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
            <h2 className="disp mb-3 text-xl">Your messages</h2>
            {secret.messages.map((m, i) => (
              <p key={i} className="msg mb-2">
                <span style={{ color: "var(--accent-text, var(--accent))" }}>
                  {m.from === me.id ? `You → ${name(m.to)}` : name(m.from)}:
                </span>{" "}
                {m.text}
              </p>
            ))}
          </section>
        )}
        {error && (
          <p role="alert" className="toast">
            {error}
          </p>
        )}
      </div>
    </Screen>
  );
}
