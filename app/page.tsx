"use client";

import { GameProvider } from "@/lib/game/GameContext";
import GameApp from "@/components/GameApp";

export default function Home() {
  return (
    <GameProvider>
      <GameApp />
    </GameProvider>
  );
}
