import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  // TeamMessage model not yet in schema - return empty array
  return NextResponse.json({ messages: [] });
}

export async function POST(req: Request) {
  // TeamMessage model not yet in schema
  return NextResponse.json(
    { error: 'TeamMessage feature not yet available' },
    { status: 501 }
  );
}
