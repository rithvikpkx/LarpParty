import { notFound } from "next/navigation";
import { getGame } from "@/games";
import { RoomScreen } from "@/platform/ui/RoomScreen";

export default async function RoomPage({ params }: { params: Promise<{ game: string; code: string }> }) {
  const { game, code } = await params;
  if (!getGame(game) || !/^[a-zA-Z]{4}$/.test(code)) notFound();
  return <RoomScreen slug={game} code={code} />;
}
