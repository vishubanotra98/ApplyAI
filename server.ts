import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServerApp } from './server/src/server';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = createServerApp();
  const PORT = 3000;

  // In development, hook up Vite middleware so the developer can interact with the applet UI
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ApplyAI unified server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
