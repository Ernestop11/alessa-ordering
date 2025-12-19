/**
 * WebSocket Event Handlers
 */
import { Server as SocketIOServer, Socket } from 'socket.io';
import { getAlfredStatus, setAlfredStatus } from '../alfred-state';

let clients: Map<string, Socket> = new Map();

export default function setupWebSocketHandlers(io: SocketIOServer) {
  io.on('connection', (socket: Socket) => {
    const clientId = socket.id;
    clients.set(clientId, socket);

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
      clients.delete(clientId);
    });
  });

  // Broadcast status updates every 5 seconds
  setInterval(() => {
    if (clients.size > 0) {
      io.emit('status', getAlfredStatus());
    }
  }, 5000);

  // Export broadcast functions
  (global as any).alfredBroadcast = {
    status: () => io.emit('status', getAlfredStatus()),
    taskProgress: (taskId: string, progress: number, description: string) => {
      io.emit('task-progress', {
        taskId,
        progress,
        description,
        timestamp: Date.now(),
      });
    },
    suggestions: (suggestions: any[]) => {
      io.emit('suggestions', {
        suggestions,
        timestamp: Date.now(),
      });
    },
    improvementComplete: (result: any) => {
      io.emit('improvement-complete', {
        ...result,
        timestamp: Date.now(),
      });
    },
  };
}

