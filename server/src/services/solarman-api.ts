import axios, { type AxiosInstance } from 'axios';
import { config } from '../config.js';
import type {
  FlowChartResponse,
  StationInfoResponse,
  DailyHistoryResponse,
  PeriodHistoryResponse,
  DeviceDetailResponse,
  DeviceParam,
  DeviceChartSeries,
  WeatherResponse,
  EnergySavedResponse,
  AlertSearchResponse,
  SystemStatsResponse,
} from '../types/solarman.js';

class SolarmanApi {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: config.solarman.baseUrl,
      headers: {
        'Authorization': `Bearer ${config.solarman.accessToken}`,
        'Content-Type': 'application/json',
      },
      timeout: 15000,
    });
  }

  async getFlowChart(): Promise<FlowChartResponse> {
    const { data } = await this.client.get(
      `/maintain-s/fast/system/${config.solarman.stationId}`
    );
    return data;
  }

  async getStationInfo(): Promise<StationInfoResponse> {
    const { data } = await this.client.get(
      `/maintain-s/operating/station/information/${config.solarman.stationId}?language=en`
    );
    return data;
  }

  async getSystemStats(): Promise<SystemStatsResponse> {
    const { data } = await this.client.get(
      `/maintain-s/operating/system/${config.solarman.stationId}`
    );
    return data;
  }

  async getDailyHistory(year: number, month: number, day: number): Promise<DailyHistoryResponse> {
    const { data } = await this.client.get(
      `/maintain-s/history/batteryPower/${config.solarman.stationId}/stats/daily`,
      { params: { year, month, day } }
    );
    return data;
  }

  async getMonthlyHistory(year: number, month: number): Promise<PeriodHistoryResponse> {
    const { data } = await this.client.get(
      `/maintain-s/history/batteryPower/${config.solarman.stationId}/stats/month`,
      { params: { year, month } }
    );
    return data;
  }

  async getYearlyHistory(year: number): Promise<PeriodHistoryResponse> {
    const { data } = await this.client.get(
      `/maintain-s/history/batteryPower/${config.solarman.stationId}/stats/year`,
      { params: { year } }
    );
    return data;
  }

  async getLifetimeHistory(): Promise<PeriodHistoryResponse> {
    const { data } = await this.client.get(
      `/maintain-s/history/batteryPower/${config.solarman.stationId}/stats/total`
    );
    return data;
  }

  async getDeviceDetail(): Promise<DeviceDetailResponse> {
    const { data } = await this.client.post('/device-s/device/v3/detail', {
      deviceId: config.solarman.deviceId,
      language: 'en',
      needRealTimeDataFlag: true,
      siteId: config.solarman.stationId,
    });
    return data;
  }

  async getWeather(): Promise<WeatherResponse> {
    const { data } = await this.client.get('/region-s/weather/searchForecast', {
      params: {
        regionNationId: config.solarman.regionNationId,
        regionLevel1: config.solarman.regionLevel1,
        regionLevel2: config.solarman.regionLevel2,
        lan: 'en',
      },
    });
    return data;
  }

  async getEnergySaved(): Promise<EnergySavedResponse> {
    const { data } = await this.client.post(
      '/maintain-s/operating/station/generation/energy-saved',
      { systemId: config.solarman.stationId }
    );
    return data;
  }

  async getAlerts(page = 1, size = 20): Promise<AlertSearchResponse> {
    const { data } = await this.client.post(
      `/maintain-s/operating/alert/search?order.direction=DESC&order.property=alertTime&page=${page}&size=${size}&total=0`,
      {
        deviceType: '',
        language: 'en',
        level: '',
        startTime: '',
        levelList: null,
        plantId: config.solarman.stationId,
      }
    );
    return data;
  }

  async getAlertCount(): Promise<number> {
    const { data } = await this.client.get(
      '/message-s/message/unreaded/total?msgTypes=ALERT'
    );
    return data;
  }

  async getDeviceParams(): Promise<DeviceParam[]> {
    const { data } = await this.client.get('/device-s/device/params', {
      params: {
        productId: config.solarman.productId,
        lan: 'en',
        queryType: 1,
        deviceId: config.solarman.deviceId,
      },
    });
    return data;
  }

  async getDeviceChart(
    period: 'day' | 'week' | 'month' | 'year' | 'total',
    showParams: string[],
    dateParam?: string,
  ): Promise<DeviceChartSeries[]> {
    const params: Record<string, string> = { lan: 'en' };
    // Build the date param based on period
    if (period === 'day' && dateParam) params.day = dateParam;       // YYYY-MM-DD
    if (period === 'week' && dateParam) params.day = dateParam;      // YYYY-MM-DD
    if (period === 'month' && dateParam) params.month = dateParam;   // YYYY-MM
    if (period === 'year' && dateParam) params.year = dateParam;     // YYYY

    const { data } = await this.client.get(
      `/device-s/device/${config.solarman.deviceId}/stats/${period}`,
      {
        params: { ...params, showParams },
        paramsSerializer: {
          indexes: null, // showParams=DV1&showParams=DV2 format
        },
      },
    );
    return data;
  }
}

export const solarmanApi = new SolarmanApi();
