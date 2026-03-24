import { db, schema } from '../../db/index.js';
import { solarmanApi } from '../solarman-api.js';
import { config } from '../../config.js';

export async function pollDevice(): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  const detail = await solarmanApi.getDeviceDetail();

  // Flatten all param categories into a single key-value map
  const dataMap: Record<string, { value: string; unit: string | null; name: string }> = {};
  for (const category of detail.paramCategoryList) {
    for (const field of category.fieldList) {
      dataMap[field.storageName] = {
        value: field.value,
        unit: field.unit,
        name: field.key,
      };
    }
  }

  db.insert(schema.deviceRealtime).values({
    deviceId: config.solarman.deviceId,
    polledAt: now,
    collectionTime: detail.collectionTime,
    connectStatus: detail.connectStatus,
    dataJson: JSON.stringify(dataMap),
  }).run();
}
