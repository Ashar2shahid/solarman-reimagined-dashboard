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
  tuya: {
    accessId: process.env.TUYA_ACCESS_ID || '',
    accessSecret: process.env.TUYA_ACCESS_SECRET || '',
    projectCode: process.env.TUYA_PROJECT_CODE || '',
    acDeviceId: process.env.TUYA_AC_DEVICE_ID || '',
    irDeviceId: process.env.TUYA_IR_DEVICE_ID || '',
  },
} as const;
