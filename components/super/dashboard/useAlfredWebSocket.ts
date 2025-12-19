/**
 * Alfred WebSocket Client Hook
 * Connects to Alfred's WebSocket server for real-time updates
 * Gracefully handles if socket.io-client is not available
 */
'use client';

import { useEffect, useState } from 'react';

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
  currentTask: {
    id: string;
    description: string;
    progress: number;
  } | null;
}

export function useAlfredWebSocket() {
  const [socket, setSocket] = useState<any>(null);
  const [status, setStatus] = useState<AlfredStatus | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Try to load socket.io-client dynamically
    let io: any = null;
    
    // Use dynamic import to avoid build-time errors
    import('socket.io-client').then((module) => {
      io = module.io;
      
      if (!io) {
        console.warn('[Alfred] socket.io-client not available');
        return;
      }

      try {
        // WebSocket URL
        const wsUrl = process.env.NEXT_PUBLIC_ALFRED_WS_URL || 'ws://localhost:4010';
        const newSocket = io(wsUrl, {
          path: '/api/alfred/socket',
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionAttempts: 3,
          timeout: 5000,
        });

        newSocket.on('connect', () => {
          console.log('[Alfred WebSocket] Connected');
          setConnected(true);
        });

        newSocket.on('disconnect', () => {
          console.log('[Alfred WebSocket] Disconnected');
          setConnected(false);
        });

        newSocket.on('connect_error', () => {
          console.log('[Alfred WebSocket] Connection error - will use polling');
          setConnected(false);
        });

        newSocket.on('status', (data: AlfredStatus) => {
          setStatus(data);
        });

        newSocket.on('task-progress', (data: { taskId: string; progress: number; description: string }) => {
          setStatus((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              currentTask: {
                id: data.taskId,
                description: data.description,
                progress: data.progress,
              },
            };
          });
        });

        newSocket.on('suggestions', (data: { suggestions: any[] }) => {
          setStatus((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              suggestions: data.suggestions,
            };
          });
        });

        newSocket.on('improvement-complete', (data: any) => {
          console.log('[Alfred WebSocket] Improvement cycle completed:', data);
        });

        setSocket(newSocket);

        return () => {
          newSocket.close();
        };
      } catch (error) {
        console.warn('[Alfred WebSocket] Error setting up connection:', error);
        setConnected(false);
      }
    }).catch((error) => {
      // socket.io-client not available - that's okay, we'll use polling
      console.log('[Alfred] WebSocket not available, using polling mode');
      setConnected(false);
    });
  }, []);

  return { socket, status, connected };
}
