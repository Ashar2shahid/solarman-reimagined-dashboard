import { db, schema } from '../../db/index.js';
import { solarmanApi } from '../solarman-api.js';
import { config } from '../../config.js';
import { eq, and } from 'drizzle-orm';

const BATCH_SIZE = 10; // params per API request
const BACKFILL_DAYS = 60;

function dateStr(d: Date): string {
  return d.toISOString().split('T')[0];
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/** Fetch and store device params definitions */
export async function pollDeviceParams(): Promise<void> {
  const params = await solarmanApi.getDeviceParams();
  const deviceId = config.solarman.deviceId;

  for (const p of params) {
    db.insert(schema.deviceParams).values({
      deviceId,
      storageName: p.storageName,
      name: p.name,
      unit: p.unit ?? null,
    }).onConflictDoUpdate({
      target: [schema.deviceParams.deviceId, schema.deviceParams.storageName],
      set: { name: p.name, unit: p.unit ?? null },
    }).run();
  }
  console.log(`[device-chart] Stored ${params.length} param definitions`);
}

/** Get all param storage names from DB */
function getAllParamKeys(): string[] {
  const rows = db.select({ storageName: schema.deviceParams.storageName })
    .from(schema.deviceParams)
    .where(eq(schema.deviceParams.deviceId, config.solarman.deviceId))
    .all();
  return rows.map(r => r.storageName);
}

/** Fetch chart data for a single day and a batch of params */
async function fetchAndStoreDayBatch(date: string, paramBatch: string[]): Promise<number> {
  const deviceId = config.solarman.deviceId;
  const series = await solarmanApi.getDeviceChart('day', paramBatch, date);
  let count = 0;

  for (const s of series) {
    if (!s.detailList) continue;
    for (const point of s.detailList) {
      db.insert(schema.deviceChartData).values({
        deviceId,
        storageName: s.storageName,
        date,
        collectionTime: point.collectionTime,
        value: point.value,
      }).onConflictDoNothing().run();
      count++;
    }
  }
  return count;
}

/** Fetch all params for a single day, batched */
async function fetchDay(date: string, allParams: string[]): Promise<number> {
  let total = 0;
  for (let i = 0; i < allParams.length; i += BATCH_SIZE) {
    const batch = allParams.slice(i, i + BATCH_SIZE);
    try {
      const count = await fetchAndStoreDayBatch(date, batch);
      total += count;
    } catch (err: any) {
      console.error(`[device-chart] Failed batch for ${date} params ${batch[0]}...: ${err.message}`);
    }
    // Small delay between batches to avoid rate limiting
    await sleep(500);
  }
  return total;
}

/** Check if we have data for a given date */
function hasDataForDate(date: string): boolean {
  const row = db.select({ date: schema.deviceChartData.date })
    .from(schema.deviceChartData)
    .where(and(
      eq(schema.deviceChartData.deviceId, config.solarman.deviceId),
      eq(schema.deviceChartData.date, date),
    ))
    .limit(1)
    .get();
  return !!row;
}

/** Initial backfill: fetch last 60 days of data for all params */
export async function backfillDeviceChart(): Promise<void> {
  const allParams = getAllParamKeys();
  if (allParams.length === 0) {
    console.log('[device-chart] No params in DB yet, skipping backfill');
    return;
  }

  console.log(`[device-chart] Starting backfill for ${BACKFILL_DAYS} days, ${allParams.length} params...`);
  const today = new Date();

  for (let i = 0; i < BACKFILL_DAYS; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const date = dateStr(d);

    // Skip if we already have data (don't re-fetch completed days)
    // Always re-fetch today and yesterday since they may have new data
    if (i > 1 && hasDataForDate(date)) {
      continue;
    }

    console.log(`[device-chart] Fetching ${date} (day ${i + 1}/${BACKFILL_DAYS})...`);
    const count = await fetchDay(date, allParams);
    console.log(`[device-chart] ${date}: stored ${count} data points`);

    // Delay between days to be gentle on the API
    await sleep(1000);
  }

  console.log('[device-chart] Backfill complete');
}

/** Regular poll: fetch today's data (called every 6 hours) */
export async function pollDeviceChart(): Promise<void> {
  const allParams = getAllParamKeys();
  if (allParams.length === 0) return;

  const today = dateStr(new Date());
  console.log(`[device-chart] Polling ${today}...`);
  const count = await fetchDay(today, allParams);
  console.log(`[device-chart] ${today}: stored ${count} data points`);
}
