import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import { config } from './config';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';

import authRouter        from './routes/auth';
import accountsRouter    from './routes/accounts';
import transactionsRouter from './routes/transactions';
import kycRouter         from './routes/kyc';

const app = express();

// ── Security middleware ──────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }));
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 min
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

// ── Body parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));

// ── HTTP logging ─────────────────────────────────────────────────────────────
app.use(
  morgan('combined', {
    stream: { write: (msg) => logger.http(msg.trim()) },
    skip: () => config.env === 'test',
  }),
);

// ── Routes ───────────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

app.use('/auth',         authRouter);
app.use('/accounts',     accountsRouter);
app.use('/transactions', transactionsRouter);
app.use('/kyc',          kycRouter);

// ── Error handler ─────────────────────────────────────────────────────────────
app.use(errorHandler);

export default app;
