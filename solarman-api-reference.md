# Solarman API Reference — Overview + Device Pages

**Base URL**: `https://indiahome.solarmanpv.com` (region-routed from `home.solarmanpv.com`)
**Auth**: `Authorization: Bearer <access_token>` (JWT, ~60 day expiry)
**Plant ID**: `63402044` ("Al Zahra")
**Token cookie key**: `9ac11337b7141049af7c75b907e61cc5`
**Refresh token cookie key**: `7cf012d25878614523054a695ab82538`

---

## 1. Authentication

### `POST /mdc-eu/oauth2-s/oauth/token`

Login endpoint. Requires Cloudflare Turnstile captcha token — cannot be called programmatically without solving captcha first.

**Content-Type**: `application/x-www-form-urlencoded`

**Form params**:
| Param | Value |
|---|---|
| `grant_type` | `mdc_password` |
| `username` | email address |
| `clear_text_pwd` | plaintext password |
| `password` | SHA-256 hash of password |
| `identity_type` | `2` (email) |
| `client_id` | `test` |
| `system` | `SOLARMAN` |
| `area` | `IN` |
| `token` | Cloudflare Turnstile token |
| `appKey` | `0x4AAAAAAB3NtEA9guZfcVPY` |
| `_type` | `cloudflare` |
| `verificationType` | `cloudflare` |

**Required headers**:
```
log-area: IN
log-lan: en
log-client-version: 1.7.1
log-platform-code: SOLARMAN_INTELLGENT
log-channel: Web
```

**Token expiry**: Access token ~60 days, Refresh token no expiry in JWT.

---

## 2. Real-time Flow Chart

### `GET /maintain-s/fast/system/{stationId}`

**Purpose**: Live energy flow data — powers the animated flow chart on the dashboard.

**Key response fields**:
```json
{
  "generationPower": 358,         // Current PV production (watts)
  "usePower": 1262,               // Current consumption (watts)
  "wirePower": 909,               // Grid power (watts, negative = feeding to grid)
  "buyPower": 909,                // Grid purchase (watts)
  "gridPower": 0,                 // Grid feed-in (watts)
  "batteryPower": 12,             // Battery power (watts)
  "chargePower": 0,               // Battery charging (watts)
  "dischargePower": 0,            // Battery discharging (watts)
  "batterySoc": 90,               // Battery state of charge (%)

  "genStatus": "OUT",             // PV status: "OUT" = producing
  "wireStatus": "PURCHASE",       // Grid: "PURCHASE" | "GRID_CONNECTED" (selling)
  "batteryStatus": "STATIC",      // Battery: "STATIC" | "CHARGE" | "DISCHARGE"
  "useStatus": "IN",              // Load: "IN" = consuming

  "generationValue": 76.2,        // Today's generation (kWh)
  "useValue": 27,                 // Today's consumption (kWh)
  "gridValue": 58.3,              // Today's grid feed-in (kWh)
  "buyValue": 9.9,                // Today's grid purchase (kWh)
  "chargeValue": 2.7,             // Today's battery charge (kWh)
  "dischargeValue": 1.9,          // Today's battery discharge (kWh)

  "networkStatus": "PARTIAL_OFFLINE",
  "lastUpdateTime": 1774181846,   // Unix timestamp
  "generationCapacity": 0.0298,   // Current capacity factor
  "fullPowerHoursDay": 6.35       // Equivalent sun hours today
}
```

---

## 3. Station Information

### `GET /maintain-s/operating/station/information/{stationId}?language=en`

**Purpose**: Plant overview — name, location, capacity, today/month/year stats.

**Key response fields**:
```json
{
  "id": 63402044,
  "name": "Al Zahra",
  "type": "HOUSE_ROOF",
  "stationType": "HOUSE_ROOF",
  "gridInterconnectionType": "BATTERY_BACKUP",
  "installedCapacity": 12,                    // kWp
  "locationAddress": "4/1349, Sir Syed Nagar",
  "locationLat": 27.913187315439224,
  "locationLng": 78.08684896205634,
  "regionTimezone": "Asia/Calcutta",
  "networkStatus": "PARTIAL_OFFLINE",
  "batterySoc": 90,
  "startOperatingTime": 1733136892,

  "generationPower": 358,         // Current (W)
  "usePower": 1262,
  "buyPower": 909,

  "generationValue": 76.2,        // Today (kWh)
  "useValue": 27,
  "gridValue": 58.3,
  "buyValue": 9.9,

  "generationMonth": 1315.4,      // Month (kWh)
  "useMonth": 1006.3,
  "gridMonth": 863,
  "buyMonth": 565.9,

  "generationYear": 3975.7,       // Year (kWh)
  "useYear": 3737.1,
  "gridYear": 2542.1,
  "buyYear": 2333.3,

  "generationTotal": 24456.7,     // Lifetime (kWh)
  "generationUploadTotalOffset": 127155914.6,  // Total with offset (kWh)

  "fullPowerHoursDay": 6.35,
  "fullPowerYesterdayHours": 5.97,
  "installationAzimuthAngle": 1,
  "installationTiltAngle": 18,
  "currency": "INR"
}
```

---

## 4. Comprehensive System Stats

### `GET /maintain-s/operating/system/{stationId}`

**Purpose**: Complete system statistics — real-time + today + month + year + total + ratios. Most comprehensive single endpoint.

**Key fields** (in addition to what station info provides):
```json
{
  "selfGenAndUseValue": 20.83,     // Self-consumption value today
  "selfSufficiencyValue": 9.61,    // Self-sufficiency value today
  "absorbedUseValue": 27.21,       // Total absorbed for use today

  "generationRatio": 27.06,        // Today's ratios (%)
  "gridRatio": 72.66,
  "useRatio": 34.64,
  "buyRatio": 65.18,
  "chargeRatio": 0.28,
  "useDischargeRatio": 0.18,

  "gridRatioMonth": 63.8,          // Month ratios (%)
  "useRatioMonth": 40.44,
  "buyRatioMonth": 50.97,
  "generationRatioMonth": 31.95,

  "gridRatioYear": 60.89,          // Year ratios (%)
  "useRatioYear": 35.71,
  "buyRatioYear": 56.16,
  "generationRatioYear": 33.76,

  "chargeTotal": 2708.8,           // Lifetime battery totals (kWh)
  "dischargeTotal": 2476.1,
  "incomeTotal": 79133.6,          // Lifetime income (INR)

  "chargeMonth": 123.1,
  "dischargeMonth": 111.1,
  "chargeYear": 464.5,
  "dischargeYear": 434.7
}
```

---

## 5. Energy Saved / Environmental Impact

### `POST /maintain-s/operating/station/generation/energy-saved`

**Body**: `{"systemId": 63402044}`

**Response**:
```json
{
  "systemId": 63402044,
  "generationValueTotal": 127155914.6,   // Total generation (kWh)
  "standardCoalSaved": 38782.55,         // Tonnes of coal saved
  "emissionReductionCO2": 100834.64,     // Tonnes of CO2 prevented
  "treesPlanted": 6927565.4,             // Equivalent trees planted
  "incomeTotal": 826513444.9             // Total income (INR)
}
```

---

## 6. History — 24-hour Curve (5-min intervals)

### `GET /maintain-s/history/batteryPower/{stationId}/stats/daily?year={y}&month={m}&day={d}`

**Purpose**: Powers the "24-hour curve" chart. Returns ~214 records at 5-min intervals + daily summary.

**UI Parameter Dropdown** (checkboxes — multiple can be selected, maps to record fields):
| UI Name | Record Field | Default |
|---|---|---|
| Production Power | `generationPower` | ✅ checked |
| Consumption Power | `usePower` | ✅ checked |
| Feed-in Power | `gridPower` | unchecked |
| Purchasing Power | `buyPower` | unchecked |
| Charging Power | `chargePower` | unchecked |
| Discharging Power | `dischargePower` | unchecked |
| SoC | `batterySoc` | ✅ checked |
| Grid Power | `wirePower` | unchecked |
| Battery Power | `batteryPower` | unchecked |
| UPS Load | `upsPower` | unchecked |

**Diurnal pattern toggle**: When enabled, overlays the previous day's data on the same chart for comparison. Uses the same API with `day-1`.

**Response structure**:
```json
{
  "statistics": {
    "generationValue": 76.2,       // Day totals (kWh)
    "useValue": 27,
    "gridValue": 58.3,
    "buyValue": 9.9,
    "chargeValue": 2.7,
    "dischargeValue": 1.9,
    "incomeValue": 495.3,
    "fullPowerHoursDay": 6.35,
    "genForCharge": 0.2,           // Energy flow breakdowns
    "genForUse": 19.4,
    "useFromDischarge": 0.1,
    "useFromGen": 19.4,
    "genForGrid": 58.3,
    "useFromBuy": 9.9
  },
  "records": [                     // ~214 records, one per 5 min
    {
      "dateTime": 1774147800,      // Unix timestamp
      "generationPower": 5351,     // Watts at this moment
      "usePower": 1490,
      "gridPower": 3760,           // Positive = feeding to grid
      "buyPower": null,            // null when feeding to grid
      "wirePower": -3760,          // Negative = feeding to grid
      "chargePower": 0,
      "dischargePower": null,
      "batteryPower": 0,
      "batterySoc": 90,
      "wireStatus": "GRID_CONNECTED",  // or "PURCHASE"
      "batteryStatus": "STATIC",
      "generationCapacity": 0.45,
      "timeZoneOffset": 19800      // UTC+5:30 in seconds
    }
  ]
}
```

---

## 7. History — Monthly/Yearly/Total (bar chart)

### `GET /maintain-s/history/batteryPower/{stationId}/stats/month?year={y}&month={m}`

**Purpose**: Historical bar chart — per-day breakdown for a month.

**UI Parameter Dropdown** (checkboxes — maps to record fields in stats responses):
| UI Name | Record Field | Default |
|---|---|---|
| Production | `generationValue` | ✅ checked |
| Consumption | `useValue` | ✅ checked |
| Grid Feed-in | `gridValue` | unchecked |
| Energy Purchased | `buyValue` | unchecked |
| Charging Energy | `chargeValue` | unchecked |
| Discharging Energy | `dischargeValue` | unchecked |
| Self-used Ratio | `generationRatio` | unchecked |

**Time range toggle**: Month / Year / Total (same parameter options for all three)

**Response**: Same structure as daily but `records` has one entry per day (22 so far this month).

**Record fields per day**: `generationValue`, `useValue`, `gridValue`, `buyValue`, `chargeValue`, `dischargeValue`, `incomeValue`, `fullPowerHoursDay`, `gridRatio`, `useRatio`, `buyRatio`, `generationRatio`, `genForCharge`, `genForUse`, `useFromDischarge`, `useFromGen`, `genForGrid`, `useFromBuy`, `selfGenAndUseValue`, `selfSufficiencyValue`

---

## 8. History — Yearly (per-month records)

### `GET /maintain-s/history/batteryPower/{stationId}/stats/year?year={y}`

**Purpose**: Yearly history — per-month breakdown.

**Response**: Same structure. `records` has one entry per month (3 so far in 2026: Jan, Feb, Mar).

**Statistics include**: same fields as monthly statistics but aggregated for the year.

---

## 9. History — Lifetime Total (per-year records)

### `GET /maintain-s/history/batteryPower/{stationId}/stats/total`

**Purpose**: All-time stats — per-year breakdown.

**Response**: Same structure + `operatingTotalDays: 475`. Records has one entry per year (2024, 2025, 2026).

---

## 10. Power Analysis

### `GET /maintain-s/history/power/analysis/{stationId}/day?year={y}&month={m}&day={d}`

**Purpose**: Daily power analysis — generation vs consumption breakdown.

**Response**:
```json
{
  "gridInterconnectionType": "BATTERY_BACKUP",
  "analysisResult": 1,
  "genValue": 76.2,
  "useValue": 27,
  "historyTimeType": "day"
}
```

---

## 11. Weather

### `GET /region-s/weather/searchForecast?regionNationId={nid}&regionLevel1={l1}&regionLevel2={l2}&lan=en`

**Purpose**: 7-day weather forecast for the plant location.

**Response**:
```json
{
  "regionName": "Aligarh",
  "weatherList": [
    {
      "datetime": 1774179851,
      "weatherCode": "Clouds",
      "temp": 30,
      "pressure": 1009,
      "humidity": 28,
      "windSpeed": 5.57,
      "windDeg": 280,
      "clouds": 37,
      "sunrise": 1774140606,
      "sunset": 1774184388,
      "tempMin": 17,
      "tempMax": 31,
      "weatherPic": "cloudy",       // "cloudy" | "sunny" | "rainy-s" etc
      "sunshineDuration": 43782     // seconds of sunshine
    }
  ]
}
```

**Region params for Al Zahra**: `regionNationId=105` (India), `regionLevel1=1416`, `regionLevel2=20638`

### `GET /region-s/weather/record/month?regionNationId={}&regionLevel1={}&regionLevel2={}&year={}&month={}&timezone={}&lan=en`

**Purpose**: Historical weather data for a month.

---

## 12. Micro Display / Additional Sources

### `GET /maintain-s/power/system/{stationId}/micro/display?system=SOLARMAN`

**Purpose**: Flags for whether to show additional power sources (micro-inverter, generator, UPS, smart load).

**Response**:
```json
[
  {"displayType": "MICRO", "displayFlg": 0, "displayVal": 0},
  {"displayType": "GEN",   "displayFlg": 0, "displayVal": 0},
  {"displayType": "UPS",   "displayFlg": 0, "displayVal": 0},
  {"displayType": "SMARTLOAD", "displayFlg": 0, "displayVal": 0}
]
```

(`displayFlg: 0` = not shown, `1` = show)

---

## 13. Plant List

### `POST /maintain-s/operating/station/search?order.direction=DESC&order.property=id&page={p}&size={s}`

**Body**: `{}`
**Purpose**: List all plants for the user (paginated).

**Response**: `{ total: 1, data: [{ ...station data... }] }`

---

## 14. Alerts

### `GET /message-s/message/unreaded/total?msgTypes=ALERT`

**Purpose**: Unread alert count.
**Response**: `10` (plain number)

### `POST /maintain-s/operating/alert/search?order.direction=DESC&order.property=alertTime&page=1&size=20&total=0`

**Body**: `{"deviceType":"","language":"en","level":"","startTime":"","levelList":null,"plantId":63402044}`
**Purpose**: Alert list with details (name, device, importance, time).

---

## 15. Device APIs

### `GET /maintain-s/fast/device/{stationId}/device-types`
List device types in the plant.

### `GET /maintain-s/fast/device/{stationId}/device-list?deviceType=INVERTER`
List devices of a specific type.

### `POST /device-s/device/v3/detail`
**Body**: `{"deviceId":242196375,"language":"en","needRealTimeDataFlag":true,"siteId":63402044}`
**Purpose**: Full real-time device data (PV voltages/currents, AC output, grid, load, battery, BMS, temperature).

### `GET /device-s/device/params?productId={pid}&lan=en&queryType=1&deviceId={did}`
Device parameter definitions.

### `GET /device-s/device/{deviceId}/stats/day?showParams=DV1&lan=en&day=2026-03-22`
Device-level historical chart data.

### `GET /maintain-s/operating/station/{stationId}/battery/tree`
Battery device tree listing.

---

## 16. User Info

### `GET /user-s/acc/org/login-user`
Logged-in user details (name, email, last login).

### `GET /group-s/acc/my/info`
Account security status.

---

## Key Device IDs

| Device | ID | Type |
|---|---|---|
| Inverter | 242196375 (SN: 2406294406) | Three phase LV Hybrid, 12kW |
| Logger | 235639522 (SN: 3526884237) | Data logger |
| Battery 1 | M01 | Offline |
| Battery 2 | 2406294406M01 | Online, DEYE 300Ah lithium |

---

## 17. Inverter Device Detail (Real-time)

### `POST /device-s/device/v3/detail`

**Body**:
```json
{
  "deviceId": 242196375,
  "language": "en",
  "needRealTimeDataFlag": true,
  "siteId": 63402044
}
```

**Purpose**: Full real-time inverter data — all sensor readings organized by category. This is the most granular data available.

**Response structure**:
```json
{
  "deviceId": 242196375,
  "deviceSn": "2406294406",
  "siteId": 63402044,
  "productId": "0_5411_1",
  "type": "INVERTER",
  "connectStatus": 1,          // 1 = online
  "collectionTime": 1774182179,
  "paramCategoryList": [...]   // Array of categories below
}
```

### Categories & Fields (storageName = API key for charting)

#### Basic Information (`tag: "basic"`)
| Field | Key | Unit | Sample |
|---|---|---|---|
| SN | `SN1` | - | 2406294406 |
| Inverter Type | `INV_MOD1` | - | Three phase LV Hybrid |
| Rated Power | `Pr1` | W | 12000 |
| System Time | `SYSTIM1` | - | 26-03-22 17:49:25 |

#### Electricity Generation (`tag: "electric"`)
| Field | Key | Unit | Sample |
|---|---|---|---|
| DC Voltage PV1 | `DV1` | V | 545.80 |
| DC Voltage PV2 | `DV2` | V | 578.60 |
| DC Voltage PV3 | `DV3` | V | 0.00 |
| DC Voltage PV4 | `DV4` | V | 0.00 |
| DC Current PV1 | `DC1` | A | 0.40 |
| DC Current PV2 | `DC2` | A | 0.50 |
| DC Current PV3 | `DC3` | A | 0.00 |
| DC Current PV4 | `DC4` | A | 0.00 |
| DC Power PV1 | `DP1` | W | 232 |
| DC Power PV2 | `DP2` | W | 317 |
| DC Power PV3 | `DP3` | W | 0 |
| DC Power PV4 | `DP4` | W | 0 |
| AC Voltage R/U/A | `AV1` | V | 240.10 |
| AC Voltage S/V/B | `AV2` | V | 245.00 |
| AC Voltage T/W/C | `AV3` | V | 245.50 |
| AC Current R/U/A | `AC1` | A | 0.70 |
| AC Current S/V/B | `AC2` | A | 0.70 |
| AC Current T/W/C | `AC3` | A | 0.70 |
| AC Output Frequency R | `A_Fo1` | Hz | 50.00 |
| PV Daily Generation (Active) | `PV_D_P_G` | kWh | 76.30 |
| Cumulative Production (Active) | `Et_ge0` | kWh | 127155914.70 |
| Daily Production (Active) | `Etdy_ge1` | kWh | 76.30 |
| Inverter Output Power L1 | `INV_O_P_L1` | W | 176 |
| Inverter Output Power L2 | `INV_O_P_L2` | W | 190 |
| Inverter Output Power L3 | `INV_O_P_L3` | W | 180 |
| Total Inverter Output Power | `INV_O_P_T` | W | 546 |
| Total Solar Power | `S_P_T` | W | 549 |

#### Grid (`tag: "grid"`)
| Field | Key | Unit | Sample |
|---|---|---|---|
| Grid Voltage L1 | `G_V_L1` | V | 240.40 |
| Grid Current L1 | `G_C_L1` | A | 7.70 |
| Grid Power L1 | `G_P_L1` | W | 1940 |
| Grid Voltage L2 | `G_V_L2` | V | 244.50 |
| Grid Current L2 | `G_C_L2` | A | 1.71 |
| Grid Power L2 | `G_P_L2` | W | 410 |
| Grid Voltage L3 | `G_V_L3` | V | 246.40 |
| Grid Current L3 | `G_C_L3` | A | 1.85 |
| Grid Power L3 | `G_P_L3` | W | 49 |
| Grid Status | `ST_PG1` | - | Purchasing energy (orgValue: 1002) |
| External CT1 Power | `CT1_P_E` | W | -1949 |
| External CT2 Power | `CT2_P_E` | W | -406 |
| External CT3 Power | `CT3_P_E` | W | -59 |
| Total External CT Power | `CT_T_E` | W | -2414 |
| Grid Frequency | `PG_F1` | Hz | 50.00 |
| Total Grid Power | `PG_Pt1` | W | 2399 |
| Total Grid Reactive Power | `G16` | Var | 90.00 |
| A-Phase Reactive Power Grid | `A_RP_PG` | Var | 90.00 |
| B-Phase Reactive Power Grid | `B_RP_PG` | Var | 0.00 |
| C-Phase Reactive Power Grid | `C_RP_PG` | Var | 0.00 |
| Daily Energy Buy | `E_B_D` | kWh | 10.00 |
| Daily Energy Sell | `E_S_D` | kWh | 58.30 |
| Total Energy Buy | `E_B_TO` | kWh | 16371.30 |
| Total Energy Sell | `E_S_TO` | kWh | 13214.20 |
| Internal L1 Power | `GS_A` | W | 1940 |
| Internal L2 Power | `GS_B` | W | 410 |
| Internal L3 Power | `GS_C` | W | 49 |
| Internal Power | `GS_T` | W | 2399 |
| Inverter A-Phase Reactive Power | `A_RP_INV` | Var | 0.00 |
| Inverter B-Phase Reactive Power | `B_RP_INV` | Var | 0.00 |
| Inverter C-Phase Reactive Power | `C_RP_INV` | Var | 0.00 |

#### Load (`tag: "consumption"`)
| Field | Key | Unit | Sample |
|---|---|---|---|
| Load Voltage L1 | `C_V_L1` | V | 239.90 |
| Load Voltage L2 | `C_V_L2` | V | 247.10 |
| Load Voltage L3 | `C_V_L3` | V | 244.40 |
| Load Power L1 | `C_P_L1` | W | 2116 |
| Load Power L2 | `C_P_L2` | W | 600 |
| Load Power L3 | `C_P_L3` | W | 229 |
| Total Consumption Power | `E_Puse_t1` | W | 2945 |
| Total Consumption Apparent Power | `E_Suse_t1` | VA | 2945 |
| Daily Consumption | `Etdy_use1` | kWh | 27.20 |
| Total Consumption | `E_C_T` | kWh | 26535.90 |
| Load Frequency | `L_F` | Hz | 50.00 |
| Load Phase Power A | `LPP_A` | W | 2116 |
| Load Phase Power B | `LPP_B` | W | 600 |
| Load Phase Power C | `LPP_C` | W | 229 |

#### Battery (`tag: "battery"`)
| Field | Key | Unit | Sample |
|---|---|---|---|
| Battery Status | `B_ST1` | - | Static (orgValue: 1000) |
| Battery Voltage | `B_V1` | V | 53.35 |
| Battery Current 1 | `BATC1` | A | 0.18 |
| Battery Current 2 | `B_C2` | A | 0.00 |
| Battery Power | `B_P1` | W | 12 |
| SoC | `B_left_cap1` | % | 90 |
| Total Charging Energy | `t_cg_n1` | kWh | 2792.20 |
| Total Discharging Energy | `t_dcg_n1` | kWh | 2569.90 |
| Daily Charging Energy | `Etdy_cg1` | kWh | 2.70 |
| Daily Discharging Energy | `Etdy_dcg1` | kWh | 1.90 |
| Battery Rated Capacity | `BRC` | Ah | 300 |
| Battery Type | `B_TYP1` | - | lithium (orgValue: 1025) |
| Battery Factory | `BAT_FAC` | - | DEYE |
| Battery Total Current | `B_CT` | A | 0.18 |

#### BMS (`tag: "bms"`)
| Field | Key | Unit | Sample |
|---|---|---|---|
| BMS Voltage | `BMS_B_V1` | V | 53.20 |
| BMS Current | `BMS_B_C1` | A | 0 |
| BMS Temperature | `BMST` | ℃ | 28.00 |
| BMS Charge Voltage | `BMS_C_V` | V | 58.40 |
| BMS Discharge Voltage | `BMS_D_V` | V | 0.00 |
| Charge Current Limit | `BMS_C_C_L` | A | 142 |
| Discharge Current Limit | `BMS_D_C_L` | A | 300 |
| BMS_SOC | `BMS_SOC` | % | 90 |

#### Temperature (`tag: "temperature"`)
| Field | Key | Unit | Sample |
|---|---|---|---|
| Temperature - Battery | `B_T1` | ℃ | 28.00 |
| AC Temperature | `AC_T` | ℃ | 37.70 |

#### State (`tag: "status"`)
| Field | Key | Unit | Sample |
|---|---|---|---|
| Grid Relay Status | `GRID_RELAY_ST1` | - | Pull-in (orgValue: 1001) |

#### Generator (`tag: "generator"`)
| Field | Key | Unit | Sample |
|---|---|---|---|
| Gen Power L1 | `GEN_P_L1` | W | 0 |
| Gen Power L2 | `GEN_P_L2` | W | 0 |
| Gen Power L3 | `GEN_P_L3` | W | 0 |
| Gen Voltage L1 | `GEN_V_L1` | V | 1.70 |
| Gen Voltage L2 | `GEN_V_L2` | V | 1.40 |
| Gen Voltage L3 | `GEN_V_L3` | V | 1.60 |
| Gen Daily Run Time | `R_T_D` | h | 0.00 |
| Generator Active Power | `EG_P_CT1` | W | 0 |
| Total Gen Power | `GEN_P_T` | W | 0 |
| Daily Production Generator | `GEN_P_D` | kWh | 0.00 |
| Total Production Generator | `GEN_P_TO` | kWh | 127130964.70 |

---

## 18. Device Chartable Parameters

### `GET /device-s/device/params?productId={productId}&lan=en&queryType=1&deviceId={deviceId}`

**Purpose**: Returns the list of 104 parameters that can be charted for this device. Each param has `storageName` (the key to use in history queries), `name`, and `unit`. This powers the **Parameter dropdown** in the inverter's Historical Data section.

**UI**: Searchable checkbox list with all 104 params. Default checked: `DC Voltage PV1` (`DV1`). Has a search box to filter by name. Includes "Diurnal pattern" toggle and time range selector (Day / Week / Month / Year / Total). Selected params are passed as `showParams` to the device history chart API (Section 19).

**Parameters for this inverter** (`productId=0_5411_1`, `deviceId=242196375`):
- **PV**: DV1-4 (voltage), DC1-4 (current), DP1-4 (power)
- **AC Output**: AV1-3, AC1-3, A_Fo1, INV_O_P_L1-L3, INV_O_P_T, S_P_T
- **Grid**: G_V_L1-3, G_C_L1-3, G_P_L1-3, CT1-3_P_E, CT_T_E, PG_F1, PG_Pt1, E_B_D, E_S_D, E_B_TO, E_S_TO, GS_A-C, GS_T
- **Load**: C_V_L1-3, C_P_L1-3, E_Puse_t1, Etdy_use1, E_C_T, L_F, LPP_A-C
- **Battery**: B_V1, BATC1, B_C2, B_P1, B_left_cap1, t_cg_n1, t_dcg_n1, Etdy_cg1, Etdy_dcg1, BRC, B_CT
- **BMS**: BMS_B_V1, BMS_B_C1, BMST, BMS_C_V, BMS_D_V, BMS_C_C_L, BMS_D_C_L, BMS_SOC
- **Temp**: B_T1, AC_T
- **Generator**: GEN_P_L1-3, GEN_V_L1-3, R_T_D, EG_P_CT1, GEN_P_T, GEN_P_D, GEN_P_TO

---

## 19. Device History Chart Data

### `GET /device-s/device/{deviceId}/stats/day?lan=en&day={YYYY-MM-DD}&showParams={paramKey}`

**Purpose**: Time-series data for a specific device parameter over a day. Used for the device historical chart.

**Example**: `/device-s/device/242196375/stats/day?lan=en&day=2026-03-22&showParams=DV1`

**Response**:
```json
[
  {
    "storageName": "DV1",
    "name": "DC Voltage PV1",
    "unit": "V",
    "detailList": [
      {"collectionTime": 1774118100, "value": "6.10"},
      {"collectionTime": 1774118167, "value": "6.60"},
      {"collectionTime": 1774118234, "value": "7.40"}
    ]
  }
]
```

Data points are at ~67 second intervals (more granular than the 5-min station-level data). Multiple params can be queried by repeating `showParams`.

**Other time ranges** (same base URL, different path):
- `GET /device-s/device/{deviceId}/stats/week?lan=en&day={YYYY-MM-DD}&showParams={key}`
- `GET /device-s/device/{deviceId}/stats/month?lan=en&month={YYYY-MM}&showParams={key}`
- `GET /device-s/device/{deviceId}/stats/year?lan=en&year={YYYY}&showParams={key}`
- `GET /device-s/device/{deviceId}/stats/total?lan=en&showParams={key}`
