import { NextRequest, NextResponse } from "next/server";
import { generateTweets } from "@/lib/game/generators";

export async function POST(request: NextRequest) {
  try {
    const { actionName } = await request.json();
    const tweets = generateTweets(actionName);
    return NextResponse.json({ tweets });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to generate tweets" },
      { status: 500 }
    );
  }
}
