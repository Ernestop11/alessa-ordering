import { NextResponse } from 'next/server';
import { getUplineChain, getSponsor } from '@/lib/mlm/upline-system';

/**
 * GET - Get upline chain for an associate
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const associateId = searchParams.get('associateId');

  if (!associateId) {
    return NextResponse.json({ error: 'Associate ID required' }, { status: 400 });
  }

  try {
    const chain = await getUplineChain(associateId);
    return NextResponse.json(chain);
  } catch (error: any) {
    console.error('Error getting upline chain:', error);
    return NextResponse.json({ error: error.message || 'Failed to get upline chain' }, { status: 500 });
  }
}
