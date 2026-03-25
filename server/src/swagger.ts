export const swaggerDocument = {
  openapi: '3.0.3',
  info: {
    title: 'Solarman Server API',
    version: '1.0.0',
    description: 'Local API for querying solar plant data. Backed by SQLite with data polled from Solarman cloud.',
  },
  servers: [{ url: '/api' }],
  tags: [
    { name: 'Realtime', description: 'Live power flow data (updated every 1 min)' },
    { name: 'Station', description: 'Plant overview and system stats' },
    { name: 'History', description: 'Historical energy data (daily/monthly/yearly/lifetime)' },
    { name: 'Device', description: 'Inverter device data and chart parameters' },
    { name: 'Weather', description: '7-day weather forecast' },
    { name: 'Alerts', description: 'Plant alerts and warnings' },
    { name: 'AC', description: 'Air conditioning control via Tuya Smart IR' },
    { name: 'System', description: 'Server health and poller status' },
  ],
  paths: {
    '/realtime/current': {
      get: {
        tags: ['Realtime'],
        summary: 'Current power flow',
        description: 'Latest flow chart snapshot — PV production, grid, battery, consumption in watts + today\'s energy totals.',
        responses: {
          200: {
            description: 'Current realtime data',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/RealtimeSnapshot' } } },
          },
        },
      },
    },
    '/realtime/history': {
      get: {
        tags: ['Realtime'],
        summary: 'Recent realtime snapshots',
        description: 'Returns 1-min interval snapshots for the last N minutes. Useful for sparkline charts.',
        parameters: [
          { name: 'minutes', in: 'query', schema: { type: 'integer', default: 60 }, description: 'How many minutes of history to return' },
        ],
        responses: {
          200: {
            description: 'Array of realtime snapshots',
            content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/RealtimeSnapshot' } } } },
          },
        },
      },
    },
    '/station': {
      get: {
        tags: ['Station'],
        summary: 'Station overview',
        description: 'Plant info with today/month/year generation, consumption, grid, and battery stats.',
        responses: {
          200: { description: 'Station info', content: { 'application/json': { schema: { $ref: '#/components/schemas/StationInfo' } } } },
        },
      },
    },
    '/system-stats': {
      get: {
        tags: ['Station'],
        summary: 'System ratios and totals',
        description: 'Self-consumption ratios, grid/use/buy ratios for today/month/year, battery charge/discharge totals.',
        responses: {
          200: { description: 'System stats', content: { 'application/json': {} } },
        },
      },
    },
    '/energy-saved': {
      get: {
        tags: ['Station'],
        summary: 'Environmental impact',
        description: 'CO2 prevented, coal saved, trees planted, total income.',
        responses: {
          200: {
            description: 'Energy saved data',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    stationId: { type: 'integer' },
                    generationTotal: { type: 'number', description: 'Total generation in kWh' },
                    coalSaved: { type: 'number', description: 'Tonnes of coal saved' },
                    co2Reduced: { type: 'number', description: 'Tonnes of CO2 prevented' },
                    treesPlanted: { type: 'number', description: 'Equivalent trees planted' },
                    incomeTotal: { type: 'number', description: 'Total income in INR' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/history/daily': {
      get: {
        tags: ['History'],
        summary: '24-hour curve (5-min intervals)',
        description: 'Returns ~214 data points at 5-minute intervals for a given day, plus daily summary statistics. If the date is not in the DB, it will be fetched from Solarman on demand.',
        parameters: [
          { name: 'date', in: 'query', required: true, schema: { type: 'string', example: '2026-03-22' }, description: 'Date in YYYY-MM-DD format' },
        ],
        responses: {
          200: {
            description: 'Daily statistics + 5-min records',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    statistics: { $ref: '#/components/schemas/DailyStatistics' },
                    records: { type: 'array', items: { $ref: '#/components/schemas/DailyRecord' } },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/history/monthly': {
      get: {
        tags: ['History'],
        summary: 'Monthly per-day records',
        description: 'Returns one record per day for a given month with generation, consumption, grid, battery values.',
        parameters: [
          { name: 'year', in: 'query', required: true, schema: { type: 'integer', example: 2026 } },
          { name: 'month', in: 'query', required: true, schema: { type: 'integer', example: 3 } },
        ],
        responses: {
          200: { description: 'Monthly records', content: { 'application/json': {} } },
        },
      },
    },
    '/history/yearly': {
      get: {
        tags: ['History'],
        summary: 'Yearly per-month records',
        description: 'Returns one record per month for a given year.',
        parameters: [
          { name: 'year', in: 'query', required: true, schema: { type: 'integer', example: 2026 } },
        ],
        responses: {
          200: { description: 'Yearly records', content: { 'application/json': {} } },
        },
      },
    },
    '/history/lifetime': {
      get: {
        tags: ['History'],
        summary: 'Lifetime per-year records',
        description: 'Returns one record per year for the entire plant lifetime.',
        responses: {
          200: { description: 'Lifetime records', content: { 'application/json': {} } },
        },
      },
    },
    '/device/current': {
      get: {
        tags: ['Device'],
        summary: 'Current inverter data',
        description: 'Latest real-time data from the inverter — all 104 parameters (PV, AC, grid, load, battery, BMS, temperature, generator).',
        responses: {
          200: { description: 'Device data with parsed params', content: { 'application/json': {} } },
        },
      },
    },
    '/device/history': {
      get: {
        tags: ['Device'],
        summary: 'Recent device snapshots',
        description: 'Returns 1-min interval inverter snapshots for the last N minutes.',
        parameters: [
          { name: 'minutes', in: 'query', schema: { type: 'integer', default: 60 }, description: 'How many minutes of history' },
        ],
        responses: {
          200: { description: 'Array of device snapshots', content: { 'application/json': {} } },
        },
      },
    },
    '/device/params': {
      get: {
        tags: ['Device'],
        summary: 'Chartable parameter definitions',
        description: 'Returns all 104 parameters that can be charted, with storageName (key), display name, and unit.',
        responses: {
          200: {
            description: 'Parameter list',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      storageName: { type: 'string', example: 'DV1' },
                      name: { type: 'string', example: 'DC Voltage PV1' },
                      unit: { type: 'string', example: 'V' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/device/chart': {
      get: {
        tags: ['Device'],
        summary: 'Device chart time-series',
        description: 'Returns historical time-series data for selected device parameters on a given day (~67 second intervals).',
        parameters: [
          { name: 'date', in: 'query', required: true, schema: { type: 'string', example: '2026-03-22' }, description: 'Date in YYYY-MM-DD' },
          { name: 'params', in: 'query', required: true, schema: { type: 'string', example: 'DV1,DP1' }, description: 'Comma-separated parameter keys (storageName)' },
        ],
        responses: {
          200: {
            description: 'Array of chart series',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      storageName: { type: 'string' },
                      name: { type: 'string' },
                      unit: { type: 'string' },
                      detailList: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            collectionTime: { type: 'integer' },
                            value: { type: 'string' },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/device/chart/dates': {
      get: {
        tags: ['Device'],
        summary: 'Available chart dates',
        description: 'Returns a list of dates that have device chart data available.',
        responses: {
          200: {
            description: 'Array of date strings',
            content: { 'application/json': { schema: { type: 'array', items: { type: 'string', example: '2026-03-22' } } } },
          },
        },
      },
    },
    '/weather': {
      get: {
        tags: ['Weather'],
        summary: '7-day weather forecast',
        description: 'Weather forecast for the plant location (Aligarh) — temp, humidity, wind, sunrise/sunset.',
        responses: {
          200: { description: 'Weather forecast array', content: { 'application/json': {} } },
        },
      },
    },
    '/alerts': {
      get: {
        tags: ['Alerts'],
        summary: 'Alert list',
        description: 'All alerts for the plant, ordered by most recent first.',
        responses: {
          200: { description: 'Alert array', content: { 'application/json': {} } },
        },
      },
    },
    '/alerts/count': {
      get: {
        tags: ['Alerts'],
        summary: 'Alert count',
        description: 'Number of alerts.',
        responses: {
          200: {
            description: 'Count object',
            content: { 'application/json': { schema: { type: 'object', properties: { count: { type: 'integer' } } } } },
          },
        },
      },
    },
    '/ac/state': {
      get: {
        tags: ['AC'],
        summary: 'Get AC state',
        description: 'Returns the current AC state (power, temperature, mode, fan). Persisted in DB — survives server restarts.',
        responses: {
          200: {
            description: 'AC state',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ACState' },
              },
            },
          },
        },
      },
    },
    '/ac/power': {
      post: {
        tags: ['AC'],
        summary: 'Toggle AC power',
        description: 'Turns the AC on or off via IR blaster. When turning on, uses the last saved temperature.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: { on: { type: 'boolean', description: 'true = power on, false = power off' } },
                required: ['on'],
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Updated AC state',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    ok: { type: 'boolean' },
                    state: { $ref: '#/components/schemas/ACState' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/ac/temp': {
      post: {
        tags: ['AC'],
        summary: 'Set AC temperature',
        description: 'Sets AC temperature (16-30°C). Sends power on first, then the temperature IR code. Cold mode, auto fan.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: { temp: { type: 'integer', minimum: 16, maximum: 30, description: 'Target temperature in °C' } },
                required: ['temp'],
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Updated AC state',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    ok: { type: 'boolean' },
                    state: { $ref: '#/components/schemas/ACState' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/status': {
      get: {
        tags: ['System'],
        summary: 'Server health',
        description: 'Server uptime and status of all background pollers (last success time, last error, run count).',
        responses: {
          200: { description: 'Status object', content: { 'application/json': {} } },
        },
      },
    },
  },
  components: {
    schemas: {
      RealtimeSnapshot: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          timestamp: { type: 'integer', description: 'Unix seconds from Solarman' },
          polledAt: { type: 'integer', description: 'Unix seconds when we fetched it' },
          generationPower: { type: 'number', description: 'Current PV production (W)' },
          usePower: { type: 'number', description: 'Current consumption (W)' },
          wirePower: { type: 'number', description: 'Grid power signed (W, negative = feeding)' },
          buyPower: { type: 'number', description: 'Grid purchase (W)' },
          gridPower: { type: 'number', description: 'Grid feed-in (W)' },
          batteryPower: { type: 'number', description: 'Battery power (W)' },
          chargePower: { type: 'number', description: 'Battery charging (W)' },
          dischargePower: { type: 'number', description: 'Battery discharging (W)' },
          batterySoc: { type: 'integer', description: 'Battery state of charge (%)' },
          genStatus: { type: 'string', description: '"OUT" = producing' },
          wireStatus: { type: 'string', description: '"PURCHASE" or "GRID_CONNECTED"' },
          batteryStatus: { type: 'string', description: '"STATIC", "CHARGE", or "DISCHARGE"' },
          generationValue: { type: 'number', description: 'Today generation (kWh)' },
          useValue: { type: 'number', description: 'Today consumption (kWh)' },
          gridValue: { type: 'number', description: 'Today grid feed-in (kWh)' },
          buyValue: { type: 'number', description: 'Today grid purchase (kWh)' },
          chargeValue: { type: 'number', description: 'Today battery charge (kWh)' },
          dischargeValue: { type: 'number', description: 'Today battery discharge (kWh)' },
          networkStatus: { type: 'string' },
        },
      },
      StationInfo: {
        type: 'object',
        properties: {
          stationId: { type: 'integer' },
          name: { type: 'string', example: 'Al Zahra' },
          installedCapacity: { type: 'number', description: 'kWp' },
          batterySoc: { type: 'integer', description: '%' },
          generationPower: { type: 'number', description: 'Current W' },
          usePower: { type: 'number' },
          buyPower: { type: 'number' },
          generationValue: { type: 'number', description: 'Today kWh' },
          useValue: { type: 'number' },
          gridValue: { type: 'number' },
          buyValue: { type: 'number' },
          generationMonth: { type: 'number', description: 'Month kWh' },
          generationYear: { type: 'number', description: 'Year kWh' },
          generationTotal: { type: 'number', description: 'Lifetime kWh' },
          networkStatus: { type: 'string' },
          locationAddress: { type: 'string' },
          locationLat: { type: 'number' },
          locationLng: { type: 'number' },
        },
      },
      DailyStatistics: {
        type: 'object',
        properties: {
          date: { type: 'string' },
          generationValue: { type: 'number', description: 'kWh' },
          useValue: { type: 'number' },
          gridValue: { type: 'number' },
          buyValue: { type: 'number' },
          chargeValue: { type: 'number' },
          dischargeValue: { type: 'number' },
          incomeValue: { type: 'number' },
          fullPowerHoursDay: { type: 'number' },
          genForUse: { type: 'number' },
          genForGrid: { type: 'number' },
          genForCharge: { type: 'number' },
          useFromGen: { type: 'number' },
          useFromBuy: { type: 'number' },
          useFromDischarge: { type: 'number' },
        },
      },
      DailyRecord: {
        type: 'object',
        properties: {
          date: { type: 'string' },
          timestamp: { type: 'integer', description: 'Unix seconds' },
          generationPower: { type: 'number', description: 'W at this moment' },
          usePower: { type: 'number' },
          gridPower: { type: 'number', description: 'Positive = feeding to grid' },
          buyPower: { type: 'number' },
          wirePower: { type: 'number', description: 'Negative = feeding to grid' },
          chargePower: { type: 'number' },
          dischargePower: { type: 'number' },
          batteryPower: { type: 'number' },
          batterySoc: { type: 'number', description: '%' },
          wireStatus: { type: 'string' },
          batteryStatus: { type: 'string' },
        },
      },
    },
      ACState: {
        type: 'object',
        properties: {
          power: { type: 'boolean', description: 'AC on/off' },
          temp: { type: 'integer', description: 'Temperature (16-30°C)' },
          mode: { type: 'integer', description: '0=Cool (only mode with learned codes)' },
          fan: { type: 'integer', description: '0=Auto (only speed with learned codes)' },
        },
      },
    },
  },
};
