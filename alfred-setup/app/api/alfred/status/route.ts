import { NextResponse } from 'next/server';
import { unstable_noStore as noStore } from 'next/cache';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// In-memory status (in production, this would come from Redis/database)
let alfredStatus = {
  status: 'active' as 'active' | 'thinking' | 'working' | 'idle' | 'offline',
  lastAction: 'Initialized',
  improvementsToday: 0,
  tasksCompleted: 0,
  suggestions: [] as Array<{
    id: string;
    type: 'ui' | 'code' | 'performance' | 'security';
    priority: 'high' | 'medium' | 'low';
    description: string;
    impact: string;
  }>,
  currentTask: null as {
    id: string;
    description: string;
    progress: number;
  } | null,
};

export async function GET() {
  noStore();
  
  // TODO: Load from Redis/database in production
  // For now, return in-memory status
  
  return NextResponse.json(alfredStatus);
}

