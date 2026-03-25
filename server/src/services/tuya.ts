import crypto from 'crypto';
import { config } from '../config.js';

const BASE_URL = 'https://openapi.tuyain.com';
const { accessId, accessSecret, acDeviceId, irDeviceId } = config.tuya;

let cachedToken: { access_token: string; expire_time: number } | null = null;

// ── Learned IR codes (cold mode, auto fan) ──
const LEARNED_CODES: Record<string, string> = {
  power_on:  'd40bf225130210061302ef01ef011302ef011302ef011006ef01ef011302ef011302ef011302ef01ef011302ef011302ef011302ef01ef01ef01ef011302ef01ef011302ef011006ef011006ef01ef011302ef011302ef0113021006ef01ef01ef011006ef01ef011302ef01ef011302ef011006ef013075',
  power_off: 'c30bf125fc01fa05fc01fc01fc01fc01fc01fc01fc01fa05fc01fc01fc01fc01fc01fc01fc01fa05fc01fa05fc01fc01fc013202fc01fc01fc01fc01fc01fc01fc01fc01fc01fc01fc01fc01fc013202fc01fc01fc01fc01fa05fc01fc01fc01fa05fc013202fc01fc01fc01fc01fc01fa05fc013075',
  temp_16:   'b20bf225e7011d06e7011a02e7011a02e7011a02e7011d06e7011a02e7011a02e7011a02e7011a02e7011a02e701e7011a02e701e7011d06e7011a02e701e701e7011a02e701e701e7011a02e7011a02e7011d06e701e701e7011d06e7011a02e7011d061a021d06e7011d06e7011d061a02e7011a023075',
  temp_17:   'b30b1126e4010a06e4012102e4012102e4012102e4010a06e4012102e4012102e4012102e4012102e4012102e4012102e401e40121020a06e4012102e4012102e4012102e4012102e401e401e4010a06e4012102e4012102e4010a06e4012102e4010a06e4010a0621020a06e4010a06e4010a06e4013075',
  temp_18:   'd30bf825e3011b06e3012002e3012002e3012002e3011b06e3012002e3012002e3012002e3012002e301e3012002e301e3012002e3011b06e3012002e3012002e3012002e3012002e3012002e3011b06e3011b06e3012002e3011b06e301e30120021b06e3012002e3012002e3012002e301e301e3013075',
  temp_19:   'd30bd8251c021b06e9011c02e9011c02e9011c02e9011b06e9011c02e9011c02e9011c02e9011c02e9011c02e9011c02e901e901e9011b06e9011c02e901e901e9011c02e9011c02e9011b06e9011c02e901e9011c02e901e9011b06e9011c02e9011b06e901e901e9011c02e9011c02e9011b06e9013075',
  temp_20:   'a20b1126e4011e06e4011d02e4011d021d02e401e4011e06e4011d02e4011d02e4011d02e4011d02e4011d02e4011d02e401e401e4011e06e4011d02e4011d02e4011d02e401e401e4011e06e4011d02e4011e06e4011d02e4011e06e4011d02e4011e06e4011d02e4011d02e4011e06e4011d02e4013075',
  temp_21:   'b20b1026e4011606e4012002e4012002e4012002e4011606e4012002e4012002e4012002e4012002e4012002e4012002e401e401e4011606e4012002e4012002e4012002e4012002e4011606e4011606e4012002e4012002e4011606e4012002e4011606e401e4012002e401e4011606e4011606e4013075',
  temp_22:   'd00bec25e601200618021802e601e601e6011802e6012006e6011802e6011802e6011802e6011802e6011802e6011802e6011802e6012006e6011802e6011802e601e60118021802e6012006e6012006e6012006e601e601e6012006e6011802e6012006e6011802e6012006e6011802e6011802e6013075',
  temp_23:   'd10bf225e3012106e3011d02e301e301e3011d02e3012106e3011d02e3011d02e3011d02e3011d02e3011d02e3011d02e3011d02e3012106e3011d02e301e301e3011d02e3012106e3011d02e3011d02e3011d02e3011d02e3012106e3011d02e3012106e3011d02e3012106e3011d02e3012106e3013075',
  temp_24:   'f20bda251e022206e4011e02e4011e02e4011e02e4012206e4011e02e4011e02e4011e02e401e4011e02e401e4011e02e4011e02e4012206e4011e02e401e401e4011e02e4012206e4011e02e401e401e4012206e4011e02e40122061e02e401e4012206e4011e02e4012206e4012206e4011e02e4013075',
  temp_25:   'da0bf925e3011806e3012002e3012002e3012002e3011806e3012002e3012002e3012002e3012002e3012002e301e3012002e301e3011806e3012002e301e3012002e30120021806e3012002e3011806e3012002e3012002e3011806e3012002e3011806e3012002e3011806e3011806e3011806e3013075',
  temp_26:   'b80bed25ea010806ea011b02ea011b02ea011b02ea010806ea01ea01ea011b02ea011b02ea011b02ea011b02ea011b02ea01ea01ea010806ea011b02ea011b02ea011b02ea010806ea011b02ea0108061b0208061b02ea01ea010806ea011b02ea010806ea0108061b02ea01ea011b02ea011b02ea013075',
  temp_27:   'd00bef25e2011206e2011e02e2011e02e2011e02e2011206e2011e02e2011e02e2011e02e2011e02e2011e02e2011e02e201e2011e021206e2011e02e2011e02e2011e02e2011206e20112061e02e2011e02e201e2011e02e2011206e2011e02e2011206e20112061e02e201e2011e02e2011206e2013075',
  temp_28:   'e50bd4251d021406e8011d02e8011d02e8011d02e8011406e8011d02e8011d02e801e801e8011d02e8011d02e8011d02e8011d02e8011406e801e801e8011d021d02e801e8011406e8011406e8011d02e8011406e8011d02e8011406e8011d02e8011406e8011406e801e801e8011406e801e8011d023075',
  temp_29:   'b30b1626e0011706e0012002e0012002e0012002e0011706e00120022002e001e0012002e0012002e0012002e0012002e0012002e0011706e0012002e0012002e0012002e0011706e0011706e00117062002e001e0012002e0011706e0012002e0011706e0011706e0012002e0011706e0011706e0013075',
  temp_30:   'df070f26e6011406e6011f02e601e6011f02e601e60114061f02e601e6011f02e6011f02e6011f02e601e601e6011f02e6011f02e6011406e6011f02e6011f02e601e601e6011406e60114061f021406e6011406e6011f02e6011406e6011f02e6011406e6011406e6011406e6011f02e6011f02e6013075',
};

function sign(method: string, path: string, body: string, token: string, timestamp: string): string {
  const contentHash = crypto.createHash('sha256').update(body).digest('hex');
  const stringToSign = [method, contentHash, '', path].join('\n');
  const signStr = accessId + token + timestamp + stringToSign;
  return crypto.createHmac('sha256', accessSecret).update(signStr).digest('hex').toUpperCase();
}

async function getToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expire_time) {
    return cachedToken.access_token;
  }

  const timestamp = Date.now().toString();
  const path = '/v1.0/token?grant_type=1';
  const signature = sign('GET', path, '', '', timestamp);

  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'GET',
    headers: {
      'client_id': accessId,
      'sign': signature,
      'sign_method': 'HMAC-SHA256',
      't': timestamp,
    },
  });

  const data = await res.json() as { success: boolean; result: { access_token: string; expire_time: number }; msg?: string };
  if (!data.success) throw new Error(`Tuya token error: ${data.msg}`);

  cachedToken = {
    access_token: data.result.access_token,
    expire_time: Date.now() + (data.result.expire_time * 1000) - 60_000,
  };

  console.log('[tuya] Token acquired, expires in', data.result.expire_time, 'seconds');
  return cachedToken.access_token;
}

async function tuyaRequest(method: string, path: string, body?: object): Promise<unknown> {
  const token = await getToken();
  const timestamp = Date.now().toString();
  const bodyStr = body ? JSON.stringify(body) : '';
  const signature = sign(method, path, bodyStr, token, timestamp);

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'client_id': accessId,
      'access_token': token,
      'sign': signature,
      'sign_method': 'HMAC-SHA256',
      't': timestamp,
      'Content-Type': 'application/json',
    },
    body: bodyStr || undefined,
  });

  const data = await res.json() as { success: boolean; result: unknown; msg?: string; code?: number };
  if (!data.success) throw new Error(`Tuya API error: ${data.msg} (code: ${data.code})`);
  return data.result;
}

/** Send a learned IR code */
async function sendLearnedCode(codeKey: string): Promise<unknown> {
  const code = LEARNED_CODES[codeKey];
  if (!code) throw new Error(`Unknown IR code: ${codeKey}`);
  const path = `/v2.0/infrareds/${irDeviceId}/remotes/${acDeviceId}/learning-codes`;
  return tuyaRequest('POST', path, { code });
}

// ── Public API ──

export const tuya = {
  /** Turn AC on (uses last temp setting, defaults to 24°C) */
  powerOn: () => sendLearnedCode('power_on'),

  /** Turn AC off */
  powerOff: () => sendLearnedCode('power_off'),

  /** Set temperature (16-30) — sends power on + temp in cold mode, auto fan */
  setTemp: async (temp: number) => {
    if (temp < 16 || temp > 30) throw new Error('Temperature must be 16-30');
    // Power on first, then set temp after delay
    await sendLearnedCode('power_on');
    await new Promise(r => setTimeout(r, 2000));
    return sendLearnedCode(`temp_${temp}`);
  },

  /** Power on and set temp in one go */
  powerOnWithTemp: async (temp: number) => {
    if (temp < 16 || temp > 30) throw new Error('Temperature must be 16-30');
    await sendLearnedCode('power_on');
    await new Promise(r => setTimeout(r, 2000));
    return sendLearnedCode(`temp_${temp}`);
  },
};
