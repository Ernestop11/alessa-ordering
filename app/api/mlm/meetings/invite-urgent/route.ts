import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  // Meeting model not yet in schema
  return NextResponse.json(
    { error: 'Meeting invitation feature not yet available' },
    { status: 501 }
  );
}
