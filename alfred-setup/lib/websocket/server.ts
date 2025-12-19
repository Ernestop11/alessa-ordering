/**
 * WebSocket Server - Real-time communication for Alfred
 */

import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { getAlfredStatus, setAlfredStatus } from '../alfred-state';

export class AlfredWebSocketServer {
  private io: SocketIOServer;
  private clients: Map<string, Socket> = new Map();

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      path: '/api/alfred/socket',
      cors: {
        origin: process.env.ALLOWED_ORIGINS?.split(',') || ['https://alessacloud.com'],
        methods: ['GET', 'POST'],
      },
    });

    this.setupEventHandlers();
    this.startStatusBroadcast();
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket: Socket) => {
      const clientId = socket.id;
      this.clients.set(clientId, socket);

      console.log(`[Alfred WebSocket] Client connected: ${clientId}`);

      // Send initial status
      socket.emit('status', getAlfredStatus());

      // Handle client events
      socket.on('subscribe', (data: { type: string }) => {
        console.log(`[Alfred WebSocket] Client ${clientId} subscribed to: ${data.type}`);
        socket.join(data.type);
      });

      socket.on('unsubscribe', (data: { type: string }) => {
        console.log(`[Alfred WebSocket] Client ${clientId} unsubscribed from: ${data.type}`);
        socket.leave(data.type);
      });

      socket.on('disconnect', () => {
        console.log(`[Alfred WebSocket] Client disconnected: ${clientId}`);
        this.clients.delete(clientId);
      });
    });
  }

  /**
   * Broadcast status updates to all connected clients
   */
  broadcastStatus() {
    const status = getAlfredStatus();
    this.io.emit('status', status);
  }

  /**
   * Broadcast task progress updates
   */
  broadcastTaskProgress(taskId: string, progress: number, description: string) {
    this.io.emit('task-progress', {
      taskId,
      progress,
      description,
      timestamp: Date.now(),
    });
  }

  /**
   * Broadcast new suggestions
   */
  broadcastSuggestions(suggestions: any[]) {
    this.io.emit('suggestions', {
      suggestions,
      timestamp: Date.now(),
    });
  }

  /**
   * Broadcast improvement cycle completion
   */
  broadcastImprovementComplete(result: {
    patternsFound: number;
    improvementsGenerated: number;
    suggestions: any[];
  }) {
    this.io.emit('improvement-complete', {
      ...result,
      timestamp: Date.now(),
    });
  }

  /**
   * Start periodic status broadcast
   */
  private startStatusBroadcast() {
    setInterval(() => {
      if (this.clients.size > 0) {
        this.broadcastStatus();
      }
    }, 5000); // Broadcast every 5 seconds
  }

  /**
   * Get connected clients count
   */
  getConnectedClients(): number {
    return this.clients.size;
  }
}

// Singleton instance
let wsServerInstance: AlfredWebSocketServer | null = null;

export function getWebSocketServer(httpServer?: HTTPServer): AlfredWebSocketServer {
  if (!wsServerInstance && httpServer) {
    wsServerServer = new AlfredWebSocketServer(httpServer);
  }
  return wsServerInstance!;
}

