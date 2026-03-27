const BASE = '/api';

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

async function post<T>(path: string, body: object): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

// Realtime
export const api = {
  realtime: {
    current: () => get<RealtimeSnapshot>('/realtime/current'),
    history: (minutes = 60) => get<RealtimeSnapshot[]>(`/realtime/history?minutes=${minutes}`),
  },
  station: () => get<StationInfo>('/station'),
  systemStats: () => get<SystemStats>('/system-stats'),
  energySaved: () => get<EnergySaved>('/energy-saved'),
  history: {
    daily: (date: string) => get<DailyHistory>(`/history/daily?date=${date}`),
    monthly: (year: number, month: number) => get<{ records: PeriodRecord[] }>(`/history/monthly?year=${year}&month=${month}`),
    yearly: (year: number) => get<{ records: PeriodRecord[] }>(`/history/yearly?year=${year}`),
    lifetime: () => get<{ records: PeriodRecord[] }>('/history/lifetime'),
  },
  device: {
    current: () => get<DeviceCurrent>('/device/current'),
    params: () => get<DeviceParam[]>('/device/params'),
    chart: (date: string, params: string) => get<DeviceChartSeries[]>(`/device/chart?date=${date}&params=${params}`),
    chartDates: () => get<string[]>('/device/chart/dates'),
  },
  weather: () => get<WeatherDay[]>('/weather'),
  alerts: {
    list: () => get<Alert[]>('/alerts'),
    count: () => get<{ count: number }>('/alerts/count'),
  },
  status: () => get<ServerStatus>('/status'),
  settings: {
    get: () => get<Record<string, string>>('/settings'),
    update: (settings: Record<string, string>) => post<{ ok: boolean; settings: Record<string, string> }>('/settings', settings),
  },
  notifications: {
    list: () => get<Notification[]>('/notifications'),
    unread: () => get<{ count: number }>('/notifications/unread'),
    markRead: (id: number) => post<{ ok: boolean }>(`/notifications/${id}/read`, {}),
    markAllRead: () => post<{ ok: boolean }>('/notifications/read-all', {}),
  },
  ac: {
    state: () => get<ACState>('/ac/state'),
    power: (on: boolean) => post<ACResponse>('/ac/power', { on }),
    temp: (temp: number) => post<ACResponse>('/ac/temp', { temp }),
    mode: (mode: number) => post<ACResponse>('/ac/mode', { mode }),
    fan: (fan: number) => post<ACResponse>('/ac/fan', { fan }),
    events: (date: string) => get<ACEvent[]>(`/ac/events?date=${date}`),
  },
};

// Types
export interface RealtimeSnapshot {
  id: number;
  timestamp: number;
  polledAt: number;
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
}

export interface StationInfo {
  stationId: number;
  name: string | null;
  installedCapacity: number | null;
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
  updatedAt: number | null;
}

export interface SystemStats {
  stationId: number;
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
  chargeTotal: number | null;
  dischargeTotal: number | null;
  incomeTotal: number | null;
  updatedAt: number | null;
}

export interface EnergySaved {
  stationId: number;
  generationTotal: number | null;
  coalSaved: number | null;
  co2Reduced: number | null;
  treesPlanted: number | null;
  incomeTotal: number | null;
}

export interface DailyStatistics {
  date: string;
  generationValue: number | null;
  useValue: number | null;
  gridValue: number | null;
  buyValue: number | null;
  chargeValue: number | null;
  dischargeValue: number | null;
  incomeValue: number | null;
  fullPowerHoursDay: number | null;
}

export interface DailyRecord {
  date: string;
  timestamp: number;
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
}

export interface DailyHistory {
  statistics: DailyStatistics | null;
  records: DailyRecord[];
}

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
}

export interface DeviceParam {
  storageName: string;
  name: string;
  unit: string | null;
}

export interface DeviceChartSeries {
  storageName: string;
  name: string;
  unit: string;
  detailList: { collectionTime: number; value: string }[];
}

export interface DeviceCurrent {
  deviceId: number;
  polledAt: number;
  collectionTime: number | null;
  connectStatus: number | null;
  data: Record<string, { value: string; unit: string | null; name: string }>;
}

export interface WeatherDay {
  date: string;
  regionName: string | null;
  weatherCode: string | null;
  weatherPic: string | null;
  temp: number | null;
  tempMin: number | null;
  tempMax: number | null;
  humidity: number | null;
  windSpeed: number | null;
  sunrise: number | null;
  sunset: number | null;
}

export interface Alert {
  id: number;
  alertName: string | null;
  deviceName: string | null;
  deviceSn: string | null;
  level: string | null;
  influence: string | null;
  alertTime: number | null;
}

export interface ServerStatus {
  uptime: number;
  timestamp: number;
  pollers: Record<string, { lastSuccess: number | null; lastError: string | null; runs: number }>;
}

export interface ACState {
  power: boolean;
  temp: number;
  mode: number;
  fan: number;
}

export interface ACResponse {
  ok: boolean;
  state: ACState;
}

export interface ACEvent {
  id: number;
  timestamp: number;
  action: string;
  temp: number | null;
}

export interface Notification {
  id: number;
  timestamp: number;
  type: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  value: number | null;
  read: boolean;
}
