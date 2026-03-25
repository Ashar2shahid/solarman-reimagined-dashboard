import { db, schema } from '../../db/index.js';
import { solarmanApi } from '../solarman-api.js';
import { eq, and } from 'drizzle-orm';

const BACKFILL_DAYS = 60;

function todayParts() {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
}

function dateStr(y: number, m: number, d: number) {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function hasDailyData(date: string): boolean {
  return !!db.select({ date: schema.dailyRecords.date })
    .from(schema.dailyRecords)
    .where(eq(schema.dailyRecords.date, date))
    .limit(1)
    .get();
}

function hasMonthlyData(year: number, month: number): boolean {
  return !!db.select({ year: schema.monthlyRecords.year })
    .from(schema.monthlyRecords)
    .where(and(eq(schema.monthlyRecords.year, year), eq(schema.monthlyRecords.month, month)))
    .limit(1)
    .get();
}

function hasYearlyData(year: number): boolean {
  return !!db.select({ year: schema.yearlyRecords.year })
    .from(schema.yearlyRecords)
    .where(eq(schema.yearlyRecords.year, year))
    .limit(1)
    .get();
}

export async function pollDailyHistory(): Promise<void> {
  const { year, month, day } = todayParts();
  const date = dateStr(year, month, day);
  const data = await solarmanApi.getDailyHistory(year, month, day);

  // Upsert daily statistics
  db.insert(schema.dailyStatistics).values({
    date,
    generationValue: data.statistics.generationValue,
    useValue: data.statistics.useValue,
    gridValue: data.statistics.gridValue,
    buyValue: data.statistics.buyValue,
    chargeValue: data.statistics.chargeValue,
    dischargeValue: data.statistics.dischargeValue,
    incomeValue: data.statistics.incomeValue,
    fullPowerHoursDay: data.statistics.fullPowerHoursDay,
    genForCharge: data.statistics.genForCharge,
    genForUse: data.statistics.genForUse,
    genForGrid: data.statistics.genForGrid,
    useFromDischarge: data.statistics.useFromDischarge,
    useFromGen: data.statistics.useFromGen,
    useFromBuy: data.statistics.useFromBuy,
  }).onConflictDoUpdate({
    target: schema.dailyStatistics.date,
    set: {
      generationValue: data.statistics.generationValue,
      useValue: data.statistics.useValue,
      gridValue: data.statistics.gridValue,
      buyValue: data.statistics.buyValue,
      chargeValue: data.statistics.chargeValue,
      dischargeValue: data.statistics.dischargeValue,
      incomeValue: data.statistics.incomeValue,
      fullPowerHoursDay: data.statistics.fullPowerHoursDay,
      genForCharge: data.statistics.genForCharge,
      genForUse: data.statistics.genForUse,
      genForGrid: data.statistics.genForGrid,
      useFromDischarge: data.statistics.useFromDischarge,
      useFromGen: data.statistics.useFromGen,
      useFromBuy: data.statistics.useFromBuy,
    },
  }).run();

  // Upsert daily records (5-min intervals)
  for (const rec of data.records) {
    db.insert(schema.dailyRecords).values({
      date,
      timestamp: rec.dateTime,
      generationPower: rec.generationPower,
      usePower: rec.usePower,
      gridPower: rec.gridPower,
      buyPower: rec.buyPower,
      wirePower: rec.wirePower,
      chargePower: rec.chargePower,
      dischargePower: rec.dischargePower,
      batteryPower: rec.batteryPower,
      batterySoc: rec.batterySoc,
      wireStatus: rec.wireStatus,
      batteryStatus: rec.batteryStatus,
      generationCapacity: rec.generationCapacity,
    }).onConflictDoUpdate({
      target: [schema.dailyRecords.date, schema.dailyRecords.timestamp],
      set: {
        generationPower: rec.generationPower,
        usePower: rec.usePower,
        gridPower: rec.gridPower,
        buyPower: rec.buyPower,
        wirePower: rec.wirePower,
        chargePower: rec.chargePower,
        dischargePower: rec.dischargePower,
        batteryPower: rec.batteryPower,
        batterySoc: rec.batterySoc,
        wireStatus: rec.wireStatus,
        batteryStatus: rec.batteryStatus,
        generationCapacity: rec.generationCapacity,
      },
    }).run();
  }
}

export async function pollMonthlyHistory(): Promise<void> {
  const { year, month } = todayParts();
  const data = await solarmanApi.getMonthlyHistory(year, month);

  for (const rec of data.records) {
    db.insert(schema.monthlyRecords).values({
      year: rec.year,
      month: rec.month,
      day: rec.day,
      generationValue: rec.generationValue,
      useValue: rec.useValue,
      gridValue: rec.gridValue,
      buyValue: rec.buyValue,
      chargeValue: rec.chargeValue,
      dischargeValue: rec.dischargeValue,
      incomeValue: rec.incomeValue,
      fullPowerHoursDay: rec.fullPowerHoursDay,
      generationRatio: rec.generationRatio,
      gridRatio: rec.gridRatio,
      useRatio: rec.useRatio,
      buyRatio: rec.buyRatio,
      selfGenAndUseValue: rec.selfGenAndUseValue,
      selfSufficiencyValue: rec.selfSufficiencyValue,
    }).onConflictDoUpdate({
      target: [schema.monthlyRecords.year, schema.monthlyRecords.month, schema.monthlyRecords.day],
      set: {
        generationValue: rec.generationValue,
        useValue: rec.useValue,
        gridValue: rec.gridValue,
        buyValue: rec.buyValue,
        chargeValue: rec.chargeValue,
        dischargeValue: rec.dischargeValue,
        incomeValue: rec.incomeValue,
        fullPowerHoursDay: rec.fullPowerHoursDay,
        generationRatio: rec.generationRatio,
        gridRatio: rec.gridRatio,
        useRatio: rec.useRatio,
        buyRatio: rec.buyRatio,
        selfGenAndUseValue: rec.selfGenAndUseValue,
        selfSufficiencyValue: rec.selfSufficiencyValue,
      },
    }).run();
  }
}

export async function pollYearlyHistory(): Promise<void> {
  const { year } = todayParts();
  const data = await solarmanApi.getYearlyHistory(year);

  for (const rec of data.records) {
    db.insert(schema.yearlyRecords).values({
      year: rec.year,
      month: rec.month,
      generationValue: rec.generationValue,
      useValue: rec.useValue,
      gridValue: rec.gridValue,
      buyValue: rec.buyValue,
      chargeValue: rec.chargeValue,
      dischargeValue: rec.dischargeValue,
      incomeValue: rec.incomeValue,
      fullPowerHoursDay: rec.fullPowerHoursDay,
      generationRatio: rec.generationRatio,
      gridRatio: rec.gridRatio,
      useRatio: rec.useRatio,
      buyRatio: rec.buyRatio,
      selfGenAndUseValue: rec.selfGenAndUseValue,
      selfSufficiencyValue: rec.selfSufficiencyValue,
    }).onConflictDoUpdate({
      target: [schema.yearlyRecords.year, schema.yearlyRecords.month],
      set: {
        generationValue: rec.generationValue,
        useValue: rec.useValue,
        gridValue: rec.gridValue,
        buyValue: rec.buyValue,
        chargeValue: rec.chargeValue,
        dischargeValue: rec.dischargeValue,
        incomeValue: rec.incomeValue,
        fullPowerHoursDay: rec.fullPowerHoursDay,
        generationRatio: rec.generationRatio,
        gridRatio: rec.gridRatio,
        useRatio: rec.useRatio,
        buyRatio: rec.buyRatio,
        selfGenAndUseValue: rec.selfGenAndUseValue,
        selfSufficiencyValue: rec.selfSufficiencyValue,
      },
    }).run();
  }
}

export async function pollLifetimeHistory(): Promise<void> {
  const data = await solarmanApi.getLifetimeHistory();

  for (const rec of data.records) {
    db.insert(schema.lifetimeRecords).values({
      year: rec.year,
      generationValue: rec.generationValue,
      useValue: rec.useValue,
      gridValue: rec.gridValue,
      buyValue: rec.buyValue,
      chargeValue: rec.chargeValue,
      dischargeValue: rec.dischargeValue,
      incomeValue: rec.incomeValue,
      fullPowerHoursDay: rec.fullPowerHoursDay,
      operatingTotalDays: data.operatingTotalDays ?? null,
    }).onConflictDoUpdate({
      target: schema.lifetimeRecords.year,
      set: {
        generationValue: rec.generationValue,
        useValue: rec.useValue,
        gridValue: rec.gridValue,
        buyValue: rec.buyValue,
        chargeValue: rec.chargeValue,
        dischargeValue: rec.dischargeValue,
        incomeValue: rec.incomeValue,
        fullPowerHoursDay: rec.fullPowerHoursDay,
        operatingTotalDays: data.operatingTotalDays ?? null,
      },
    }).run();
  }
}

/** Fetch a single day's daily history (reusable for backfill and regular polling) */
async function fetchDailyForDate(date: string): Promise<void> {
  const [y, m, d] = date.split('-').map(Number);
  const data = await solarmanApi.getDailyHistory(y, m, d);

  if (data.statistics) {
    db.insert(schema.dailyStatistics).values({
      date,
      generationValue: data.statistics.generationValue,
      useValue: data.statistics.useValue,
      gridValue: data.statistics.gridValue,
      buyValue: data.statistics.buyValue,
      chargeValue: data.statistics.chargeValue,
      dischargeValue: data.statistics.dischargeValue,
      incomeValue: data.statistics.incomeValue,
      fullPowerHoursDay: data.statistics.fullPowerHoursDay,
      genForCharge: data.statistics.genForCharge,
      genForUse: data.statistics.genForUse,
      genForGrid: data.statistics.genForGrid,
      useFromDischarge: data.statistics.useFromDischarge,
      useFromGen: data.statistics.useFromGen,
      useFromBuy: data.statistics.useFromBuy,
    }).onConflictDoUpdate({
      target: schema.dailyStatistics.date,
      set: {
        generationValue: data.statistics.generationValue,
        useValue: data.statistics.useValue,
        gridValue: data.statistics.gridValue,
        buyValue: data.statistics.buyValue,
        chargeValue: data.statistics.chargeValue,
        dischargeValue: data.statistics.dischargeValue,
        incomeValue: data.statistics.incomeValue,
        fullPowerHoursDay: data.statistics.fullPowerHoursDay,
        genForCharge: data.statistics.genForCharge,
        genForUse: data.statistics.genForUse,
        genForGrid: data.statistics.genForGrid,
        useFromDischarge: data.statistics.useFromDischarge,
        useFromGen: data.statistics.useFromGen,
        useFromBuy: data.statistics.useFromBuy,
      },
    }).run();
  }

  for (const rec of data.records) {
    db.insert(schema.dailyRecords).values({
      date,
      timestamp: rec.dateTime,
      generationPower: rec.generationPower,
      usePower: rec.usePower,
      gridPower: rec.gridPower,
      buyPower: rec.buyPower,
      wirePower: rec.wirePower,
      chargePower: rec.chargePower,
      dischargePower: rec.dischargePower,
      batteryPower: rec.batteryPower,
      batterySoc: rec.batterySoc,
      wireStatus: rec.wireStatus,
      batteryStatus: rec.batteryStatus,
      generationCapacity: rec.generationCapacity,
    }).onConflictDoUpdate({
      target: [schema.dailyRecords.date, schema.dailyRecords.timestamp],
      set: {
        generationPower: rec.generationPower,
        usePower: rec.usePower,
        gridPower: rec.gridPower,
        buyPower: rec.buyPower,
        wirePower: rec.wirePower,
        chargePower: rec.chargePower,
        dischargePower: rec.dischargePower,
        batteryPower: rec.batteryPower,
        batterySoc: rec.batterySoc,
        wireStatus: rec.wireStatus,
        batteryStatus: rec.batteryStatus,
        generationCapacity: rec.generationCapacity,
      },
    }).run();
  }
}

/** Backfill last 60 days of all historical data */
export async function backfillHistory(): Promise<void> {
  console.log('[history] Starting backfill...');
  const today = new Date();

  // 1. Backfill daily history (60 days of 5-min curve data)
  for (let i = 0; i < BACKFILL_DAYS; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const date = dateStr(d.getFullYear(), d.getMonth() + 1, d.getDate());

    // Skip completed past days (always re-fetch today)
    if (i > 0 && hasDailyData(date)) continue;

    try {
      console.log(`[history] Daily ${date} (${i + 1}/${BACKFILL_DAYS})...`);
      await fetchDailyForDate(date);
      await sleep(500);
    } catch (err: any) {
      console.error(`[history] Daily ${date} failed: ${err.message}`);
    }
  }

  // 2. Backfill monthly history (covers all months in the 60-day window)
  const monthsSeen = new Set<string>();
  for (let i = 0; i < BACKFILL_DAYS; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const key = `${year}-${month}`;
    if (monthsSeen.has(key)) continue;
    monthsSeen.add(key);

    if (hasMonthlyData(year, month)) continue;

    try {
      console.log(`[history] Monthly ${year}-${String(month).padStart(2, '0')}...`);
      await pollMonthlyHistory_forDate(year, month);
      await sleep(500);
    } catch (err: any) {
      console.error(`[history] Monthly ${year}-${month} failed: ${err.message}`);
    }
  }

  // 3. Backfill yearly history (covers all years in the 60-day window)
  const yearsSeen = new Set<number>();
  for (let i = 0; i < BACKFILL_DAYS; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const year = d.getFullYear();
    if (yearsSeen.has(year)) continue;
    yearsSeen.add(year);

    if (hasYearlyData(year)) continue;

    try {
      console.log(`[history] Yearly ${year}...`);
      await pollYearlyHistory_forDate(year);
      await sleep(500);
    } catch (err: any) {
      console.error(`[history] Yearly ${year} failed: ${err.message}`);
    }
  }

  // 4. Lifetime (always fetch)
  try {
    console.log('[history] Lifetime...');
    await pollLifetimeHistory();
  } catch (err: any) {
    console.error(`[history] Lifetime failed: ${err.message}`);
  }

  console.log('[history] Backfill complete');
}

/** Poll current period historical data (called every 6 hours) */
export async function pollCurrentHistory(): Promise<void> {
  const { year, month, day } = todayParts();
  const date = dateStr(year, month, day);

  await fetchDailyForDate(date);
  await pollMonthlyHistory_forDate(year, month);
  await pollYearlyHistory_forDate(year);
  await pollLifetimeHistory();
}

/** Reusable: fetch monthly history for a specific year/month */
async function pollMonthlyHistory_forDate(year: number, month: number): Promise<void> {
  const data = await solarmanApi.getMonthlyHistory(year, month);
  for (const rec of data.records) {
    db.insert(schema.monthlyRecords).values({
      year: rec.year, month: rec.month, day: rec.day,
      generationValue: rec.generationValue, useValue: rec.useValue,
      gridValue: rec.gridValue, buyValue: rec.buyValue,
      chargeValue: rec.chargeValue, dischargeValue: rec.dischargeValue,
      incomeValue: rec.incomeValue, fullPowerHoursDay: rec.fullPowerHoursDay,
      generationRatio: rec.generationRatio, gridRatio: rec.gridRatio,
      useRatio: rec.useRatio, buyRatio: rec.buyRatio,
      selfGenAndUseValue: rec.selfGenAndUseValue,
      selfSufficiencyValue: rec.selfSufficiencyValue,
    }).onConflictDoUpdate({
      target: [schema.monthlyRecords.year, schema.monthlyRecords.month, schema.monthlyRecords.day],
      set: {
        generationValue: rec.generationValue, useValue: rec.useValue,
        gridValue: rec.gridValue, buyValue: rec.buyValue,
        chargeValue: rec.chargeValue, dischargeValue: rec.dischargeValue,
        incomeValue: rec.incomeValue, fullPowerHoursDay: rec.fullPowerHoursDay,
        generationRatio: rec.generationRatio, gridRatio: rec.gridRatio,
        useRatio: rec.useRatio, buyRatio: rec.buyRatio,
        selfGenAndUseValue: rec.selfGenAndUseValue,
        selfSufficiencyValue: rec.selfSufficiencyValue,
      },
    }).run();
  }
}

/** Reusable: fetch yearly history for a specific year */
async function pollYearlyHistory_forDate(year: number): Promise<void> {
  const data = await solarmanApi.getYearlyHistory(year);
  for (const rec of data.records) {
    db.insert(schema.yearlyRecords).values({
      year: rec.year, month: rec.month,
      generationValue: rec.generationValue, useValue: rec.useValue,
      gridValue: rec.gridValue, buyValue: rec.buyValue,
      chargeValue: rec.chargeValue, dischargeValue: rec.dischargeValue,
      incomeValue: rec.incomeValue, fullPowerHoursDay: rec.fullPowerHoursDay,
      generationRatio: rec.generationRatio, gridRatio: rec.gridRatio,
      useRatio: rec.useRatio, buyRatio: rec.buyRatio,
      selfGenAndUseValue: rec.selfGenAndUseValue,
      selfSufficiencyValue: rec.selfSufficiencyValue,
    }).onConflictDoUpdate({
      target: [schema.yearlyRecords.year, schema.yearlyRecords.month],
      set: {
        generationValue: rec.generationValue, useValue: rec.useValue,
        gridValue: rec.gridValue, buyValue: rec.buyValue,
        chargeValue: rec.chargeValue, dischargeValue: rec.dischargeValue,
        incomeValue: rec.incomeValue, fullPowerHoursDay: rec.fullPowerHoursDay,
        generationRatio: rec.generationRatio, gridRatio: rec.gridRatio,
        useRatio: rec.useRatio, buyRatio: rec.buyRatio,
        selfGenAndUseValue: rec.selfGenAndUseValue,
        selfSufficiencyValue: rec.selfSufficiencyValue,
      },
    }).run();
  }
}
