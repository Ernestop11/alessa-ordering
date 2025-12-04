import { NextResponse } from 'next/server';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  // LeaderboardEntry model not yet in schema - return empty array
  return NextResponse.json({ entries: [] });
}
