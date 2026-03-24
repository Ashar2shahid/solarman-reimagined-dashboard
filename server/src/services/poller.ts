import cron from 'node-cron';

import { pollRealtime } from './pollers/realtime-poller.js';
import { pollDevice } from './pollers/device-poller.js';
import { backfillHistory, pollCurrentHistory } from './pollers/history-poller.js';
import { pollWeather, pollEnergySaved, pollAlerts, pollSystemStats } from './pollers/misc-poller.js';
import { pollDeviceParams, backfillDeviceChart, pollDeviceChart } from './pollers/device-chart-poller.js';

interface PollerStatus {
  lastSuccess: number | null;
  lastError: string | null;
  lastErrorTime: number | null;
  runs: number;
}

const statuses: Record<string, PollerStatus> = {};

function initStatus(name: string): PollerStatus {
  const s: PollerStatus = { lastSuccess: null, lastError: null, lastErrorTime: null, runs: 0 };
  statuses[name] = s;
  return s;
}

async function runPoller(name: string, fn: () => Promise<void>): Promise<void> {
  const status = statuses[name] ?? initStatus(name);
  status.runs++;
  try {
    await fn();
    status.lastSuccess = Math.floor(Date.now() / 1000);
    status.lastError = null;
    console.log(`[poller] ${name} OK`);
  } catch (err: any) {
    status.lastError = err.message ?? String(err);
    status.lastErrorTime = Math.floor(Date.now() / 1000);
    console.error(`[poller] ${name} FAILED:`, err.message ?? err);
  }
}

export function getPollerStatuses(): Record<string, PollerStatus> {
  return { ...statuses };
}

/** Phase 1: Fetch real-time data + backfill all historical data. Blocks until complete. */
export async function runBackfill(): Promise<void> {
  const names = [
    'realtime', 'device',
    'systemStats', 'weather', 'energySaved', 'alerts',
    'historyBackfill', 'historyCurrent',
    'deviceParams', 'deviceChartBackfill', 'deviceChartCurrent',
  ];
  for (const n of names) initStatus(n);

  // Fetch real-time data first
  console.log('[poller] Fetching real-time data...');
  await Promise.allSettled([
    runPoller('realtime', pollRealtime),
    runPoller('device', pollDevice),
    runPoller('systemStats', pollSystemStats),
    runPoller('weather', pollWeather),
    runPoller('energySaved', pollEnergySaved),
    runPoller('alerts', pollAlerts),
  ]);
  console.log('[poller] Real-time data complete');

  // Backfill all historical data (blocks until done)
  console.log('[poller] Starting historical backfill...');
  await Promise.allSettled([
    runPoller('historyBackfill', backfillHistory),
    runPoller('deviceParams', pollDeviceParams).then(() =>
      runPoller('deviceChartBackfill', backfillDeviceChart)
    ),
  ]);
  console.log('[poller] Historical backfill complete');
}

/** Phase 3: Start recurring scheduled polls. Call after server is listening. */
export function startScheduledPollers(): void {
  // Every 1 minute: real-time only
  cron.schedule('* * * * *', () => {
    runPoller('realtime', pollRealtime);
    runPoller('device', pollDevice);
  });

  // Every 5 minutes: system stats, alerts
  cron.schedule('*/5 * * * *', () => {
    runPoller('systemStats', pollSystemStats);
    runPoller('alerts', pollAlerts);
  });

  // Every 15 minutes: weather, energy saved
  cron.schedule('*/15 * * * *', () => {
    runPoller('weather', pollWeather);
    runPoller('energySaved', pollEnergySaved);
  });

  // Every 6 hours: refresh current period historical data
  cron.schedule('0 */6 * * *', () => {
    runPoller('historyCurrent', pollCurrentHistory);
    runPoller('deviceChartCurrent', pollDeviceChart);
  });

  console.log('[poller] Scheduled polls registered');
}
