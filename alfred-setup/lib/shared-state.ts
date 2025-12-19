/**
 * Shared State - Used by all Alfred routes
 */

export interface AlfredStatus {
  status: 'active' | 'thinking' | 'working' | 'idle' | 'offline';
  lastAction: string;
  improvementsToday: number;
  tasksCompleted: number;
  suggestions: Array<{
    id: string;
    type: 'ui' | 'code' | 'performance' | 'security';
    priority: 'high' | 'medium' | 'low';
    description: string;
    impact: string;
  }>;
  currentTask: {
    id: string;
    description: string;
    progress: number;
  } | null;
}

// Global shared state
let sharedState: AlfredStatus = {
  status: 'active',
  lastAction: 'Initialized',
  improvementsToday: 0,
  tasksCompleted: 0,
  suggestions: [],
  currentTask: null,
};

export function getSharedState(): AlfredStatus {
  return { ...sharedState };
}

export function setSharedState(updates: Partial<AlfredStatus>): void {
  sharedState = { ...sharedState, ...updates };
}

