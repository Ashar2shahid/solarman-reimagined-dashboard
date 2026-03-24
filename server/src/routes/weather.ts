import { Router } from 'express';
import { db, schema } from '../db/index.js';

const router = Router();

router.get('/', (_req, res) => {
  const rows = db.select().from(schema.weatherForecast)
    .orderBy(schema.weatherForecast.date)
    .all();
  res.json(rows);
});

export default router;
