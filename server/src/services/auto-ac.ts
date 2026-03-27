import { db, schema } from '../db/index.js';
import { config } from '../config.js';
import { desc, eq } from 'drizzle-orm';
import { getAlertThresholds } from '../routes/settings.js';
import { tuya } from './tuya.js';

let lastAutoOnTime: number | null = null;

function logEvent(action: string, temp?: number) {
  db.insert(schema.acEvents).values({
    timestamp: Math.floor(Date.now() / 1000),
    action,
    temp: temp ?? null,
  }).run();
}

function createNotification(title: string, message: string, severity: 'info' | 'warning' | 'critical') {
  db.insert(schema.notifications).values({
    timestamp: Math.floor(Date.now() / 1000),
    type: 'auto_ac',
    title,
    message,
    severity,
    value: null,
    read: false,
  }).run();
  console.log(`[auto-ac] ${title}: ${message}`);
}

function getAcState() {
  const row = db.select().from(schema.acState).where(eq(schema.acState.key, 'ac')).get();
  return row ?? { power: false, temp: 24 };
}

function saveAcState(power: boolean, temp: number) {
  db.insert(schema.acState).values({
    key: 'ac',
    power,
    temp,
    mode: 0,
    fan: 0,
    updatedAt: Math.floor(Date.now() / 1000),
  }).onConflictDoUpdate({
    target: schema.acState.key,
    set: { power, temp, updatedAt: Math.floor(Date.now() / 1000) },
  }).run();
}

/** Check temperatures and auto control AC */
export async function checkAutoAc(): Promise<void> {
  const thresholds = getAlertThresholds();
  const ac = thresholds.auto_ac;
  if (!ac.enabled) return;

  // Get current temps
  const device = db.select().from(schema.deviceRealtime)
    .where(eq(schema.deviceRealtime.deviceId, config.solarman.deviceId))
    .orderBy(desc(schema.deviceRealtime.polledAt))
    .limit(1)
    .get();

  if (!device?.dataJson) return;

  const params = typeof device.dataJson === 'string' ? JSON.parse(device.dataJson) : device.dataJson;
  const inverterTemp = params.AC_T ? parseFloat(params.AC_T.value) : null;
  const batteryTemp = params.B_T1 ? parseFloat(params.B_T1.value) : null;
  const acState = getAcState();
  const now = Math.floor(Date.now() / 1000);

  if (!acState.power) {
    // ── AC is OFF — check if we need to turn it on ──
    const inverterHot = inverterTemp !== null && inverterTemp >= ac.turnOnInverter;
    const batteryHot = batteryTemp !== null && batteryTemp >= ac.turnOnBattery;

    if (inverterHot || batteryHot) {
      const reason = inverterHot
        ? `Inverter at ${inverterTemp}°C`
        : `Battery at ${batteryTemp}°C`;

      try {
        await tuya.powerOnWithTemp(ac.targetTemp);
        saveAcState(true, ac.targetTemp);
        logEvent('auto_power_on', ac.targetTemp);
        lastAutoOnTime = now;
        createNotification('Auto AC: ON',
          `${reason} — AC turned on at ${ac.targetTemp}°C`,
          'info');
      } catch (e) {
        console.error('[auto-ac] Failed to turn on:', (e as Error).message);
      }
    }
  } else {
    // ── AC is ON — check if we can turn it off ──
    // Respect minimum on-time
    if (lastAutoOnTime && (now - lastAutoOnTime) < ac.minOnMinutes * 60) {
      return;
    }

    const inverterCool = inverterTemp === null || inverterTemp <= ac.turnOffInverter;
    const batteryCool = batteryTemp === null || batteryTemp <= ac.turnOffBattery;

    if (inverterCool && batteryCool) {
      try {
        await tuya.powerOff();
        saveAcState(false, ac.targetTemp);
        logEvent('auto_power_off');
        lastAutoOnTime = null;
        createNotification('Auto AC: OFF',
          `Temps cooled down (Inverter: ${inverterTemp ?? '?'}°C, Battery: ${batteryTemp ?? '?'}°C) — AC turned off`,
          'info');
      } catch (e) {
        console.error('[auto-ac] Failed to turn off:', (e as Error).message);
      }
    }
  }
}
