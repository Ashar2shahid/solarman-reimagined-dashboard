import { Router } from 'express';
import { tuya } from '../services/tuya.js';
import { db, schema } from '../db/index.js';
import { eq } from 'drizzle-orm';

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

router.get('/state', (_req, res) => {
  res.json(getState());
});

router.post('/power', async (req, res) => {
  try {
    const { on } = req.body as { on: boolean };
    const current = getState();
    if (on) {
      await tuya.powerOnWithTemp(current.temp);
    } else {
      await tuya.powerOff();
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
    const state = { ...getState(), power: true, temp };
    saveState(state);
    res.json({ ok: true, state });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

export default router;
