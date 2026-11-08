import Link from "next/link";
import { Art, Eyebrow, Screen } from "@/components/ui";
import { games } from "@/games";

export default function Home() {
  return (
    <Screen kind="page" className="home" kanji="遊">
      <Eyebrow>Party games</Eyebrow>
      <h1 className="disp">
        <span className="hl">LarpParty</span>
      </h1>
      <p className="tag">One big screen. Everyone&apos;s phones. No accounts, no apps.</p>
      <div className="games">
        {games.map((g) => (
          <Link
            key={g.slug}
            href={`/${g.slug}`}
            className="panel game"
            data-title={`${g.name}.exe`}
            data-label={g.name.toUpperCase()}
          >
            <Art name={g.art ?? "moon"} />
            <div>
              <h2>{g.name}</h2>
              <p>{g.description}</p>
              <div className="meta">
                {g.minPlayers}–{g.maxPlayers} players →
              </div>
            </div>
          </Link>
        ))}
      </div>
    </Screen>
  );
}
