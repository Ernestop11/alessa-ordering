import { NextResponse } from 'next/server';

const ALFRED_API_URL = process.env.ALFRED_API_URL || 'http://localhost:4010';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    // Proxy request to Alfred service
    const response = await fetch(`${ALFRED_API_URL}/api/alfred/improve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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
      { error: 'Failed to trigger improvement cycle' },
      { status: 500 }
    );
  }
}

