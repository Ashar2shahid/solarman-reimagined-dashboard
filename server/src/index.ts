import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { config } from './config.js';
import { runBackfill, startScheduledPollers } from './services/poller.js';
import { swaggerDocument } from './swagger.js';

// Routes
import realtimeRouter from './routes/realtime.js';
import stationRouter from './routes/station.js';
import historyRouter from './routes/history.js';
import deviceRouter from './routes/device.js';
import weatherRouter from './routes/weather.js';
import alertsRouter from './routes/alerts.js';
import statusRouter from './routes/status.js';
import acRouter from './routes/ac.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Ensure data directory exists
mkdirSync(resolve(__dirname, '../data'), { recursive: true });

async function main() {
  // ── Phase 1: Backfill all historical data ──
  console.log('[server] Starting backfill (server will start after completion)...');
  await runBackfill();
  console.log('[server] Backfill complete');

  // ── Phase 2: Start Express server ──
  const app = express();
  app.use(cors());
  app.use(express.json());

  // Swagger UI docs
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

  app.use('/api/realtime', realtimeRouter);
  app.use('/api', stationRouter);
  app.use('/api/history', historyRouter);
  app.use('/api/device', deviceRouter);
  app.use('/api/weather', weatherRouter);
  app.use('/api/alerts', alertsRouter);
  app.use('/api/status', statusRouter);
  app.use('/api/ac', acRouter);

  app.listen(config.port, () => {
    console.log(`[server] Listening on http://localhost:${config.port}`);
    console.log(`[server] API docs at http://localhost:${config.port}/docs`);
  });

  // ── Phase 3: Start recurring polls ──
  startScheduledPollers();
}

main().catch((err) => {
  console.error('[server] Fatal error:', err);
  process.exit(1);
});
