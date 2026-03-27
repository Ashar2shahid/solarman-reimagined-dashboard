import { Router } from 'express';
import { db, schema } from '../db/index.js';
import { desc, eq } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

const router = Router();

// Get recent notifications (last 50)
router.get('/', (_req, res) => {
  const rows = db.select().from(schema.notifications)
    .orderBy(desc(schema.notifications.timestamp))
    .limit(50)
    .all();
  res.json(rows);
});

// Get unread count
router.get('/unread', (_req, res) => {
  const result = db.select({ count: sql<number>`count(*)` })
    .from(schema.notifications)
    .where(eq(schema.notifications.read, false))
    .get();
  res.json({ count: result?.count ?? 0 });
});

// Mark one as read
router.post('/:id/read', (req, res) => {
  const id = parseInt(req.params.id);
  db.update(schema.notifications)
    .set({ read: true })
    .where(eq(schema.notifications.id, id))
    .run();
  res.json({ ok: true });
});

// Mark all as read
router.post('/read-all', (_req, res) => {
  db.update(schema.notifications)
    .set({ read: true })
    .where(eq(schema.notifications.read, false))
    .run();
  res.json({ ok: true });
});

export default router;
