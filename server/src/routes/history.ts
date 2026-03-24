import { Router } from 'express';
import { db, schema } from '../db/index.js';
import { eq, and } from 'drizzle-orm';
import { solarmanApi } from '../services/solarman-api.js';

const router = Router();

// Daily 24hr curve (5-min intervals)
router.get('/daily', async (req, res) => {
  const date = req.query.date as string; // YYYY-MM-DD
  if (!date) return res.status(400).json({ error: 'date parameter required (YYYY-MM-DD)' });

  // Check if we have records for this date
  let records = db.select().from(schema.dailyRecords)
    .where(eq(schema.dailyRecords.date, date))
    .orderBy(schema.dailyRecords.timestamp)
    .all();

  const stats = db.select().from(schema.dailyStatistics)
    .where(eq(schema.dailyStatistics.date, date))
    .get();

  // On-demand backfill if no data
  if (records.length === 0) {
    try {
      const [y, m, d] = date.split('-').map(Number);
      const data = await solarmanApi.getDailyHistory(y, m, d);

      // Store statistics
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
        }).onConflictDoNothing().run();
      }

      // Store records
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
        }).onConflictDoNothing().run();
      }

      records = db.select().from(schema.dailyRecords)
        .where(eq(schema.dailyRecords.date, date))
        .orderBy(schema.dailyRecords.timestamp)
        .all();

      const freshStats = db.select().from(schema.dailyStatistics)
        .where(eq(schema.dailyStatistics.date, date))
        .get();

      return res.json({ statistics: freshStats, records });
    } catch (err: any) {
      return res.json({ statistics: null, records: [], error: err.message });
    }
  }

  res.json({ statistics: stats, records });
});

// Monthly per-day records
router.get('/monthly', async (req, res) => {
  const year = parseInt(req.query.year as string);
  const month = parseInt(req.query.month as string);
  if (!year || !month) return res.status(400).json({ error: 'year and month parameters required' });

  let records = db.select().from(schema.monthlyRecords)
    .where(and(eq(schema.monthlyRecords.year, year), eq(schema.monthlyRecords.month, month)))
    .orderBy(schema.monthlyRecords.day)
    .all();

  // On-demand backfill
  if (records.length === 0) {
    try {
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
        }).onConflictDoNothing().run();
      }
      records = db.select().from(schema.monthlyRecords)
        .where(and(eq(schema.monthlyRecords.year, year), eq(schema.monthlyRecords.month, month)))
        .orderBy(schema.monthlyRecords.day)
        .all();
    } catch (err: any) {
      return res.json({ records: [], error: err.message });
    }
  }

  res.json({ records });
});

// Yearly per-month records
router.get('/yearly', async (req, res) => {
  const year = parseInt(req.query.year as string);
  if (!year) return res.status(400).json({ error: 'year parameter required' });

  let records = db.select().from(schema.yearlyRecords)
    .where(eq(schema.yearlyRecords.year, year))
    .orderBy(schema.yearlyRecords.month)
    .all();

  if (records.length === 0) {
    try {
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
        }).onConflictDoNothing().run();
      }
      records = db.select().from(schema.yearlyRecords)
        .where(eq(schema.yearlyRecords.year, year))
        .orderBy(schema.yearlyRecords.month)
        .all();
    } catch (err: any) {
      return res.json({ records: [], error: err.message });
    }
  }

  res.json({ records });
});

// Lifetime per-year records
router.get('/lifetime', (_req, res) => {
  const records = db.select().from(schema.lifetimeRecords)
    .orderBy(schema.lifetimeRecords.year)
    .all();
  res.json({ records });
});

export default router;
