import { db, schema } from '../../db/index.js';
import { solarmanApi } from '../solarman-api.js';
import { config } from '../../config.js';

export async function pollWeather(): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  const data = await solarmanApi.getWeather();

  for (const item of data.weatherList) {
    const date = new Date(item.datetime * 1000).toISOString().split('T')[0];
    db.insert(schema.weatherForecast).values({
      fetchedAt: now,
      date,
      regionName: data.regionName,
      weatherCode: item.weatherCode,
      weatherPic: item.weatherPic,
      temp: item.temp,
      tempMin: item.tempMin,
      tempMax: item.tempMax,
      humidity: item.humidity,
      pressure: item.pressure,
      windSpeed: item.windSpeed,
      windDeg: item.windDeg,
      clouds: item.clouds,
      sunrise: item.sunrise,
      sunset: item.sunset,
      sunshineDuration: item.sunshineDuration,
    }).onConflictDoUpdate({
      target: [schema.weatherForecast.date],
      set: {
        fetchedAt: now,
        regionName: data.regionName,
        weatherCode: item.weatherCode,
        weatherPic: item.weatherPic,
        temp: item.temp,
        tempMin: item.tempMin,
        tempMax: item.tempMax,
        humidity: item.humidity,
        pressure: item.pressure,
        windSpeed: item.windSpeed,
        windDeg: item.windDeg,
        clouds: item.clouds,
        sunrise: item.sunrise,
        sunset: item.sunset,
        sunshineDuration: item.sunshineDuration,
      },
    }).run();
  }
}

export async function pollEnergySaved(): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  const data = await solarmanApi.getEnergySaved();

  db.insert(schema.energySaved).values({
    stationId: config.solarman.stationId,
    generationTotal: data.generationValueTotal,
    coalSaved: data.standardCoalSaved,
    co2Reduced: data.emissionReductionCO2,
    treesPlanted: data.treesPlanted,
    incomeTotal: data.incomeTotal,
    updatedAt: now,
  }).onConflictDoUpdate({
    target: schema.energySaved.stationId,
    set: {
      generationTotal: data.generationValueTotal,
      coalSaved: data.standardCoalSaved,
      co2Reduced: data.emissionReductionCO2,
      treesPlanted: data.treesPlanted,
      incomeTotal: data.incomeTotal,
      updatedAt: now,
    },
  }).run();
}

export async function pollAlerts(): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  const data = await solarmanApi.getAlerts();

  // Clear and re-insert alerts
  db.delete(schema.alerts).run();
  for (const item of (data.data ?? [])) {
    db.insert(schema.alerts).values({
      alertName: item.alertName,
      deviceName: item.deviceName,
      deviceSn: item.deviceSn,
      level: item.level,
      influence: item.influence,
      alertTime: item.alertTime,
      fetchedAt: now,
    }).run();
  }
}

export async function pollSystemStats(): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  const data = await solarmanApi.getSystemStats();

  db.insert(schema.systemStats).values({
    stationId: config.solarman.stationId,
    selfGenAndUseValue: data.selfGenAndUseValue,
    selfSufficiencyValue: data.selfSufficiencyValue,
    generationRatio: data.generationRatio,
    gridRatio: data.gridRatio,
    useRatio: data.useRatio,
    buyRatio: data.buyRatio,
    chargeRatio: data.chargeRatio,
    useDischargeRatio: data.useDischargeRatio,
    gridRatioMonth: data.gridRatioMonth,
    useRatioMonth: data.useRatioMonth,
    buyRatioMonth: data.buyRatioMonth,
    generationRatioMonth: data.generationRatioMonth,
    gridRatioYear: data.gridRatioYear,
    useRatioYear: data.useRatioYear,
    buyRatioYear: data.buyRatioYear,
    generationRatioYear: data.generationRatioYear,
    chargeTotal: data.chargeTotal,
    dischargeTotal: data.dischargeTotal,
    incomeTotal: data.incomeTotal,
    chargeMonth: data.chargeMonth,
    dischargeMonth: data.dischargeMonth,
    chargeYear: data.chargeYear,
    dischargeYear: data.dischargeYear,
    updatedAt: now,
  }).onConflictDoUpdate({
    target: schema.systemStats.stationId,
    set: {
      selfGenAndUseValue: data.selfGenAndUseValue,
      selfSufficiencyValue: data.selfSufficiencyValue,
      generationRatio: data.generationRatio,
      gridRatio: data.gridRatio,
      useRatio: data.useRatio,
      buyRatio: data.buyRatio,
      chargeRatio: data.chargeRatio,
      useDischargeRatio: data.useDischargeRatio,
      gridRatioMonth: data.gridRatioMonth,
      useRatioMonth: data.useRatioMonth,
      buyRatioMonth: data.buyRatioMonth,
      generationRatioMonth: data.generationRatioMonth,
      gridRatioYear: data.gridRatioYear,
      useRatioYear: data.useRatioYear,
      buyRatioYear: data.buyRatioYear,
      generationRatioYear: data.generationRatioYear,
      chargeTotal: data.chargeTotal,
      dischargeTotal: data.dischargeTotal,
      incomeTotal: data.incomeTotal,
      chargeMonth: data.chargeMonth,
      dischargeMonth: data.dischargeMonth,
      chargeYear: data.chargeYear,
      dischargeYear: data.dischargeYear,
      updatedAt: now,
    },
  }).run();
}
