/**
 * Alfred WebSocket Client Component
 * Connects to Alfred's WebSocket server for real-time updates
 */
'use client';

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

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
  const [socket, setSocket] = useState<Socket | null>(null);
  const [status, setStatus] = useState<AlfredStatus | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Connect to WebSocket server
    // In production: wss://alfred.alessacloud.com/api/alfred/socket
    // For now: ws://localhost:4010/api/alfred/socket (via proxy)
    const wsUrl = process.env.NEXT_PUBLIC_ALFRED_WS_URL || 'ws://localhost:4010';
    const newSocket = io(wsUrl, {
      path: '/api/alfred/socket',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    newSocket.on('connect', () => {
      console.log('[Alfred WebSocket] Connected');
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('[Alfred WebSocket] Disconnected');
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
      // Status will be updated via 'status' event
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  return { socket, status, connected };
}

