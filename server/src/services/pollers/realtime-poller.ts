import { db, schema } from '../../db/index.js';
import { solarmanApi } from '../solarman-api.js';
import { config } from '../../config.js';
import { eq } from 'drizzle-orm';

export async function pollRealtime(): Promise<void> {
  const now = Math.floor(Date.now() / 1000);

  const [flowChart, stationInfo] = await Promise.all([
    solarmanApi.getFlowChart(),
    solarmanApi.getStationInfo(),
  ]);

  // Insert realtime snapshot
  db.insert(schema.realtimeSnapshots).values({
    timestamp: flowChart.lastUpdateTime,
    polledAt: now,
    generationPower: flowChart.generationPower,
    usePower: flowChart.usePower,
    wirePower: flowChart.wirePower,
    buyPower: flowChart.buyPower,
    gridPower: flowChart.gridPower,
    batteryPower: flowChart.batteryPower,
    chargePower: flowChart.chargePower,
    dischargePower: flowChart.dischargePower,
    batterySoc: flowChart.batterySoc,
    genStatus: flowChart.genStatus,
    wireStatus: flowChart.wireStatus,
    batteryStatus: flowChart.batteryStatus,
    generationValue: flowChart.generationValue,
    useValue: flowChart.useValue,
    gridValue: flowChart.gridValue,
    buyValue: flowChart.buyValue,
    chargeValue: flowChart.chargeValue,
    dischargeValue: flowChart.dischargeValue,
    fullPowerHoursDay: flowChart.fullPowerHoursDay,
    networkStatus: flowChart.networkStatus,
  }).run();

  // Upsert station info
  db.insert(schema.stationInfo).values({
    stationId: config.solarman.stationId,
    name: stationInfo.name,
    installedCapacity: stationInfo.installedCapacity,
    batterySoc: stationInfo.batterySoc,
    generationPower: stationInfo.generationPower,
    usePower: stationInfo.usePower,
    buyPower: stationInfo.buyPower,
    generationValue: stationInfo.generationValue,
    useValue: stationInfo.useValue,
    gridValue: stationInfo.gridValue,
    buyValue: stationInfo.buyValue,
    generationMonth: stationInfo.generationMonth,
    useMonth: stationInfo.useMonth,
    gridMonth: stationInfo.gridMonth,
    buyMonth: stationInfo.buyMonth,
    generationYear: stationInfo.generationYear,
    useYear: stationInfo.useYear,
    gridYear: stationInfo.gridYear,
    buyYear: stationInfo.buyYear,
    generationTotal: stationInfo.generationTotal,
    fullPowerHoursDay: stationInfo.fullPowerHoursDay,
    networkStatus: stationInfo.networkStatus,
    locationAddress: stationInfo.locationAddress,
    locationLat: stationInfo.locationLat,
    locationLng: stationInfo.locationLng,
    regionTimezone: stationInfo.regionTimezone,
    updatedAt: now,
  }).onConflictDoUpdate({
    target: schema.stationInfo.stationId,
    set: {
      name: stationInfo.name,
      installedCapacity: stationInfo.installedCapacity,
      batterySoc: stationInfo.batterySoc,
      generationPower: stationInfo.generationPower,
      usePower: stationInfo.usePower,
      buyPower: stationInfo.buyPower,
      generationValue: stationInfo.generationValue,
      useValue: stationInfo.useValue,
      gridValue: stationInfo.gridValue,
      buyValue: stationInfo.buyValue,
      generationMonth: stationInfo.generationMonth,
      useMonth: stationInfo.useMonth,
      gridMonth: stationInfo.gridMonth,
      buyMonth: stationInfo.buyMonth,
      generationYear: stationInfo.generationYear,
      useYear: stationInfo.useYear,
      gridYear: stationInfo.gridYear,
      buyYear: stationInfo.buyYear,
      generationTotal: stationInfo.generationTotal,
      fullPowerHoursDay: stationInfo.fullPowerHoursDay,
      networkStatus: stationInfo.networkStatus,
      locationAddress: stationInfo.locationAddress,
      locationLat: stationInfo.locationLat,
      locationLng: stationInfo.locationLng,
      regionTimezone: stationInfo.regionTimezone,
      updatedAt: now,
    },
  }).run();
}
