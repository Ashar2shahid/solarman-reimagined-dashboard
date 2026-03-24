import { Router } from 'express';
import { db, schema } from '../db/index.js';
import { desc, gte } from 'drizzle-orm';

const router = Router();

// Latest flow chart data
router.get('/current', (_req, res) => {
  const row = db.select().from(schema.realtimeSnapshots)
    .orderBy(desc(schema.realtimeSnapshots.polledAt))
    .limit(1)
    .get();
  res.json(row ?? null);
});

// Recent realtime history (for sparkline charts)
router.get('/history', (req, res) => {
  const minutes = parseInt(req.query.minutes as string) || 60;
  const cutoff = Math.floor(Date.now() / 1000) - minutes * 60;
  const rows = db.select().from(schema.realtimeSnapshots)
    .where(gte(schema.realtimeSnapshots.polledAt, cutoff))
    .orderBy(schema.realtimeSnapshots.polledAt)
    .all();
  res.json(rows);
});

export default router;
