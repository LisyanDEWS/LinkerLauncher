import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const wss = new WebSocketServer({ server });
  
  // --- LISYAN CONNECT WEB SOCKET SIGNALING ---
  const rooms = new Map<string, Set<WebSocket>>();
  wss.on("connection", (ws) => {
    let roomId: string | null = null;
    ws.on("message", (msg) => {
      try {
        const data = JSON.parse(msg.toString());
        if (data.type === "join") {
          roomId = data.roomId;
          if (!rooms.has(roomId)) rooms.set(roomId, new Set());
          rooms.get(roomId)!.add(ws);
        }
        if (roomId) {
          const clients = rooms.get(roomId);
          if (clients) {
            for (const client of clients) {
              if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(msg.toString());
              }
            }
          }
        }
      } catch (e) {}
    });
    ws.on("close", () => {
      if (roomId && rooms.has(roomId)) {
        rooms.get(roomId)!.delete(ws);
        if (rooms.get(roomId)!.size === 0) rooms.delete(roomId);
      }
    });
  });

  // --- VITE DEV MIDDLEWARE (React) ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    // Production static serving
    app.use(express.static('dist'));
    app.get('*', (req, res) => {
      res.sendFile('dist/index.html', { root: '.' });
    });
  }

  const PORT = Number(process.env.PORT) || 3001;
  server.listen(PORT, () => {
    console.log(`Server running with WebSocket signaling on port ${PORT}`);
  });
}

startServer();
