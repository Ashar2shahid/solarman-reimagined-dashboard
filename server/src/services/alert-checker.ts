import { db, schema } from '../db/index.js';
import { config } from '../config.js';
import { desc, eq, and, gte } from 'drizzle-orm';
import { getAlertThresholds } from '../routes/settings.js';

function getLastNotification(type: string): { timestamp: number } | undefined {
  return db.select({ timestamp: schema.notifications.timestamp })
    .from(schema.notifications)
    .where(eq(schema.notifications.type, type))
    .orderBy(desc(schema.notifications.timestamp))
    .limit(1)
    .get();
}

function shouldAlert(type: string, cooldownSeconds: number): boolean {
  const last = getLastNotification(type);
  if (!last) return true;
  const elapsed = Math.floor(Date.now() / 1000) - last.timestamp;
  return elapsed > cooldownSeconds;
}

function createNotification(type: string, title: string, message: string, severity: 'info' | 'warning' | 'critical', value: number, dismissTypes?: string[]) {
  // Auto-dismiss lower severity alerts of related types
  if (dismissTypes?.length) {
    for (const t of dismissTypes) {
      db.update(schema.notifications)
        .set({ read: true })
        .where(eq(schema.notifications.type, t))
        .run();
    }
  }
  db.insert(schema.notifications).values({
    timestamp: Math.floor(Date.now() / 1000),
    type,
    title,
    message,
    severity,
    value,
    read: false,
  }).run();
  console.log(`[alert] ${severity.toUpperCase()}: ${title} — ${message}`);
}

/** Check device data and create notifications if thresholds are breached */
export function checkAlerts(): void {
  const thresholds = getAlertThresholds();
  const cooldown = thresholds.cooldown_seconds;

  // Get latest device data
  const device = db.select().from(schema.deviceRealtime)
    .where(eq(schema.deviceRealtime.deviceId, config.solarman.deviceId))
    .orderBy(desc(schema.deviceRealtime.polledAt))
    .limit(1)
    .get();

  if (!device?.dataJson) return;

  const params = typeof device.dataJson === 'string' ? JSON.parse(device.dataJson) : device.dataJson;

  // ── Check if AC is on and temp is decreasing (suppress per-sensor) ──
  let suppressInverterAlert = false;
  let suppressBatteryAlert = false;
  if (thresholds.suppress_temp_if_ac_cooling) {
    const acRow = db.select().from(schema.acState).where(eq(schema.acState.key, 'ac')).get();
    if (acRow?.power) {
      const checkMinutes = thresholds.suppress_temp_check_minutes;
      const cutoff = Math.floor(Date.now() / 1000) - (checkMinutes * 60);
      const readingFromNMinutesAgo = db.select().from(schema.deviceRealtime)
        .where(and(
          eq(schema.deviceRealtime.deviceId, config.solarman.deviceId),
          gte(schema.deviceRealtime.polledAt, cutoff),
        ))
        .orderBy(schema.deviceRealtime.polledAt)
        .limit(1)
        .get();

      if (readingFromNMinutesAgo?.dataJson) {
        const oldParams = typeof readingFromNMinutesAgo.dataJson === 'string' ? JSON.parse(readingFromNMinutesAgo.dataJson) : readingFromNMinutesAgo.dataJson;
        const oldInverter = oldParams.AC_T ? parseFloat(oldParams.AC_T.value) : null;
        const oldBattery = oldParams.B_T1 ? parseFloat(oldParams.B_T1.value) : null;
        const curInverter = params.AC_T ? parseFloat(params.AC_T.value) : null;
        const curBattery = params.B_T1 ? parseFloat(params.B_T1.value) : null;

        if (oldInverter !== null && curInverter !== null && curInverter <= oldInverter) {
          suppressInverterAlert = true;
        }
        if (oldBattery !== null && curBattery !== null && curBattery <= oldBattery) {
          suppressBatteryAlert = true;
        }
      }
    }
  }

  // ── Inverter Temperature ──
  const inverterTemp = params.AC_T ? parseFloat(params.AC_T.value) : null;
  if (inverterTemp !== null && !suppressInverterAlert) {
    const t = thresholds.inverter_temp;
    if (inverterTemp >= t.critical) {
      if (shouldAlert('temp_inverter_critical', cooldown)) {
        createNotification('temp_inverter_critical', 'Inverter Temperature Critical',
          `Inverter at ${inverterTemp}°C — immediate attention required`,
          'critical', inverterTemp, ['temp_inverter_recommend_ac', 'temp_inverter_warning']);
      }
    } else if (inverterTemp >= t.recommend_ac) {
      if (shouldAlert('temp_inverter_recommend_ac', cooldown)) {
        createNotification('temp_inverter_recommend_ac', 'Inverter Temperature High',
          `Inverter at ${inverterTemp}°C — consider turning on AC to cool the room`,
          'warning', inverterTemp, ['temp_inverter_warning']);
      }
    } else if (inverterTemp >= t.warning) {
      if (shouldAlert('temp_inverter_warning', cooldown)) {
        createNotification('temp_inverter_warning', 'Inverter Temperature Warning',
          `Inverter at ${inverterTemp}°C — monitoring`,
          'info', inverterTemp);
      }
    }
  }

  // ── Battery Temperature ──
  const batteryTemp = params.B_T1 ? parseFloat(params.B_T1.value) : null;
  if (batteryTemp !== null && !suppressBatteryAlert) {
    const t = thresholds.battery_temp;
    if (batteryTemp >= t.critical) {
      if (shouldAlert('temp_battery_critical', cooldown)) {
        createNotification('temp_battery_critical', 'Battery Temperature Critical',
          `Battery at ${batteryTemp}°C — immediate attention required`,
          'critical', batteryTemp, ['temp_battery_recommend_ac', 'temp_battery_warning']);
      }
    } else if (batteryTemp >= t.recommend_ac) {
      if (shouldAlert('temp_battery_recommend_ac', cooldown)) {
        createNotification('temp_battery_recommend_ac', 'Battery Temperature High',
          `Battery at ${batteryTemp}°C — consider turning on AC to cool the room`,
          'warning', batteryTemp, ['temp_battery_warning']);
      }
    } else if (batteryTemp >= t.warning) {
      if (shouldAlert('temp_battery_warning', cooldown)) {
        createNotification('temp_battery_warning', 'Battery Temperature Warning',
          `Battery at ${batteryTemp}°C — monitoring`,
          'info', batteryTemp);
      }
    }
  }

  // ── Battery SoC (dynamic levels) ──
  const realtime = db.select().from(schema.realtimeSnapshots)
    .orderBy(desc(schema.realtimeSnapshots.polledAt))
    .limit(1)
    .get();

  if (realtime?.batterySoc !== null && realtime?.batterySoc !== undefined) {
    const soc = realtime.batterySoc;
    // Check levels from lowest to highest — alert on the first one SoC is below
    for (const { level, severity } of thresholds.battery_soc_levels) {
      if (soc <= level) {
        const type = `battery_soc_${level}`;
        if (shouldAlert(type, cooldown)) {
          createNotification(type, `Battery at ${soc}%`,
            `Battery SoC dropped below ${level}%`,
            severity, soc);
        }
        break;
      }
    }
  }

  // ── Grid Outage ──
  if (thresholds.grid_outage_enabled && realtime?.wireStatus === 'STATIC' && realtime?.wirePower === 0) {
    if (shouldAlert('grid_outage', cooldown)) {
      createNotification('grid_outage', 'Grid Outage',
        'Grid connection lost — running on solar + battery',
        'warning', 0);
    }
  }
}
