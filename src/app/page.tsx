import Link from "next/link";
import { games } from "@/games";

export default function Home() {
  return (
    <main className="mx-auto min-h-dvh max-w-5xl px-5 py-14 sm:py-24">
      <h1 className="font-display text-5xl font-semibold tracking-tight sm:text-6xl">LarpParty</h1>
      <p className="text-muted mt-4 max-w-xl text-xl">One big screen. Everyone&apos;s phones. No accounts, no apps.</p>
      <ul className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {games.map((g) => (
          <li key={g.slug}>
            <Link
              href={`/${g.slug}`}
              className="group block h-full rounded-3xl bg-white p-7 shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(0,0,0,0.08)]"
            >
              <h2 className="text-2xl font-semibold">{g.name}</h2>
              <p className="text-muted mt-2">{g.description}</p>
              <p className="text-accent mt-6 text-sm font-medium">
                {g.minPlayers}–{g.maxPlayers} players <span className="transition group-hover:translate-x-1">→</span>
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
