import { validateEnv } from './utils/env-validator';
validateEnv(); // Ensure this is called FIRST to load .env variables

import { PrismaClient } from '@prisma/client';
import { createApp } from './app';

const PORT = process.env.PORT ?? 8181;
const prisma = new PrismaClient();

async function startServer() {
  try {
    await prisma.$connect();
    console.log('[NurtureLink API] Database connected successfully.');

    const app = createApp();

    app.listen(PORT, () => {
      console.log(`[NurtureLink API] listening on port ${PORT}`);
    });
  } catch (error) {
    console.error('[NurtureLink API] Failed to connect to the database. Exiting...', error);
    process.exit(1);
  }
}

startServer();
