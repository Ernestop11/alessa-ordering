'use client';

import { useState, useEffect } from 'react';
import { Brain, Zap, TrendingUp, AlertCircle, CheckCircle2, Loader2, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { useAlfredWebSocket } from './useAlfredWebSocket';

interface AlfredStatus {
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
  currentTask?: {
    id: string;
    description: string;
    progress: number;
  };
}

export default function AlfredPanel() {
  // Try WebSocket first, fallback to polling
  const { socket, status: wsStatus, connected: wsConnected } = useAlfredWebSocket();
  const [alfredStatus, setAlfredStatus] = useState<AlfredStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Use WebSocket status if available, otherwise poll
  useEffect(() => {
    if (wsStatus) {
      setAlfredStatus(wsStatus);
      setLoading(false);
      setError(null);
    }
  }, [wsStatus]);

  useEffect(() => {
    // Fallback to polling if WebSocket not connected
    if (!wsConnected) {
      fetchAlfredStatus();
      const interval = setInterval(fetchAlfredStatus, 10000); // Poll every 10s
      return () => clearInterval(interval);
    }
  }, [wsConnected]);

  const fetchAlfredStatus = async () => {
    try {
      // Try to connect to Alfred API
      // In production, this would be: https://alfred.alessacloud.com/api/alfred/status
      // For now, we'll use localhost or handle offline gracefully
      const res = await fetch('/api/alfred/status', {
        cache: 'no-store',
      });
      
      if (!res.ok) {
        throw new Error('Alfred API not available');
      }
      
      const data = await res.json();
      setAlfredStatus(data);
      setError(null);
    } catch (err) {
      console.error('Alfred connection error:', err);
      setAlfredStatus({
        status: 'offline',
        lastAction: 'Not connected',
        improvementsToday: 0,
        tasksCompleted: 0,
        suggestions: [],
      });
      setError('Alfred is offline. Make sure the service is running on port 4010.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAlfredStatus();
  };

  const handleApplySuggestion = async (suggestionId: string) => {
    try {
      const res = await fetch('/api/alfred/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ suggestionId }),
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to apply suggestion');
      }

      const data = await res.json();
      console.log('Suggestion applied:', data);
      
      // Refresh status to update suggestions list
      await fetchAlfredStatus();
    } catch (err: any) {
      console.error('Failed to apply suggestion:', err);
      setError(err.message || 'Failed to apply suggestion');
    }
  };

  const handleApplyAllFixes = async () => {
    if (!alfredStatus?.suggestions || alfredStatus.suggestions.length === 0) {
      setError('No suggestions to apply');
      return;
    }

    try {
      setRefreshing(true);
      setError(null);
      
      setAlfredStatus(prev => prev ? {
        ...prev,
        status: 'working',
        currentTask: {
          id: `apply-all-${Date.now()}`,
          description: `Applying ${alfredStatus.suggestions.length} fixes...`,
          progress: 0,
        }
      } : null);

      // Apply all suggestions sequentially
      let applied = 0;
      const total = alfredStatus.suggestions.length;

      for (const suggestion of alfredStatus.suggestions) {
        try {
          const res = await fetch('/api/alfred/apply', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ suggestionId: suggestion.id }),
          });

          if (res.ok) {
            applied++;
            // Update progress
            setAlfredStatus(prev => prev ? {
              ...prev,
              currentTask: prev.currentTask ? {
                ...prev.currentTask,
                progress: Math.round((applied / total) * 100),
                description: `Applied ${applied} of ${total} fixes...`,
              } : null,
            } : null);
          }
        } catch (err) {
          console.error(`Failed to apply suggestion ${suggestion.id}:`, err);
        }
      }

      // Refresh status
      await fetchAlfredStatus();
      
      setAlfredStatus(prev => prev ? {
        ...prev,
        status: 'active',
        currentTask: null,
        lastAction: `Applied ${applied} of ${total} fixes`,
      } : null);

    } catch (err: any) {
      console.error('Failed to apply all fixes:', err);
      setError(err.message || 'Failed to apply all fixes');
      setAlfredStatus(prev => prev ? {
        ...prev,
        status: 'active',
        currentTask: null,
      } : null);
    } finally {
      setRefreshing(false);
    }
  };

  const handleTriggerImprovement = async () => {
    try {
      setRefreshing(true);
      setError(null);
      
      // Update status to show it's working
      setAlfredStatus(prev => prev ? {
        ...prev,
        status: 'working',
        currentTask: {
          id: `improve-${Date.now()}`,
          description: 'Running improvement cycle...',
          progress: 0,
        }
      } : null);

      const res = await fetch('/api/alfred/improve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${res.status}`);
      }

      const data = await res.json();
      console.log('Improvement cycle result:', data);
      
      // Wait a moment then refresh status to get suggestions
      setTimeout(async () => {
        await fetchAlfredStatus();
      }, 2000);
    } catch (err: any) {
      console.error('Failed to trigger improvement:', err);
      setError(err.message || 'Failed to trigger improvement cycle');
      setAlfredStatus(prev => prev ? {
        ...prev,
        status: 'active',
        currentTask: null,
      } : null);
    } finally {
      setRefreshing(false);
    }
  };

  const handleCleanCode = async () => {
    try {
      setRefreshing(true);
      setError(null);
      
      setAlfredStatus(prev => prev ? {
        ...prev,
        status: 'working',
        currentTask: {
          id: `clean-${Date.now()}`,
          description: 'Cleaning code...',
          progress: 0,
        }
      } : null);

      const res = await fetch('/api/alfred/clean', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autoApply: false }),
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${res.status}`);
      }

      const data = await res.json();
      console.log('Code cleaned:', data);
      
      // Refresh status after cleaning
      setTimeout(async () => {
        await fetchAlfredStatus();
      }, 1000);
    } catch (err: any) {
      console.error('Failed to clean code:', err);
      setError(err.message || 'Failed to clean code');
      setAlfredStatus(prev => prev ? {
        ...prev,
        status: 'active',
        currentTask: null,
      } : null);
    } finally {
      setRefreshing(false);
    }
  };

  const handleAnalyzeUI = async () => {
    try {
      setRefreshing(true);
      setError(null);
      
      setAlfredStatus(prev => prev ? {
        ...prev,
        status: 'thinking',
        currentTask: {
          id: `ui-analyze-${Date.now()}`,
          description: 'Analyzing UI components...',
          progress: 0,
        }
      } : null);

      const res = await fetch('/api/alfred/ui/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${res.status}`);
      }

      const data = await res.json();
      console.log('UI analysis:', data);
      
      setTimeout(async () => {
        await fetchAlfredStatus();
      }, 1000);
    } catch (err: any) {
      console.error('Failed to analyze UI:', err);
      setError(err.message || 'Failed to analyze UI');
      setAlfredStatus(prev => prev ? {
        ...prev,
        status: 'active',
        currentTask: null,
      } : null);
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
          <span className="text-gray-600">Connecting to Alfred...</span>
        </div>
      </div>
    );
  }

  const statusColors = {
    active: 'bg-green-100 text-green-700',
    thinking: 'bg-blue-100 text-blue-700',
    working: 'bg-yellow-100 text-yellow-700',
    idle: 'bg-gray-100 text-gray-700',
    offline: 'bg-red-100 text-red-700',
  };

  const statusIcons = {
    active: <CheckCircle2 className="h-5 w-5" />,
    thinking: <Loader2 className="h-5 w-5 animate-spin" />,
    working: <Loader2 className="h-5 w-5 animate-spin" />,
    idle: <Brain className="h-5 w-5" />,
    offline: <AlertCircle className="h-5 w-5" />,
  };

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <div className="rounded-xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-gradient-to-br from-blue-600 to-purple-600 p-3 shadow-lg">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">Alfred AI Assistant</h3>
              <p className="text-sm text-gray-600">Your self-learning code assistant</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            {wsConnected ? (
              <span className="flex items-center gap-1 text-xs text-green-600" title="WebSocket connected">
                <Wifi className="h-3 w-3" />
                <span className="hidden sm:inline">Live</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs text-gray-400" title="Polling mode">
                <WifiOff className="h-3 w-3" />
                <span className="hidden sm:inline">Polling</span>
              </span>
            )}
            <span className={`rounded-full px-4 py-2 text-sm font-semibold flex items-center gap-2 ${statusColors[alfredStatus?.status || 'offline']}`}>
              {statusIcons[alfredStatus?.status || 'offline']}
              {alfredStatus?.status.toUpperCase() || 'OFFLINE'}
            </span>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3">
            <p className="text-sm text-red-700 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {error}
            </p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <p className="text-xs text-gray-500 uppercase tracking-wide">Improvements Today</p>
            </div>
            <p className="text-3xl font-bold text-gray-900">{alfredStatus?.improvementsToday || 0}</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="h-4 w-4 text-blue-600" />
              <p className="text-xs text-gray-500 uppercase tracking-wide">Tasks Completed</p>
            </div>
            <p className="text-3xl font-bold text-gray-900">{alfredStatus?.tasksCompleted || 0}</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="h-4 w-4 text-yellow-600" />
              <p className="text-xs text-gray-500 uppercase tracking-wide">Last Action</p>
            </div>
            <p className="text-sm font-medium text-gray-900 truncate">
              {alfredStatus?.lastAction || 'Idle'}
            </p>
          </div>
        </div>

        {/* Current Task */}
        {alfredStatus?.currentTask && (
          <div className="mt-4 bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-gray-900">Current Task</p>
              <span className="text-xs text-gray-500">{alfredStatus.currentTask.progress}%</span>
            </div>
            <p className="text-sm text-gray-600 mb-2">{alfredStatus.currentTask.description}</p>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all"
                style={{ width: `${alfredStatus.currentTask.progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleTriggerImprovement();
            }}
            disabled={refreshing || alfredStatus?.status === 'offline' || alfredStatus?.status === 'working'}
            className="rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2 text-sm font-semibold text-white hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md active:scale-95"
          >
            {alfredStatus?.status === 'working' && alfredStatus?.currentTask?.description.includes('improvement') ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Running...
              </span>
            ) : (
              'Improvement Cycle'
            )}
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleCleanCode();
            }}
            disabled={refreshing || alfredStatus?.status === 'offline' || alfredStatus?.status === 'working'}
            className="rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md active:scale-95"
          >
            {alfredStatus?.status === 'working' && alfredStatus?.currentTask?.description.includes('Cleaning') ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Cleaning...
              </span>
            ) : (
              'Clean Code'
            )}
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleAnalyzeUI();
            }}
            disabled={refreshing || alfredStatus?.status === 'offline' || alfredStatus?.status === 'working' || alfredStatus?.status === 'thinking'}
            className="rounded-lg bg-gradient-to-r from-orange-600 to-red-600 px-4 py-2 text-sm font-semibold text-white hover:from-orange-700 hover:to-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md active:scale-95"
          >
            {alfredStatus?.status === 'thinking' || (alfredStatus?.status === 'working' && alfredStatus?.currentTask?.description.includes('Analyzing')) ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing...
              </span>
            ) : (
              'Analyze UI'
            )}
          </button>
        </div>
      </div>

      {/* Suggestions */}
      {alfredStatus?.suggestions && alfredStatus.suggestions.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-bold text-gray-900 flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-600" />
              Alfred's Suggestions ({alfredStatus.suggestions.length})
            </h4>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleApplyAllFixes();
              }}
              disabled={refreshing || alfredStatus?.status === 'working'}
              className="rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md active:scale-95 flex items-center gap-2"
            >
              {refreshing && alfredStatus?.currentTask?.description.includes('Applying') ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Applying...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Apply All Fixes
                </>
              )}
            </button>
          </div>
          <div className="space-y-3">
            {alfredStatus.suggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className={`p-4 rounded-lg border transition-all hover:shadow-md ${
                  suggestion.priority === 'high' ? 'border-red-200 bg-red-50' :
                  suggestion.priority === 'medium' ? 'border-yellow-200 bg-yellow-50' :
                  'border-blue-200 bg-blue-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold uppercase tracking-wide text-gray-600 px-2 py-1 rounded bg-white">
                        {suggestion.type}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                        suggestion.priority === 'high' ? 'bg-red-100 text-red-700' :
                        suggestion.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {suggestion.priority}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-900 mb-1">{suggestion.description}</p>
                    <p className="text-xs text-gray-600">{suggestion.impact}</p>
                  </div>
                  <button
                    onClick={() => handleApplySuggestion(suggestion.id)}
                    className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors whitespace-nowrap"
                  >
                    Apply
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {alfredStatus?.suggestions && alfredStatus.suggestions.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center">
          <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">No suggestions at the moment</p>
          <p className="text-sm text-gray-500 mt-1">Alfred is analyzing your codebase...</p>
        </div>
      )}
    </div>
  );
}

