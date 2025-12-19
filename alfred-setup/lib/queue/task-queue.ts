/**
 * Task Queue - Manages Alfred's background jobs
 */

import { Queue, Worker, Job } from 'bullmq';
import { Redis } from 'ioredis';
import { getEventRecorder } from '../learning/event-recorder';
import { PatternAnalyzer } from '../learning/pattern-analyzer';
import { ImprovementEngine } from '../learning/improvement-engine';
import { setAlfredStatus } from '../alfred-state';

export interface TaskData {
  type: 'improvement_cycle' | 'code_scan' | 'pattern_analysis' | 'apply_suggestion';
  payload: any;
}

export class TaskQueue {
  private queue: Queue;
  private worker: Worker | null = null;
  private redis: Redis;

  constructor(redisUrl?: string) {
    const connection = new Redis(redisUrl || process.env.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: 3,
    });

    this.redis = connection;
    this.queue = new Queue('alfred-tasks', { connection });

    this.setupWorker();
  }

  /**
   * Setup worker to process tasks
   */
  private setupWorker() {
    this.worker = new Worker(
      'alfred-tasks',
      async (job: Job<TaskData>) => {
        console.log(`[TaskQueue] Processing job: ${job.id} (${job.data.type})`);

        try {
          switch (job.data.type) {
            case 'improvement_cycle':
              return await this.processImprovementCycle(job);
            case 'code_scan':
              return await this.processCodeScan(job);
            case 'pattern_analysis':
              return await this.processPatternAnalysis(job);
            case 'apply_suggestion':
              return await this.processApplySuggestion(job);
            default:
              throw new Error(`Unknown task type: ${job.data.type}`);
          }
        } catch (error) {
          console.error(`[TaskQueue] Error processing job ${job.id}:`, error);
          throw error;
        }
      },
      {
        connection: this.redis,
        concurrency: 1, // Process one task at a time
      }
    );

    this.worker.on('completed', (job) => {
      console.log(`[TaskQueue] Job ${job.id} completed`);
    });

    this.worker.on('failed', (job, err) => {
      console.error(`[TaskQueue] Job ${job?.id} failed:`, err);
    });

    this.worker.on('progress', (job, progress) => {
      console.log(`[TaskQueue] Job ${job.id} progress: ${progress}%`);
    });
  }

  /**
   * Enqueue a task
   */
  async enqueue(type: TaskData['type'], payload: any, options?: { priority?: number; delay?: number }) {
    const job = await this.queue.add(type, { type, payload }, {
      priority: options?.priority || 0,
      delay: options?.delay || 0,
    });

    console.log(`[TaskQueue] Enqueued job: ${job.id} (${type})`);
    return job;
  }

  /**
   * Process improvement cycle
   */
  private async processImprovementCycle(job: Job<TaskData>) {
    setAlfredStatus({
      status: 'working',
      currentTask: {
        id: job.id!,
        description: 'Running improvement cycle...',
        progress: 0,
      },
    });

    const eventRecorder = getEventRecorder();
    const patternAnalyzer = new PatternAnalyzer(eventRecorder);
    const improvementEngine = new ImprovementEngine(
      eventRecorder,
      patternAnalyzer,
      process.env.CODEBASE_PATH || '/var/www/alessa-ordering'
    );

    // Update progress
    await job.updateProgress(25);

    // Run improvement cycle
    const result = await improvementEngine.runImprovementCycle();

    // Update progress
    await job.updateProgress(75);

    // Convert to suggestions
    const suggestions = result.suggestions.slice(0, 20).map((improvement: any) => ({
      id: improvement.id,
      type: improvement.type === 'ui_improvement' ? 'ui' :
            improvement.type === 'code_cleanup' ? 'code' :
            improvement.type === 'performance' ? 'performance' :
            improvement.type === 'security' ? 'security' : 'code',
      priority: improvement.priority,
      description: improvement.suggestion || improvement.description,
      impact: improvement.estimatedImpact,
    }));

    // Update status
    setAlfredStatus({
      status: 'active',
      lastAction: `Found ${result.patternsFound} patterns, generated ${result.improvementsGenerated} improvements`,
      improvementsToday: result.improvementsGenerated,
      suggestions,
      currentTask: null,
    });

    await job.updateProgress(100);

    return {
      success: true,
      patternsFound: result.patternsFound,
      improvementsGenerated: result.improvementsGenerated,
      suggestions: suggestions.length,
    };
  }

  /**
   * Process code scan
   */
  private async processCodeScan(job: Job<TaskData>) {
    setAlfredStatus({
      status: 'working',
      currentTask: {
        id: job.id!,
        description: 'Scanning codebase...',
        progress: 0,
      },
    });

    const eventRecorder = getEventRecorder();
    const patternAnalyzer = new PatternAnalyzer(eventRecorder);
    const improvementEngine = new ImprovementEngine(
      eventRecorder,
      patternAnalyzer,
      process.env.CODEBASE_PATH || '/var/www/alessa-ordering'
    );

    // Scan codebase
    const issues = await improvementEngine['scanCodebase']();

    await job.updateProgress(100);

    return {
      success: true,
      issuesFound: issues.length,
      issues,
    };
  }

  /**
   * Process pattern analysis
   */
  private async processPatternAnalysis(job: Job<TaskData>) {
    setAlfredStatus({
      status: 'thinking',
      currentTask: {
        id: job.id!,
        description: 'Analyzing patterns...',
        progress: 0,
      },
    });

    const eventRecorder = getEventRecorder();
    const events = await eventRecorder.getRecentEvents(500);

    await job.updateProgress(50);

    const patternAnalyzer = new PatternAnalyzer(eventRecorder);
    const patterns = await patternAnalyzer.analyzePatterns(events);

    await job.updateProgress(100);

    setAlfredStatus({
      status: 'active',
      currentTask: null,
    });

    return {
      success: true,
      patternsFound: patterns.length,
      patterns,
    };
  }

  /**
   * Process apply suggestion
   */
  private async processApplySuggestion(job: Job<TaskData>) {
    const { suggestionId } = job.data.payload;

    setAlfredStatus({
      status: 'working',
      currentTask: {
        id: job.id!,
        description: `Applying suggestion: ${suggestionId}...`,
        progress: 0,
      },
    });

    // TODO: Actually apply the suggestion
    // This would involve:
    // 1. Loading the file
    // 2. Making the code change
    // 3. Saving the file

    await job.updateProgress(100);

    setAlfredStatus({
      status: 'active',
      currentTask: null,
    });

    return {
      success: true,
      suggestionId,
    };
  }

  /**
   * Get queue status
   */
  async getStatus() {
    const waiting = await this.queue.getWaitingCount();
    const active = await this.queue.getActiveCount();
    const completed = await this.queue.getCompletedCount();
    const failed = await this.queue.getFailedCount();

    return {
      waiting,
      active,
      completed,
      failed,
      total: waiting + active + completed + failed,
    };
  }

  /**
   * Close connections
   */
  async close() {
    if (this.worker) {
      await this.worker.close();
    }
    await this.queue.close();
    await this.redis.quit();
  }
}

// Singleton instance
let taskQueueInstance: TaskQueue | null = null;

export function getTaskQueue(): TaskQueue {
  if (!taskQueueInstance) {
    taskQueueInstance = new TaskQueue();
  }
  return taskQueueInstance;
}

