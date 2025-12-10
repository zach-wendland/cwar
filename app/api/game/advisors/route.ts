import { NextResponse } from "next/server";
import { generateAdvisors } from "@/lib/game/generators";

export async function GET() {
  try {
    const advisors = generateAdvisors();
    return NextResponse.json({ advisors });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to generate advisors" },
      { status: 500 }
    );
  }
}
