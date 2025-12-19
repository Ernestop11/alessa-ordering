import { NextRequest, NextResponse } from 'next/server';

const ALFRED_API_URL = process.env.ALFRED_API_URL || 'http://localhost:4010';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { suggestionId } = body;

    if (!suggestionId) {
      return NextResponse.json({ error: 'suggestionId is required' }, { status: 400 });
    }

    // Proxy request to Alfred service
    const response = await fetch(`${ALFRED_API_URL}/api/alfred/apply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ suggestionId }),
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json({ error }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[Alfred Proxy] Error:', error);
    return NextResponse.json(
      { error: 'Failed to apply suggestion' },
      { status: 500 }
    );
  }
}

