"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { getGame } from "@/games";
import { createRoom } from "../actions";
import { AuthGate } from "../auth";

/** /[game]: create a room (host) or enter a code (player). */
export function GameLanding({ slug }: { slug: string }) {
  return (
    <AuthGate>
      <Landing slug={slug} />
    </AuthGate>
  );
}

function Landing({ slug }: { slug: string }) {
  const game = getGame(slug)!;
  const router = useRouter();
  const [mode, setMode] = useState<"choose" | "create">("choose");
  const [settings, setSettings] = useState<unknown>(game.defaultSettings);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { SettingsForm } = game;

  const create = async () => {
    setBusy(true);
    setError(null);
    const res = await createRoom(slug, settings);
    if (!res.ok) {
      setBusy(false);
      setError(res.error);
      return;
    }
    router.push(`/${slug}/${res.data.code}`);
  };

  const join = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length === 4) router.push(`/${slug}/${code}`);
  };

  return (
    <main className="mx-auto min-h-dvh max-w-xl px-5 py-10 sm:py-16">
      <Link href="/" className="text-accent text-sm font-medium">
        ← All games
      </Link>
      <h1 className="font-display mt-4 text-5xl font-semibold tracking-tight">{game.name}</h1>
      <p className="text-muted mt-3 text-lg">{game.description}</p>

      {mode === "choose" ? (
        <div className="mt-10 grid gap-4">
          <Card>
            <h2 className="text-xl font-semibold">Join a game</h2>
            <p className="text-muted mt-1">Enter the code on the big screen.</p>
            <form onSubmit={join} className="mt-5 flex gap-3">
              <input
                value={code}
                onChange={(e) =>
                  setCode(
                    e.target.value
                      .toUpperCase()
                      .replace(/[^A-Z]/g, "")
                      .slice(0, 4),
                  )
                }
                placeholder="ABCD"
                inputMode="text"
                autoCapitalize="characters"
                autoComplete="off"
                aria-label="Room code"
                className="focus:border-accent focus:ring-accent/15 h-14 min-w-0 flex-1 rounded-2xl border border-black/10 bg-white px-4 text-center font-mono text-2xl font-semibold tracking-[0.4em] uppercase outline-none focus:ring-4"
              />
              <Button type="submit" disabled={code.length !== 4}>
                Join
              </Button>
            </form>
          </Card>
          <Card>
            <h2 className="text-xl font-semibold">Host a game</h2>
            <p className="text-muted mt-1">Use this device as the big screen everyone watches.</p>
            <Button variant="secondary" className="mt-5 w-full" onClick={() => setMode("create")}>
              Create game
            </Button>
          </Card>
        </div>
      ) : (
        <div className="mt-10">
          <Card>
            <h2 className="mb-5 text-xl font-semibold">Game settings</h2>
            <SettingsForm value={settings} onChange={setSettings} />
          </Card>
          {error && <p className="text-blood mt-4 text-center">{error}</p>}
          <div className="mt-6 flex gap-3">
            <Button variant="secondary" onClick={() => setMode("choose")} disabled={busy}>
              Back
            </Button>
            <Button className="flex-1" onClick={create} disabled={busy}>
              {busy ? "Creating…" : "Create room"}
            </Button>
          </div>
        </div>
      )}
    </main>
  );
}
