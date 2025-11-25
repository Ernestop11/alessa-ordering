import { NextResponse } from 'next/server';

/**
 * Demo mode test quote endpoint
 * Returns a mock $7.99 delivery quote for testing DoorDash integration
 */
export async function POST() {
  return NextResponse.json({
    fee: 7.99,
    currency: 'USD',
    message: 'Demo quote - DoorDash not configured for production'
  });
}
