import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  // Leaderboard model not yet in schema - return empty array
  return NextResponse.json({ leaderboards: [] });
}
