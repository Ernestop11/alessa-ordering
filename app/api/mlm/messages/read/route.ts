import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  // TeamMessage model not yet in schema
  return NextResponse.json(
    { error: 'TeamMessage feature not yet available' },
    { status: 501 }
  );
}
