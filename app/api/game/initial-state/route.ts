import { NextResponse } from "next/server";
import { generateAdvisors } from "@/lib/game/generators";

export async function GET() {
  try {
    const stateCodes = [
      "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "DC", "FL",
      "GA", "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME",
      "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH",
      "NJ", "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI",
      "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
    ];

    const support: { [key: string]: number } = {};
    stateCodes.forEach(code => { support[code] = 5; });

    const initialState = {
      turn: 0,
      support,
      clout: 50,
      funds: 100,
      risk: 0,
      advisors: generateAdvisors(),
      newsLog: ["Game start: Your movement is born. Spread influence and avoid getting banned!"],
      socialFeed: [],
      pendingEvent: undefined,
      victory: false,
      gameOver: false,
      streak: 0,
      highestStreak: 0,
      lastActionWasCritical: false,
      totalCriticalHits: 0,
      sessionFirstAction: true,
      achievementsUnlocked: [],
    };

    return NextResponse.json({ state: initialState });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to get initial state" },
      { status: 500 }
    );
  }
}
