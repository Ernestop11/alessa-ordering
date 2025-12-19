import { NextResponse } from 'next/server';

const ALFRED_API_URL = process.env.ALFRED_API_URL || 'http://localhost:4010';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    // Proxy request to Alfred service
    const response = await fetch(`${ALFRED_API_URL}/api/alfred/status`, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      // If Alfred is not available, return offline status
      return NextResponse.json({
        status: 'offline',
        lastAction: 'Not connected',
        improvementsToday: 0,
        tasksCompleted: 0,
        suggestions: [],
      });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[Alfred Proxy] Error:', error);
    // Return offline status on error
    return NextResponse.json({
      status: 'offline',
      lastAction: 'Connection error',
      improvementsToday: 0,
      tasksCompleted: 0,
      suggestions: [],
    });
  }
}

