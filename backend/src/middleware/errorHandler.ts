import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof Error) {
    logger.error(err.message, { stack: err.stack });
    if (err.message === 'Insufficient funds') {
      res.status(422).json({ error: err.message });
      return;
    }
  }
  const status = (err as { status?: number }).status ?? 500;
  const message =
    status < 500 ? String((err as { message?: string }).message ?? err) : 'Internal server error';
  res.status(status).json({ error: message });
}
