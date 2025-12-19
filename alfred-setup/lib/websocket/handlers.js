/**
 * WebSocket Event Handlers (CommonJS for server.js)
 */
const { getAlfredStatus } = require('../alfred-state');

let clients = new Map();

module.exports = function setupWebSocketHandlers(io) {
  io.on('connection', (socket) => {
    const clientId = socket.id;
    clients.set(clientId, socket);

    console.log(`[Alfred WebSocket] Client connected: ${clientId}`);

    // Send initial status
    socket.emit('status', getAlfredStatus());

    // Handle client events
    socket.on('subscribe', (data) => {
      console.log(`[Alfred WebSocket] Client ${clientId} subscribed to: ${data.type}`);
      socket.join(data.type);
    });

    socket.on('unsubscribe', (data) => {
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
  global.alfredBroadcast = {
    status: () => io.emit('status', getAlfredStatus()),
    taskProgress: (taskId, progress, description) => {
      io.emit('task-progress', {
        taskId,
        progress,
        description,
        timestamp: Date.now(),
      });
    },
    suggestions: (suggestions) => {
      io.emit('suggestions', {
        suggestions,
        timestamp: Date.now(),
      });
    },
    improvementComplete: (result) => {
      io.emit('improvement-complete', {
        ...result,
        timestamp: Date.now(),
      });
    },
  };
};

