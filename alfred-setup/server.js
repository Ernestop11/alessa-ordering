/**
 * Custom Next.js Server with WebSocket Support
 */
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '4010', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Initialize WebSocket server
  let wsServer = null;
  try {
    const { Server: SocketIOServer } = require('socket.io');
    wsServer = new SocketIOServer(server, {
      path: '/api/alfred/socket',
      cors: {
        origin: process.env.ALLOWED_ORIGINS?.split(',') || ['https://alessacloud.com', 'http://localhost:4000'],
        methods: ['GET', 'POST'],
      },
    });

    // Setup WebSocket handlers
    require('./lib/websocket/handlers.cjs')(wsServer);
    console.log('[Alfred] WebSocket server initialized');
  } catch (error) {
    console.warn('[Alfred] WebSocket not available:', error.message);
  }

  server
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`[Alfred] Ready on http://${hostname}:${port}`);
      if (wsServer) {
        console.log(`[Alfred] WebSocket available at ws://${hostname}:${port}/api/alfred/socket`);
      }
    });
});

