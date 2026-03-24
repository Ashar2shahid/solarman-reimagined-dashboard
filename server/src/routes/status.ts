import { Router } from 'express';
import { getPollerStatuses } from '../services/poller.js';

const router = Router();

router.get('/', (_req, res) => {
  res.json({
    uptime: process.uptime(),
    timestamp: Math.floor(Date.now() / 1000),
    pollers: getPollerStatuses(),
  });
});

export default router;
