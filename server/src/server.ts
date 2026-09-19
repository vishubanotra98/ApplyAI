import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { jdRouter } from './routes/jd.routes';
import { resumeRouter } from './routes/resume.routes';
import { recruiterRouter } from './routes/recruiter.routes';

dotenv.config();

export function createServerApp() {
  const app = express();

  // CORS configuration for Chrome Extension and local development
  const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, or background workers)
        if (!origin) return callback(null, true);

        if (allowedOrigin === '*' || origin.startsWith('chrome-extension://') || origin.includes('localhost') || origin.includes('127.0.0.1')) {
          return callback(null, true);
        }

        if (origin === allowedOrigin) {
          return callback(null, true);
        }

        return callback(null, true); // Permissive in dev mode for seamless local extension testing
      },
      methods: ['GET', 'POST', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
    })
  );

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Health check endpoint
  app.get('/api/health', (req: Request, res: Response) => {
    return res.status(200).json({
      status: 'ok',
      service: 'ApplyAI Backend',
      version: '1.0.0',
      model: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
      hasApiKey: Boolean(process.env.GEMINI_API_KEY),
      timestamp: new Date().toISOString(),
    });
  });

  // API Routes
  app.use('/api/jd', jdRouter);
  app.use('/api/resume', resumeRouter);
  app.use('/api/recruiter', recruiterRouter);

  return app;
}

// Standalone execution when run directly: `tsx server/src/server.ts`
if (process.env.NODE_ENV !== 'production' && process.env.STANDALONE_SERVER === 'true') {
  const app = createServerApp();
  const PORT = Number(process.env.PORT) || 3001;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ApplyAI backend server running on http://localhost:${PORT}`);
  });
}
