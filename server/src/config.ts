import 'dotenv/config';

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  solarman: {
    baseUrl: process.env.SOLARMAN_BASE_URL || 'https://indiahome.solarmanpv.com',
    accessToken: process.env.SOLARMAN_ACCESS_TOKEN || '',
    stationId: parseInt(process.env.STATION_ID || '0', 10),
    deviceId: parseInt(process.env.DEVICE_ID || '0', 10),
    productId: process.env.PRODUCT_ID || '',
    regionNationId: parseInt(process.env.REGION_NATION_ID || '0', 10),
    regionLevel1: parseInt(process.env.REGION_LEVEL1 || '0', 10),
    regionLevel2: parseInt(process.env.REGION_LEVEL2 || '0', 10),
  },
} as const;
