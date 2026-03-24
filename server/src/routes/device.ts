import { Router } from 'express';
import { db, schema } from '../db/index.js';
import { desc, gte, eq, and, inArray, asc } from 'drizzle-orm';
import { config } from '../config.js';

const router = Router();

// Latest inverter data (all 104 params)
router.get('/current', (_req, res) => {
  const row = db.select().from(schema.deviceRealtime)
    .where(eq(schema.deviceRealtime.deviceId, config.solarman.deviceId))
    .orderBy(desc(schema.deviceRealtime.polledAt))
    .limit(1)
    .get();

  if (!row) return res.json(null);

  res.json({
    ...row,
    data: JSON.parse(row.dataJson),
    dataJson: undefined,
  });
});

// Recent device history
router.get('/history', (req, res) => {
  const minutes = parseInt(req.query.minutes as string) || 60;
  const cutoff = Math.floor(Date.now() / 1000) - minutes * 60;

  const rows = db.select().from(schema.deviceRealtime)
    .where(gte(schema.deviceRealtime.polledAt, cutoff))
    .orderBy(schema.deviceRealtime.polledAt)
    .all();

  res.json(rows.map(row => ({
    ...row,
    data: JSON.parse(row.dataJson),
    dataJson: undefined,
  })));
});

// Chartable parameter definitions (from DB)
router.get('/params', (_req, res) => {
  const rows = db.select().from(schema.deviceParams)
    .where(eq(schema.deviceParams.deviceId, config.solarman.deviceId))
    .all();
  res.json(rows.map(r => ({
    storageName: r.storageName,
    name: r.name,
    unit: r.unit,
  })));
});

// Device chart data from DB
// GET /api/device/chart?date=2026-03-22&params=DV1,DV2
router.get('/chart', (req, res) => {
  const date = req.query.date as string;     // YYYY-MM-DD
  const params = req.query.params as string; // comma-separated: DV1,DV2

  if (!date) return res.status(400).json({ error: 'date parameter required (YYYY-MM-DD)' });
  if (!params) return res.status(400).json({ error: 'params query required (e.g. params=DV1,DV2)' });

  const paramList = params.split(',').map(p => p.trim());
  const deviceId = config.solarman.deviceId;

  // Query data points for the requested params and date
  const rows = db.select().from(schema.deviceChartData)
    .where(and(
      eq(schema.deviceChartData.deviceId, deviceId),
      eq(schema.deviceChartData.date, date),
      inArray(schema.deviceChartData.storageName, paramList),
    ))
    .orderBy(asc(schema.deviceChartData.collectionTime))
    .all();

  // Get param definitions for names/units
  const paramDefs = db.select().from(schema.deviceParams)
    .where(and(
      eq(schema.deviceParams.deviceId, deviceId),
      inArray(schema.deviceParams.storageName, paramList),
    ))
    .all();

  const defMap = new Map(paramDefs.map(d => [d.storageName, d]));

  // Group by storageName into series (same shape as Solarman API)
  const seriesMap = new Map<string, { storageName: string; name: string; unit: string; detailList: { collectionTime: number; value: string }[] }>();

  for (const p of paramList) {
    const def = defMap.get(p);
    seriesMap.set(p, {
      storageName: p,
      name: def?.name ?? p,
      unit: def?.unit ?? '',
      detailList: [],
    });
  }

  for (const row of rows) {
    const series = seriesMap.get(row.storageName);
    if (series) {
      series.detailList.push({
        collectionTime: row.collectionTime,
        value: row.value,
      });
    }
  }

  res.json(Array.from(seriesMap.values()));
});

// List available dates that have chart data
router.get('/chart/dates', (_req, res) => {
  const rows = db.selectDistinct({ date: schema.deviceChartData.date })
    .from(schema.deviceChartData)
    .where(eq(schema.deviceChartData.deviceId, config.solarman.deviceId))
    .orderBy(desc(schema.deviceChartData.date))
    .all();
  res.json(rows.map(r => r.date));
});

export default router;
