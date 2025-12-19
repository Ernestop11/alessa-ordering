/**
 * Event Recorder - Tracks user interactions and system events
 * Stores events in Redis for pattern analysis
 */

import { Redis } from 'ioredis';

export interface LearningEvent {
  id: string;
  type: 'user_action' | 'code_change' | 'error' | 'performance' | 'ui_interaction';
  timestamp: number;
  userId?: string;
  sessionId?: string;
  metadata: {
    action?: string;
    component?: string;
    route?: string;
    file?: string;
    error?: string;
    duration?: number;
    [key: string]: any;
  };
}

export class EventRecorder {
  private redis: Redis;
  private eventQueue: LearningEvent[] = [];
  private flushInterval: NodeJS.Timeout | null = null;

  constructor(redisUrl?: string) {
    this.redis = new Redis(redisUrl || process.env.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });

    // Flush queue every 5 seconds
    this.flushInterval = setInterval(() => this.flushQueue(), 5000);
  }

  /**
   * Record a learning event
   */
  async record(event: Omit<LearningEvent, 'id' | 'timestamp'>): Promise<void> {
    const fullEvent: LearningEvent = {
      ...event,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };

    // Add to queue for batch processing
    this.eventQueue.push(fullEvent);

    // If queue is large, flush immediately
    if (this.eventQueue.length >= 50) {
      await this.flushQueue();
    }
  }

  /**
   * Flush queued events to Redis
   */
  private async flushQueue(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const events = [...this.eventQueue];
    this.eventQueue = [];

    try {
      const pipeline = this.redis.pipeline();

      // Store events in sorted set by timestamp
      for (const event of events) {
        const key = `alfred:events:${event.type}`;
        const score = event.timestamp;
        const value = JSON.stringify(event);

        pipeline.zadd(key, score, value);

        // Also store in daily bucket
        const date = new Date(event.timestamp);
        const dayKey = `alfred:events:${date.toISOString().split('T')[0]}`;
        pipeline.zadd(dayKey, score, value);

        // Store individual event
        pipeline.set(`alfred:event:${event.id}`, value, 'EX', 86400 * 7); // 7 days
      }

      // Store in recent events list (last 1000)
      for (const event of events) {
        pipeline.lpush('alfred:events:recent', JSON.stringify(event));
        pipeline.ltrim('alfred:events:recent', 0, 999);
      }

      await pipeline.exec();
    } catch (error) {
      console.error('[EventRecorder] Error flushing queue:', error);
      // Re-add events to queue on error
      this.eventQueue.unshift(...events);
    }
  }

  /**
   * Get recent events
   */
  async getRecentEvents(limit: number = 100): Promise<LearningEvent[]> {
    try {
      const events = await this.redis.lrange('alfred:events:recent', 0, limit - 1);
      return events.map(e => JSON.parse(e)).reverse();
    } catch (error) {
      console.error('[EventRecorder] Error getting recent events:', error);
      return [];
    }
  }

  /**
   * Get events by type
   */
  async getEventsByType(type: LearningEvent['type'], limit: number = 100): Promise<LearningEvent[]> {
    try {
      const key = `alfred:events:${type}`;
      const events = await this.redis.zrange(key, -limit, -1);
      return events.map(e => JSON.parse(e)).reverse();
    } catch (error) {
      console.error('[EventRecorder] Error getting events by type:', error);
      return [];
    }
  }

  /**
   * Get events for today
   */
  async getTodayEvents(): Promise<LearningEvent[]> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const dayKey = `alfred:events:${today}`;
      const events = await this.redis.zrange(dayKey, 0, -1);
      return events.map(e => JSON.parse(e));
    } catch (error) {
      console.error('[EventRecorder] Error getting today events:', error);
      return [];
    }
  }

  /**
   * Cleanup old events (keep last 30 days)
   */
  async cleanup(): Promise<void> {
    try {
      const cutoff = Date.now() - (30 * 24 * 60 * 60 * 1000);
      const types: LearningEvent['type'][] = ['user_action', 'code_change', 'error', 'performance', 'ui_interaction'];

      for (const type of types) {
        const key = `alfred:events:${type}`;
        await this.redis.zremrangebyscore(key, 0, cutoff);
      }
    } catch (error) {
      console.error('[EventRecorder] Error cleaning up:', error);
    }
  }

  /**
   * Close connections
   */
  async close(): Promise<void> {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    await this.flushQueue();
    await this.redis.quit();
  }
}

// Singleton instance
let eventRecorderInstance: EventRecorder | null = null;

export function getEventRecorder(): EventRecorder {
  if (!eventRecorderInstance) {
    eventRecorderInstance = new EventRecorder();
  }
  return eventRecorderInstance;
}

