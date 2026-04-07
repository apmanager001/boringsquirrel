import type { ReactNode } from "react";
import { GameInfoDrawerProvider } from "@/components/games/game-info-drawer";

type GamesLayoutProps = {
  children: ReactNode;
};

export default function GamesLayout({ children }: GamesLayoutProps) {
  return <GameInfoDrawerProvider>{children}</GameInfoDrawerProvider>;
}
