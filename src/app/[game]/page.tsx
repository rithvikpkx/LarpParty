import { notFound } from "next/navigation";
import { getGame } from "@/games";
import { GameLanding } from "@/platform/ui/GameLanding";

export default async function GamePage({ params }: { params: Promise<{ game: string }> }) {
  const { game } = await params;
  if (!getGame(game)) notFound();
  return <GameLanding slug={game} />;
}
