import { sqliteTable, text, integer, real, index, primaryKey } from 'drizzle-orm/sqlite-core';

// 1. Real-time flow chart snapshots (1-min polls, 7-day retention)
// Keeps auto-increment PK — it's append-only time-series, no natural key
export const realtimeSnapshots = sqliteTable('realtime_snapshots', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  timestamp: integer('timestamp').notNull(),
  polledAt: integer('polled_at').notNull(),
  generationPower: real('generation_power'),
  usePower: real('use_power'),
  wirePower: real('wire_power'),
  buyPower: real('buy_power'),
  gridPower: real('grid_power'),
  batteryPower: real('battery_power'),
  chargePower: real('charge_power'),
  dischargePower: real('discharge_power'),
  batterySoc: integer('battery_soc'),
  genStatus: text('gen_status'),
  wireStatus: text('wire_status'),
  batteryStatus: text('battery_status'),
  generationValue: real('generation_value'),
  useValue: real('use_value'),
  gridValue: real('grid_value'),
  buyValue: real('buy_value'),
  chargeValue: real('charge_value'),
  dischargeValue: real('discharge_value'),
  fullPowerHoursDay: real('full_power_hours_day'),
  networkStatus: text('network_status'),
}, (table) => [
  index('idx_realtime_timestamp').on(table.timestamp),
  index('idx_realtime_polled_at').on(table.polledAt),
]);

// 2. Station info (single row, upserted)
export const stationInfo = sqliteTable('station_info', {
  stationId: integer('station_id').primaryKey(),
  name: text('name'),
  installedCapacity: real('installed_capacity'),
  batterySoc: integer('battery_soc'),
  generationPower: real('generation_power'),
  usePower: real('use_power'),
  buyPower: real('buy_power'),
  generationValue: real('generation_value'),
  useValue: real('use_value'),
  gridValue: real('grid_value'),
  buyValue: real('buy_value'),
  generationMonth: real('generation_month'),
  useMonth: real('use_month'),
  gridMonth: real('grid_month'),
  buyMonth: real('buy_month'),
  generationYear: real('generation_year'),
  useYear: real('use_year'),
  gridYear: real('grid_year'),
  buyYear: real('buy_year'),
  generationTotal: real('generation_total'),
  fullPowerHoursDay: real('full_power_hours_day'),
  networkStatus: text('network_status'),
  locationAddress: text('location_address'),
  locationLat: real('location_lat'),
  locationLng: real('location_lng'),
  regionTimezone: text('region_timezone'),
  updatedAt: integer('updated_at'),
});

// 3. Daily records — PK: (date, timestamp)
export const dailyRecords = sqliteTable('daily_records', {
  date: text('date').notNull(),
  timestamp: integer('timestamp').notNull(),
  generationPower: real('generation_power'),
  usePower: real('use_power'),
  gridPower: real('grid_power'),
  buyPower: real('buy_power'),
  wirePower: real('wire_power'),
  chargePower: real('charge_power'),
  dischargePower: real('discharge_power'),
  batteryPower: real('battery_power'),
  batterySoc: real('battery_soc'),
  wireStatus: text('wire_status'),
  batteryStatus: text('battery_status'),
  generationCapacity: real('generation_capacity'),
}, (table) => [
  primaryKey({ columns: [table.date, table.timestamp] }),
]);

// 4. Daily statistics — PK: date
export const dailyStatistics = sqliteTable('daily_statistics', {
  date: text('date').primaryKey(),
  generationValue: real('generation_value'),
  useValue: real('use_value'),
  gridValue: real('grid_value'),
  buyValue: real('buy_value'),
  chargeValue: real('charge_value'),
  dischargeValue: real('discharge_value'),
  incomeValue: real('income_value'),
  fullPowerHoursDay: real('full_power_hours_day'),
  genForCharge: real('gen_for_charge'),
  genForUse: real('gen_for_use'),
  genForGrid: real('gen_for_grid'),
  useFromDischarge: real('use_from_discharge'),
  useFromGen: real('use_from_gen'),
  useFromBuy: real('use_from_buy'),
});

// 5. Monthly records — PK: (year, month, day)
export const monthlyRecords = sqliteTable('monthly_records', {
  year: integer('year').notNull(),
  month: integer('month').notNull(),
  day: integer('day').notNull(),
  generationValue: real('generation_value'),
  useValue: real('use_value'),
  gridValue: real('grid_value'),
  buyValue: real('buy_value'),
  chargeValue: real('charge_value'),
  dischargeValue: real('discharge_value'),
  incomeValue: real('income_value'),
  fullPowerHoursDay: real('full_power_hours_day'),
  generationRatio: real('generation_ratio'),
  gridRatio: real('grid_ratio'),
  useRatio: real('use_ratio'),
  buyRatio: real('buy_ratio'),
  selfGenAndUseValue: real('self_gen_and_use_value'),
  selfSufficiencyValue: real('self_sufficiency_value'),
}, (table) => [
  primaryKey({ columns: [table.year, table.month, table.day] }),
]);

// 6. Yearly records — PK: (year, month)
export const yearlyRecords = sqliteTable('yearly_records', {
  year: integer('year').notNull(),
  month: integer('month').notNull(),
  generationValue: real('generation_value'),
  useValue: real('use_value'),
  gridValue: real('grid_value'),
  buyValue: real('buy_value'),
  chargeValue: real('charge_value'),
  dischargeValue: real('discharge_value'),
  incomeValue: real('income_value'),
  fullPowerHoursDay: real('full_power_hours_day'),
  generationRatio: real('generation_ratio'),
  gridRatio: real('grid_ratio'),
  useRatio: real('use_ratio'),
  buyRatio: real('buy_ratio'),
  selfGenAndUseValue: real('self_gen_and_use_value'),
  selfSufficiencyValue: real('self_sufficiency_value'),
}, (table) => [
  primaryKey({ columns: [table.year, table.month] }),
]);

// 7. Lifetime records — PK: year
export const lifetimeRecords = sqliteTable('lifetime_records', {
  year: integer('year').primaryKey(),
  generationValue: real('generation_value'),
  useValue: real('use_value'),
  gridValue: real('grid_value'),
  buyValue: real('buy_value'),
  chargeValue: real('charge_value'),
  dischargeValue: real('discharge_value'),
  incomeValue: real('income_value'),
  fullPowerHoursDay: real('full_power_hours_day'),
  operatingTotalDays: integer('operating_total_days'),
});

// 8. Device realtime (inverter data as JSON, 7-day retention)
// Keeps auto-increment PK — append-only time-series
export const deviceRealtime = sqliteTable('device_realtime', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  deviceId: integer('device_id').notNull(),
  polledAt: integer('polled_at').notNull(),
  collectionTime: integer('collection_time'),
  connectStatus: integer('connect_status'),
  dataJson: text('data_json').notNull(),
}, (table) => [
  index('idx_device_polled').on(table.deviceId, table.polledAt),
]);

// 9. Weather forecast — PK: date
export const weatherForecast = sqliteTable('weather_forecast', {
  date: text('date').primaryKey(),
  fetchedAt: integer('fetched_at').notNull(),
  regionName: text('region_name'),
  weatherCode: text('weather_code'),
  weatherPic: text('weather_pic'),
  temp: real('temp'),
  tempMin: real('temp_min'),
  tempMax: real('temp_max'),
  humidity: integer('humidity'),
  pressure: integer('pressure'),
  windSpeed: real('wind_speed'),
  windDeg: integer('wind_deg'),
  clouds: integer('clouds'),
  sunrise: integer('sunrise'),
  sunset: integer('sunset'),
  sunshineDuration: integer('sunshine_duration'),
});

// 10. Alerts
// Keeps auto-increment PK — alert IDs from Solarman aren't exposed in the search response
export const alerts = sqliteTable('alerts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  alertName: text('alert_name'),
  deviceName: text('device_name'),
  deviceSn: text('device_sn'),
  level: text('level'),
  influence: text('influence'),
  alertTime: integer('alert_time'),
  fetchedAt: integer('fetched_at'),
});

// 11. Energy saved — PK: station_id (single row)
export const energySaved = sqliteTable('energy_saved', {
  stationId: integer('station_id').primaryKey(),
  generationTotal: real('generation_total'),
  coalSaved: real('coal_saved'),
  co2Reduced: real('co2_reduced'),
  treesPlanted: real('trees_planted'),
  incomeTotal: real('income_total'),
  updatedAt: integer('updated_at'),
});

// 12. System stats — PK: station_id (single row)
export const systemStats = sqliteTable('system_stats', {
  stationId: integer('station_id').primaryKey(),
  selfGenAndUseValue: real('self_gen_and_use_value'),
  selfSufficiencyValue: real('self_sufficiency_value'),
  generationRatio: real('generation_ratio'),
  gridRatio: real('grid_ratio'),
  useRatio: real('use_ratio'),
  buyRatio: real('buy_ratio'),
  chargeRatio: real('charge_ratio'),
  useDischargeRatio: real('use_discharge_ratio'),
  gridRatioMonth: real('grid_ratio_month'),
  useRatioMonth: real('use_ratio_month'),
  buyRatioMonth: real('buy_ratio_month'),
  generationRatioMonth: real('generation_ratio_month'),
  gridRatioYear: real('grid_ratio_year'),
  useRatioYear: real('use_ratio_year'),
  buyRatioYear: real('buy_ratio_year'),
  generationRatioYear: real('generation_ratio_year'),
  chargeTotal: real('charge_total'),
  dischargeTotal: real('discharge_total'),
  incomeTotal: real('income_total'),
  chargeMonth: real('charge_month'),
  dischargeMonth: real('discharge_month'),
  chargeYear: real('charge_year'),
  dischargeYear: real('discharge_year'),
  updatedAt: integer('updated_at'),
});

// 13. Device parameter definitions — PK: (device_id, storage_name)
export const deviceParams = sqliteTable('device_params', {
  deviceId: integer('device_id').notNull(),
  storageName: text('storage_name').notNull(),
  name: text('name').notNull(),
  unit: text('unit'),
}, (table) => [
  primaryKey({ columns: [table.deviceId, table.storageName] }),
]);

// 14. Device chart historical data — PK: (device_id, storage_name, collection_time)
export const deviceChartData = sqliteTable('device_chart_data', {
  deviceId: integer('device_id').notNull(),
  storageName: text('storage_name').notNull(),
  date: text('date').notNull(),
  collectionTime: integer('collection_time').notNull(),
  value: text('value').notNull(),
}, (table) => [
  primaryKey({ columns: [table.deviceId, table.storageName, table.collectionTime] }),
  index('idx_device_chart_date').on(table.deviceId, table.storageName, table.date),
]);
