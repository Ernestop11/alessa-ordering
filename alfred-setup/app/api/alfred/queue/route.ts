/**
 * Task Queue API - Manage Alfred's background jobs
 */
import { NextRequest, NextResponse } from 'next/server';
import { unstable_noStore as noStore } from 'next/cache';
import { getTaskQueue } from '../../../../lib/queue/task-queue';

export const dynamic = 'force-dynamic';

export async function GET() {
  noStore();

  try {
    const taskQueue = getTaskQueue();
    const status = await taskQueue.getStatus();

    return NextResponse.json({
      success: true,
      ...status,
    });
  } catch (error) {
    console.error('[Alfred] Error getting queue status:', error);
    return NextResponse.json(
      { error: 'Failed to get queue status' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  noStore();

  try {
    const body = await request.json();
    const { type, payload, options } = body;

    if (!type) {
      return NextResponse.json({ error: 'type is required' }, { status: 400 });
    }

    const taskQueue = getTaskQueue();
    const job = await taskQueue.enqueue(type, payload, options);

    return NextResponse.json({
      success: true,
      jobId: job.id,
      message: 'Task enqueued',
    });
  } catch (error) {
    console.error('[Alfred] Error enqueueing task:', error);
    return NextResponse.json(
      { error: 'Failed to enqueue task' },
      { status: 500 }
    );
  }
}

