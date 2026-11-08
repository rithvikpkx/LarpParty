"use client";

import { Stepper } from "@/components/Stepper";
import type { SettingsFormProps } from "@/platform/game-contract";
import type { Settings } from "./types";

export function SettingsForm({ value, onChange }: SettingsFormProps<Settings>) {
  const set = <K extends keyof Settings>(key: K, n: Settings[K]) => {
    const next = { ...value, [key]: n };
    if (key === "minPlayers" && next.maxPlayers < next.minPlayers) next.maxPlayers = next.minPlayers;
    if (key === "maxPlayers" && next.minPlayers > next.maxPlayers) next.minPlayers = next.maxPlayers;
    onChange(next);
  };
  const specials = value.werewolves + value.doctors + value.seers;

  return (
    <div className="divide-y divide-black/5">
      <Section title="Players">
        <Stepper label="Minimum" value={value.minPlayers} min={3} max={20} onChange={(n) => set("minPlayers", n)} />
        <Stepper label="Maximum" value={value.maxPlayers} min={3} max={20} onChange={(n) => set("maxPlayers", n)} />
      </Section>
      <Section
        title="Roles"
        hint={`Everyone else is a Villager. ${specials} special role${specials === 1 ? "" : "s"}.`}
      >
        <Stepper label="Werewolves" value={value.werewolves} min={1} max={6} onChange={(n) => set("werewolves", n)} />
        <Stepper label="Doctors" value={value.doctors} min={0} max={3} onChange={(n) => set("doctors", n)} />
        <Stepper label="Seers" value={value.seers} min={0} max={3} onChange={(n) => set("seers", n)} />
      </Section>
      <Section title="Timers">
        <Stepper
          label="Role reveal"
          value={value.revealSeconds}
          min={5}
          max={60}
          step={5}
          suffix="s"
          onChange={(n) => set("revealSeconds", n)}
        />
        <Stepper
          label="Night"
          value={value.nightSeconds}
          min={15}
          max={180}
          step={5}
          suffix="s"
          onChange={(n) => set("nightSeconds", n)}
        />
        <Stepper
          label="Day"
          value={value.daySeconds}
          min={30}
          max={600}
          step={15}
          suffix="s"
          onChange={(n) => set("daySeconds", n)}
        />
      </Section>
    </div>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="py-4 first:pt-0 last:pb-0">
      <h3 className="text-muted text-xs font-semibold tracking-wider uppercase">{title}</h3>
      {hint && <p className="text-muted mt-1 text-sm">{hint}</p>}
      <div className="mt-1">{children}</div>
    </section>
  );
}
