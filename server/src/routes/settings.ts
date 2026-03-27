import { Router } from 'express';
import { db, schema } from '../db/index.js';
import { eq } from 'drizzle-orm';

const router = Router();

const DEFAULTS: Record<string, string> = {
  'inverter_temp_warning': '40',
  'inverter_temp_recommend_ac': '45',
  'inverter_temp_critical': '50',
  'battery_temp_warning': '32',
  'battery_temp_recommend_ac': '35',
  'battery_temp_critical': '40',
  // JSON array of { level: number, severity: 'info' | 'warning' | 'critical' }
  'battery_soc_levels': JSON.stringify([
    { level: 75, severity: 'info' },
    { level: 50, severity: 'info' },
    { level: 30, severity: 'warning' },
    { level: 15, severity: 'critical' },
  ]),
  'grid_outage_enabled': 'true',
  'suppress_temp_if_ac_cooling': 'true',
  'suppress_temp_check_minutes': '10',
  'alert_cooldown_minutes': '10',
  // Auto AC
  'auto_ac_enabled': 'false',
  'auto_ac_target_temp': '24',
  'auto_ac_turn_on_inverter': '45',
  'auto_ac_turn_on_battery': '35',
  'auto_ac_turn_off_inverter': '38',
  'auto_ac_turn_off_battery': '30',
  'auto_ac_min_on_minutes': '15',
};

function getSetting(key: string): string {
  const row = db.select().from(schema.appSettings)
    .where(eq(schema.appSettings.key, key))
    .get();
  return row?.value ?? DEFAULTS[key] ?? '';
}

function setSetting(key: string, value: string) {
  db.insert(schema.appSettings).values({ key, value })
    .onConflictDoUpdate({ target: schema.appSettings.key, set: { value } })
    .run();
}

// Get all settings
router.get('/', (_req, res) => {
  const settings: Record<string, string> = {};
  for (const key of Object.keys(DEFAULTS)) {
    settings[key] = getSetting(key);
  }
  res.json(settings);
});

// Update settings (accepts any key from DEFAULTS)
router.post('/', (req, res) => {
  const updates = req.body as Record<string, string>;
  for (const [key, value] of Object.entries(updates)) {
    if (key in DEFAULTS) {
      setSetting(key, value);
    }
  }
  const settings: Record<string, string> = {};
  for (const key of Object.keys(DEFAULTS)) {
    settings[key] = getSetting(key);
  }
  res.json({ ok: true, settings });
});

export default router;

// Export for use by alert-checker
export function getAlertThresholds() {
  let socLevels: { level: number; severity: 'info' | 'warning' | 'critical' }[] = [];
  try {
    socLevels = JSON.parse(getSetting('battery_soc_levels'));
  } catch { /* use empty */ }

  return {
    inverter_temp: {
      warning: parseFloat(getSetting('inverter_temp_warning')),
      recommend_ac: parseFloat(getSetting('inverter_temp_recommend_ac')),
      critical: parseFloat(getSetting('inverter_temp_critical')),
    },
    battery_temp: {
      warning: parseFloat(getSetting('battery_temp_warning')),
      recommend_ac: parseFloat(getSetting('battery_temp_recommend_ac')),
      critical: parseFloat(getSetting('battery_temp_critical')),
    },
    battery_soc_levels: socLevels.sort((a, b) => a.level - b.level), // ascending
    grid_outage_enabled: getSetting('grid_outage_enabled') === 'true',
    suppress_temp_if_ac_cooling: getSetting('suppress_temp_if_ac_cooling') === 'true',
    suppress_temp_check_minutes: parseInt(getSetting('suppress_temp_check_minutes')),
    cooldown_seconds: parseInt(getSetting('alert_cooldown_minutes')) * 60,
    auto_ac: {
      enabled: getSetting('auto_ac_enabled') === 'true',
      targetTemp: parseInt(getSetting('auto_ac_target_temp')),
      turnOnInverter: parseFloat(getSetting('auto_ac_turn_on_inverter')),
      turnOnBattery: parseFloat(getSetting('auto_ac_turn_on_battery')),
      turnOffInverter: parseFloat(getSetting('auto_ac_turn_off_inverter')),
      turnOffBattery: parseFloat(getSetting('auto_ac_turn_off_battery')),
      minOnMinutes: parseInt(getSetting('auto_ac_min_on_minutes')),
    },
  };
}
