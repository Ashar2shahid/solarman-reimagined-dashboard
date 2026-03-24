// Flow chart / fast system response
export interface FlowChartResponse {
  systemId: number;
  generationPower: number | null;
  usePower: number | null;
  wirePower: number | null;
  buyPower: number | null;
  gridPower: number | null;
  batteryPower: number | null;
  chargePower: number | null;
  dischargePower: number | null;
  batterySoc: number | null;
  genStatus: string | null;
  wireStatus: string | null;
  batteryStatus: string | null;
  generationValue: number | null;
  useValue: number | null;
  gridValue: number | null;
  buyValue: number | null;
  chargeValue: number | null;
  dischargeValue: number | null;
  fullPowerHoursDay: number | null;
  networkStatus: string | null;
  lastUpdateTime: number;
  generationCapacity: number | null;
  generationUploadTotalOffset: number | null;
  useUploadTotal: number | null;
  gridUploadTotal: number | null;
  buyUploadTotal: number | null;
}

// Station information response
export interface StationInfoResponse {
  id: number;
  name: string;
  installedCapacity: number;
  batterySoc: number | null;
  generationPower: number | null;
  usePower: number | null;
  buyPower: number | null;
  generationValue: number | null;
  useValue: number | null;
  gridValue: number | null;
  buyValue: number | null;
  generationMonth: number | null;
  useMonth: number | null;
  gridMonth: number | null;
  buyMonth: number | null;
  generationYear: number | null;
  useYear: number | null;
  gridYear: number | null;
  buyYear: number | null;
  generationTotal: number | null;
  fullPowerHoursDay: number | null;
  networkStatus: string | null;
  locationAddress: string | null;
  locationLat: number | null;
  locationLng: number | null;
  regionTimezone: string | null;
  lastUpdateTime: number;
}

// Daily history record (5-min interval)
export interface DailyRecord {
  systemId: number;
  dateTime: number;
  generationPower: number | null;
  usePower: number | null;
  gridPower: number | null;
  buyPower: number | null;
  wirePower: number | null;
  chargePower: number | null;
  dischargePower: number | null;
  batteryPower: number | null;
  batterySoc: number | null;
  wireStatus: string | null;
  batteryStatus: string | null;
  generationCapacity: number | null;
  timeZoneOffset: number;
}

// Daily statistics summary
export interface DailyStats {
  generationValue: number | null;
  useValue: number | null;
  gridValue: number | null;
  buyValue: number | null;
  chargeValue: number | null;
  dischargeValue: number | null;
  incomeValue: number | null;
  fullPowerHoursDay: number | null;
  genForCharge: number | null;
  genForUse: number | null;
  genForGrid: number | null;
  useFromDischarge: number | null;
  useFromGen: number | null;
  useFromBuy: number | null;
}

// Daily history response
export interface DailyHistoryResponse {
  statistics: DailyStats;
  records: DailyRecord[];
}

// Monthly/yearly record (per-day or per-month)
export interface PeriodRecord {
  year: number;
  month: number;
  day: number;
  generationValue: number | null;
  useValue: number | null;
  gridValue: number | null;
  buyValue: number | null;
  chargeValue: number | null;
  dischargeValue: number | null;
  incomeValue: number | null;
  fullPowerHoursDay: number | null;
  generationRatio: number | null;
  gridRatio: number | null;
  useRatio: number | null;
  buyRatio: number | null;
  selfGenAndUseValue: number | null;
  selfSufficiencyValue: number | null;
}

export interface PeriodHistoryResponse {
  statistics: PeriodRecord;
  records: PeriodRecord[];
  operatingTotalDays?: number;
}

// Device detail
export interface DeviceField {
  key: string;
  value: string;
  storageName: string;
  unit: string | null;
  orgValue: string;
}

export interface DeviceCategory {
  name: string;
  tag: string;
  categoryId: string;
  fieldList: DeviceField[];
}

export interface DeviceDetailResponse {
  deviceId: number;
  deviceSn: string;
  siteId: number;
  type: string;
  connectStatus: number;
  collectionTime: number;
  paramCategoryList: DeviceCategory[];
}

// Weather
export interface WeatherItem {
  datetime: number;
  weatherCode: string;
  weatherPic: string;
  temp: number;
  tempMin: number;
  tempMax: number;
  humidity: number;
  pressure: number;
  windSpeed: number;
  windDeg: number;
  clouds: number;
  sunrise: number;
  sunset: number;
  sunshineDuration: number;
}

export interface WeatherResponse {
  regionName: string;
  weatherList: WeatherItem[];
}

// Energy saved
export interface EnergySavedResponse {
  systemId: number;
  generationValueTotal: number;
  standardCoalSaved: number;
  emissionReductionCO2: number;
  treesPlanted: number;
  incomeTotal: number;
}

// Alert
export interface AlertItem {
  alertName: string;
  deviceName: string;
  deviceSn: string;
  level: string;
  influence: string;
  alertTime: number;
}

export interface AlertSearchResponse {
  total: number;
  data: AlertItem[];
}

// Device chartable parameter definition
export interface DeviceParam {
  storageName: string;
  name: string;
  unit: string | null;
}

// Device history chart data point
export interface DeviceChartDataPoint {
  collectionTime: number;
  value: string;
}

// Device history chart series (one per requested param)
export interface DeviceChartSeries {
  storageName: string;
  name: string;
  unit: string;
  detailList: DeviceChartDataPoint[];
}

// System stats (operating/system)
export interface SystemStatsResponse {
  systemId: number;
  selfGenAndUseValue: number | null;
  selfSufficiencyValue: number | null;
  generationRatio: number | null;
  gridRatio: number | null;
  useRatio: number | null;
  buyRatio: number | null;
  chargeRatio: number | null;
  useDischargeRatio: number | null;
  gridRatioMonth: number | null;
  useRatioMonth: number | null;
  buyRatioMonth: number | null;
  generationRatioMonth: number | null;
  gridRatioYear: number | null;
  useRatioYear: number | null;
  buyRatioYear: number | null;
  generationRatioYear: number | null;
  chargeTotal: number | null;
  dischargeTotal: number | null;
  incomeTotal: number | null;
  chargeMonth: number | null;
  dischargeMonth: number | null;
  chargeYear: number | null;
  dischargeYear: number | null;
  lastUpdateTime: number;
}
