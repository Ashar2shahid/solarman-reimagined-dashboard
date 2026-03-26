import { Router } from 'express';
import { tuya } from '../services/tuya.js';
import { db, schema } from '../db/index.js';
import { eq, gte, lte, and } from 'drizzle-orm';

const router = Router();
const KEY = 'ac';

function getState() {
  const row = db.select().from(schema.acState).where(eq(schema.acState.key, KEY)).get();
  return row ?? { power: false, temp: 24, mode: 0, fan: 0 };
}

function saveState(state: { power: boolean; temp: number; mode: number; fan: number }) {
  db.insert(schema.acState).values({
    key: KEY,
    power: state.power,
    temp: state.temp,
    mode: state.mode,
    fan: state.fan,
    updatedAt: Math.floor(Date.now() / 1000),
  }).onConflictDoUpdate({
    target: schema.acState.key,
    set: {
      power: state.power,
      temp: state.temp,
      mode: state.mode,
      fan: state.fan,
      updatedAt: Math.floor(Date.now() / 1000),
    },
  }).run();
}

function logEvent(action: string, temp?: number) {
  db.insert(schema.acEvents).values({
    timestamp: Math.floor(Date.now() / 1000),
    action,
    temp: temp ?? null,
  }).run();
}

router.get('/state', (_req, res) => {
  res.json(getState());
});

router.get('/events', (req, res) => {
  const date = req.query.date as string; // YYYY-MM-DD
  if (!date) {
    return res.status(400).json({ error: 'date query param required' });
  }
  // Parse date to get start/end timestamps
  const start = new Date(date + 'T00:00:00+05:30').getTime() / 1000;
  const end = start + 86400;

  const events = db.select().from(schema.acEvents)
    .where(and(gte(schema.acEvents.timestamp, start), lte(schema.acEvents.timestamp, end)))
    .all();

  res.json(events);
});

router.post('/power', async (req, res) => {
  try {
    const { on } = req.body as { on: boolean };
    const current = getState();
    if (on) {
      await tuya.powerOnWithTemp(current.temp);
      logEvent('power_on', current.temp);
    } else {
      await tuya.powerOff();
      logEvent('power_off');
    }
    const state = { ...current, power: on };
    saveState(state);
    res.json({ ok: true, state });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.post('/temp', async (req, res) => {
  try {
    const { temp } = req.body as { temp: number };
    await tuya.setTemp(temp);
    logEvent('set_temp', temp);
    const state = { ...getState(), power: true, temp };
    saveState(state);
    res.json({ ok: true, state });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

export default router;
