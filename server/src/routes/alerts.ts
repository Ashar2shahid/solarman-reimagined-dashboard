import { Router } from 'express';
import { db, schema } from '../db/index.js';
import { desc, count } from 'drizzle-orm';

const router = Router();

router.get('/', (_req, res) => {
  const rows = db.select().from(schema.alerts)
    .orderBy(desc(schema.alerts.alertTime))
    .all();
  res.json(rows);
});

router.get('/count', (_req, res) => {
  const result = db.select({ count: count() }).from(schema.alerts).get();
  res.json({ count: result?.count ?? 0 });
});

export default router;
