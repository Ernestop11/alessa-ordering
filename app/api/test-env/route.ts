import { NextResponse } from 'next/server';

export async function GET() {
  const key = process.env.STRIPE_SECRET_KEY || 'NOT_FOUND';
  return NextResponse.json({
    keyPrefix: key.substring(0, 20),
    keyLength: key.length,
    isLive: key.startsWith('sk_live'),
    isTest: key.startsWith('sk_test'),
    fullKeyEnding: key.substring(key.length - 6),
  });
}
