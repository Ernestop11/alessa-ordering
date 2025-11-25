import { NextResponse } from 'next/server';

/**
 * Demo mode webhook test endpoint
 * Returns a mock successful response for testing DoorDash integration
 */
export async function POST() {
  return NextResponse.json({ ok: true, message: 'Demo webhook test successful' });
}
