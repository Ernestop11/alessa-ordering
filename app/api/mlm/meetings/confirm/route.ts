import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  // MeetingAttendee model not yet in schema
  return NextResponse.json(
    { error: 'Meeting confirmation feature not yet available' },
    { status: 501 }
  );
}
