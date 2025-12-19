/**
 * Shared Alfred State - Centralized state management
 * CommonJS compatible exports for server.js
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

// Global state (in production, use Redis)
let alfredStatus: AlfredStatus = {
  status: 'active',
  lastAction: 'Initialized',
  improvementsToday: 0,
  tasksCompleted: 0,
  suggestions: [],
  currentTask: null,
};

export function getAlfredStatus(): AlfredStatus {
  return { ...alfredStatus };
}

export function setAlfredStatus(updates: Partial<AlfredStatus>): void {
  alfredStatus = { ...alfredStatus, ...updates };
}

