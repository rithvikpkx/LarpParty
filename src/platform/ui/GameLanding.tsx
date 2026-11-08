"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Art, Button, CodeInput, Panel, Screen, Toast } from "@/components/ui";
import { getGame } from "@/games";
import { theme } from "@/themes/store";
import { createRoom } from "../actions";
import { AuthGate } from "../auth";

/** /[game]: join with a code (phones) or host a room (the big screen). */
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
    // The room starts in whatever style the host is using right now.
    const style = document.documentElement.dataset.style;
    const res = await createRoom(slug, settings, style);
    if (!res.ok) {
      setBusy(false);
      setError(res.error);
      return;
    }
    theme.closePicker();
    router.push(`/${slug}/${res.data.code}`);
  };

  const join = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length === 4) router.push(`/${slug}/${code}`);
  };

  return (
    <Screen kind="phone" className="join" kanji="入">
      <Link href="/" className="back">
        ← All games
      </Link>
      <div className="join-hero">
        <div>
          <h1 className="disp">{game.name}</h1>
          <p>{game.description}</p>
        </div>
        <Art name={game.art ?? "moon"} />
      </div>

      {mode === "choose" ? (
        <>
          <form onSubmit={join}>
            <Panel label="JOIN" className="stack">
              <h3>Join a game</h3>
              <CodeInput value={code} onChange={setCode} />
              <Button type="submit" wide disabled={code.length !== 4}>
                Join
              </Button>
            </Panel>
          </form>
          <div className="or">or</div>
          <Button variant="ghost" wide onClick={() => setMode("create")}>
            Create game
          </Button>
        </>
      ) : (
        <>
          <Panel label="SETTINGS" className="stack">
            <h3>Game settings</h3>
            <SettingsForm value={settings} onChange={setSettings} />
          </Panel>
          {error && <Toast>{error}</Toast>}
          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <Button variant="ghost" onClick={() => setMode("choose")} disabled={busy}>
              Back
            </Button>
            <Button wide onClick={create} disabled={busy}>
              {busy ? "Creating…" : "Create room"}
            </Button>
          </div>
        </>
      )}
    </Screen>
  );
}
