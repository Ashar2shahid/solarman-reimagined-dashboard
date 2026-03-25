# Tuya IR AC Control — Implementation Notes

## Setup

- **Tuya IoT Platform**: https://iot.tuya.com
- **API Base URL**: `https://openapi.tuyain.com` (India datacenter)
- **Auth**: HMAC-SHA256 signed requests with access_id + access_secret
- **Token**: `GET /v1.0/token?grant_type=1` — expires in ~7000 seconds

## Devices

| Device | ID | Type |
|---|---|---|
| Smart IR Blaster | `d7b133a1e27b474002u6rp` | Physical device, emits IR signals |
| Air Conditioning | `d709603c5cd7513642zxe5` | Virtual remote (learned codes) |

The AC was originally added as `d703e7767c2b6ebd57mop6` via SmartLife brand matching, but that device ID **does not emit IR** through the API. The working device ID `d709603c5cd7513642zxe5` was created via SmartLife's "learn remote" feature.

## What Doesn't Work

### Brand-matched remote commands (cloud-only, no IR emission)

These endpoints return `success: true` and update the SmartLife app state, but the IR blaster **never emits an IR signal**:

```
POST /v1.0/infrareds/{ir_id}/remotes/{ac_id}/command
  body: { key: "PowerOn", value: 1 }
  Result: success=true, but AC doesn't respond
```

```
POST /v2.0/infrareds/{ir_id}/air-conditioners/{ac_id}/scenes/command
  body: { power: 1, mode: 0, temp: 19, wind: 0 }
  Result: success=true, SmartLife shows AC as "on", but no IR emitted
```

```
POST /v2.0/infrareds/{ir_id}/air-conditioners/{ac_id}/command
  body: { code: "power", value: 1 }
  Result: error — "command not found"
```

### Testing endpoints (require category_id)

```
POST /v2.0/infrareds/{ir_id}/air-conditioners/testing/command
POST /v2.0/infrareds/{ir_id}/air-conditioners/testing/scenes/command
  Result: success=true, but no IR emitted
```

### Standard v2.0 commands (require categoryId)

```
POST /v2.0/infrareds/{ir_id}/remotes/{ac_id}/command
POST /v2.0/infrareds/{ir_id}/remotes/{ac_id}/raw/command
  Result: error — "categoryId" missing
```

## What Works: Learned IR Codes

The only method that **actually emits IR** is replaying learned codes:

### Step 1: Fetch learned codes
```
GET /v2.0/infrareds/{ir_id}/remotes/{ac_id}/learning-codes
```

Returns array of learned codes with keys like `power_on`, `power_off`, `M0_T19_S0` (cold 19°C auto fan), etc.

### Step 2: Replay a learned code
```
POST /v2.0/infrareds/{ir_id}/remotes/{ac_id}/learning-codes
  body: { code: "<hex IR code string>" }
```

This **actually triggers the IR blaster** to emit the signal, and the AC responds.

### Important: Temperature codes require power_on first

The learned temperature codes (e.g., `M0_T19_S0` = cold 19°C auto) do NOT turn the AC on by themselves. You must:

1. Send `power_on` code
2. Wait 2-3 seconds
3. Send the temperature code

If you send the temperature code without power_on first, the AC ignores it.

## Available Learned Codes

All codes are for **cold mode, auto fan speed**:

| Key | Description |
|---|---|
| `power_on` | Turn AC on (resumes last settings) |
| `power_off` | Turn AC off |
| `M0_T16_S0` through `M0_T30_S0` | Set temperature 16-30°C (cold mode, auto fan) |

## API Permissions Required

On the Tuya IoT Platform, the project needs these API subscriptions:
- **IR Control Hub Open Service** — for all `/v2.0/infrareds/` endpoints
- **Device Management** — for `/v1.0/devices/` endpoints

## Key Learnings

1. **SmartLife app uses a different communication path** than the cloud API. The app may communicate directly with the IR blaster over LAN, bypassing the cloud entirely.

2. **Brand-matched remotes** (selected from Tuya's database) work in the app but not via API. The API updates cloud state without triggering IR emission.

3. **Learned remotes** (where you point your physical remote at the IR blaster) store raw IR codes that CAN be replayed via the API.

4. **The `learning-codes` POST endpoint** is the only reliable way to emit IR via the API. It's documented as "Send Learning Code" in the Tuya docs.

5. **Two different AC device IDs existed** — one from brand matching (`d703e7767c2b6ebd57mop6`) and one from learning (`d709603c5cd7513642zxe5`). Only the learned one works.

6. **Token caching** is important — tokens last ~2 hours. Re-requesting too frequently will hit rate limits.
