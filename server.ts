import http from 'http';
import express from 'express';
import cors from 'cors';
import { Server as SocketIOServer } from 'socket.io';
import apiRouter from './server/routes.js';
import { setupSocketServer } from './server/socket.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  },
  maxHttpBufferSize: 1e7, // 10MB limit for attachments
});

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.set('io', io);

// Mount API routes
app.use('/api', apiRouter);

// Download source zip route
app.get('/accord-source.zip', (_req, res) => {
  const zipPath = path.resolve(__dirname, 'public/accord-source.zip');
  res.download(zipPath, 'accord-project.zip');
});

// Setup Socket.io real-time and WebRTC signaling
setupSocketServer(io);

const isProduction = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT) || 3000;

if (!isProduction) {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: {
      middlewareMode: true,
      hmr: false,
    },
    appType: 'spa',
  });

  // Intercept /@vite/client to disable HMR WebSocket transport cleanly without errors
  app.use((req, res, next) => {
    if (req.url && req.url.startsWith('/@vite/client')) {
      const origWrite = res.write.bind(res);
      const origEnd = res.end.bind(res);
      const chunks: Buffer[] = [];

      res.write = function (chunk: any, ...args: any[]) {
        if (chunk) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        return true;
      };

      res.end = function (chunk?: any, ...args: any[]) {
        if (chunk) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        let body = Buffer.concat(chunks).toString('utf8');
        body = body.replace(
          'const createWebSocketModuleRunnerTransport =',
          'const createWebSocketModuleRunnerTransport = () => ({ connect: async (handlers) => { try { if (handlers && typeof handlers.onMessage === "function") { handlers.onMessage({ type: "connected" }); } } catch (_) {} }, disconnect: () => {}, send: () => {} }); const _origTransport ='
        );
        body = body.replaceAll(
          'throw new SendBeforeConnectError("send was called before connect");',
          'return;'
        );
        body = body.replaceAll(
          'throw new SendBeforeConnectError("invoke was called before connect");',
          'return;'
        );
        body = body.replaceAll(
          'async function ping() {',
          'async function ping() { return true; } async function _origPing() {'
        );
        res.setHeader('Content-Length', Buffer.byteLength(body, 'utf8'));
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
        return origEnd(body, 'utf8');
      };
    }
    next();
  });

  app.use(vite.middlewares);
} else {
  const distPath = path.resolve(__dirname, 'dist');
  app.use(express.static(distPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.resolve(distPath, 'index.html'));
  });
}

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[Accord Engine] Server running on http://0.0.0.0:${PORT}`);
});
