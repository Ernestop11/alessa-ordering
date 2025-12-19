import { NextResponse } from 'next/server';
import { unstable_noStore as noStore } from 'next/cache';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Shared in-memory state (accessible to all routes in this process)
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
  
  try {
    // Try to get event counts if learning system is available
    try {
      const learning = require('../../../../lib/learning/event-recorder');
      const eventRecorder = learning.getEventRecorder();
      const recentEvents = await eventRecorder.getRecentEvents(100);
      const todayEvents = await eventRecorder.getTodayEvents();

      alfredStatus = {
        ...alfredStatus,
        improvementsToday: todayEvents.length,
        tasksCompleted: recentEvents.filter((e: any) => e.type === 'code_change').length,
        lastAction: recentEvents[0]?.metadata.action || alfredStatus.lastAction,
      };
    } catch (error) {
      // Learning system not ready, use cached status
      console.warn('[Alfred] Learning system not available:', error);
    }

    return NextResponse.json(alfredStatus);
  } catch (error) {
    console.error('[Alfred] Error getting status:', error);
    return NextResponse.json(alfredStatus);
  }
}

// Export for other routes to use
export function getAlfredStatus() {
  return { ...alfredStatus };
}

export function setAlfredStatus(updates: Partial<typeof alfredStatus>) {
  alfredStatus = { ...alfredStatus, ...updates };
}

// Make it available globally for other routes
if (typeof global !== 'undefined') {
  (global as any).alfredStatus = alfredStatus;
  (global as any).getAlfredStatus = getAlfredStatus;
  (global as any).setAlfredStatus = setAlfredStatus;
}
