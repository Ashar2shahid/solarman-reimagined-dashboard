import { Router } from 'express';
import { db, schema } from '../db/index.js';
import { config } from '../config.js';
import { eq } from 'drizzle-orm';

const router = Router();

router.get('/station', (_req, res) => {
  const row = db.select().from(schema.stationInfo)
    .where(eq(schema.stationInfo.stationId, config.solarman.stationId))
    .get();
  res.json(row ?? null);
});

router.get('/system-stats', (_req, res) => {
  const row = db.select().from(schema.systemStats)
    .where(eq(schema.systemStats.stationId, config.solarman.stationId))
    .get();
  res.json(row ?? null);
});

router.get('/energy-saved', (_req, res) => {
  const row = db.select().from(schema.energySaved)
    .where(eq(schema.energySaved.stationId, config.solarman.stationId))
    .get();
  res.json(row ?? null);
});

export default router;
