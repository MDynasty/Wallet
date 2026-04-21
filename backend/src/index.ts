import app from './app';
import { config } from './config';
import { logger } from './utils/logger';
import prisma from './config/prisma';

async function main() {
  await prisma.$connect();
  logger.info('Database connected');

  const server = app.listen(config.port, () => {
    logger.info(`Wallet API listening on port ${config.port} [${config.env}]`);
  });

  const shutdown = async (signal: string) => {
    logger.info(`${signal} received – shutting down`);
    server.close(async () => {
      await prisma.$disconnect();
      logger.info('Graceful shutdown complete');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
