import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

import { authRouter } from './routes/auth';
import { aiRouter } from './routes/ai';
import { clientsRouter } from './routes/clients';
import { visitsRouter } from './routes/visits';
import { plansRouter } from './routes/plans';
import { referralsRouter } from './routes/referrals';
import { syncRouter } from './routes/sync';
import { referenceRouter } from './routes/reference';
import { exportRouter } from './routes/export';
import { errorMiddleware } from './middleware/error';

export function createApp(): Application {
  const app = express();

  // ── Request logging ─────────────────────────────────────────────────────────
  app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });

  // ── Security & parsing ──────────────────────────────────────────────────────
  app.use(helmet());
  app.use(cors({ origin: process.env.CORS_ORIGIN ?? '*' }));
  app.use(compression());
  app.use(express.json({ limit: '2mb' }));

  // ── Rate limiting ───────────────────────────────────────────────────────────
  app.use(
    '/auth',
    rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: 'Too many auth attempts' }),
  );

  // ── Health check ────────────────────────────────────────────────────────────
  app.get('/health', (_req, res) => res.json({ ok: true, ts: new Date().toISOString() }));

  // ── Routes ──────────────────────────────────────────────────────────────────
  app.use('/auth', authRouter);
  app.use('/ai', aiRouter);
  app.use('/clients', clientsRouter);
  app.use('/visits', visitsRouter);
  app.use('/plans', plansRouter);
  app.use('/referrals', referralsRouter);
  app.use('/sync', syncRouter);
  app.use('/reference', referenceRouter);
  app.use('/export', exportRouter);

  // ── Error handler (must be last) ────────────────────────────────────────────
  app.use(errorMiddleware);

  return app;
}
