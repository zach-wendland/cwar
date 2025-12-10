import { NextRequest, NextResponse } from "next/server";
import { generateEvent } from "@/lib/game/generators";

export async function POST(request: NextRequest) {
  try {
    const { gameState } = await request.json();
    const event = generateEvent(gameState);
    return NextResponse.json({ event });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to generate event" },
      { status: 500 }
    );
  }
}
