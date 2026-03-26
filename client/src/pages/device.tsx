import { useState, useRef, useEffect } from 'react';
import { usePolling } from '@/hooks/use-polling';
import { api, type DeviceChartSeries, type DeviceCurrent } from '@/lib/api';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
  ReferenceLine, ReferenceArea,
} from 'recharts';
import { Thermometer, Zap, Sun, Battery, Activity, Home, Gauge, Info, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

const TEMP_PARAMS = 'B_T1,AC_T';
const VOLTAGE_PARAMS = 'G_V_L1,G_V_L2,G_V_L3';
const PV_VOLTAGE_PARAMS = 'DV1,DV2';
const PV_POWER_PARAMS = 'DP1,DP2,S_P_T,INV_O_P_T';
const BATTERY_PARAMS = 'B_V1,BATC1,B_P1,B_left_cap1';
const BMS_PARAMS = 'BMS_B_V1,BMS_B_C1,BMST,BMS_SOC';
const LOAD_PARAMS = 'C_P_L1,C_P_L2,C_P_L3,E_Puse_t1';
const GRID_FREQ_PARAMS = 'PG_F1';
const GRID_POWER_PARAMS = 'G_P_L1,G_P_L2,G_P_L3,PG_Pt1';
const CT_PARAMS = 'CT1_P_E,CT2_P_E,CT3_P_E,CT_T_E';

function buildFullDayChart(series: DeviceChartSeries[]) {
  // Build 24hr time slots every 5 min
  const slots: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 5) {
      slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }
  }

  // Index data by time key per series (treat 0V as null for voltage params)
  const skipThresholds: Record<string, number> = {
    'G_V_L1': 200, 'G_V_L2': 200, 'G_V_L3': 200, 'PG_F1': 10,
  };
  const seriesMap = new Map<string, Map<string, number>>();
  for (const s of series) {
    const timeMap = new Map<string, number>();
    for (const p of s.detailList) {
      const val = parseFloat(p.value);
      const threshold = skipThresholds[s.storageName];
      if (threshold !== undefined && val < threshold) continue;
      const d = new Date(p.collectionTime * 1000);
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(Math.floor(d.getMinutes() / 5) * 5).padStart(2, '0');
      timeMap.set(`${hh}:${mm}`, val);
    }
    seriesMap.set(s.storageName, timeMap);
  }

  return slots.map(time => {
    const point: Record<string, string | number | null> = { time };
    for (const s of series) {
      point[s.storageName] = seriesMap.get(s.storageName)?.get(time) ?? null;
    }
    return point;
  });
}

const TICK_VALUES = ['00:00', '03:00', '06:00', '09:00', '12:00', '15:00', '18:00', '21:00'];

// Detect outage gaps: periods where ANY phase has 0V readings
function detectOutageGaps(series: DeviceChartSeries[]): { x1: string; x2: string }[] {
  const voltageSeriesList = series.filter(s => ['G_V_L1', 'G_V_L2', 'G_V_L3'].includes(s.storageName));
  if (voltageSeriesList.length === 0) return [];

  // Build a set of times where any phase is < 10V
  const outageSlots = new Set<string>();
  for (const vs of voltageSeriesList) {
    for (const p of vs.detailList) {
      if (parseFloat(p.value) < 200) {
        const d = new Date(p.collectionTime * 1000);
        const hh = String(d.getHours()).padStart(2, '0');
        const mm = String(Math.floor(d.getMinutes() / 5) * 5).padStart(2, '0');
        outageSlots.add(`${hh}:${mm}`);
      }
    }
  }

  if (outageSlots.size === 0) return [];

  // Build sorted list of all 5-min slots and find contiguous gaps
  const allSlots: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 5) {
      allSlots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }
  }

  const gaps: { x1: string; x2: string }[] = [];
  let gapStart: string | null = null;

  for (const time of allSlots) {
    if (outageSlots.has(time)) {
      if (!gapStart) gapStart = time;
    } else {
      if (gapStart) {
        gaps.push({ x1: gapStart, x2: time });
        gapStart = null;
      }
    }
  }
  if (gapStart) gaps.push({ x1: gapStart, x2: '23:55' });

  return gaps;
}

function DeviceChart({ title, icon, series, lines, yDomain, yScale, yFormatter, referenceLines, outageGaps, yBands, rightAxis, acEvents }: {
  title: string;
  icon: React.ReactNode;
  series: DeviceChartSeries[];
  lines: { key: string; color: string; name: string; axis?: 'left' | 'right' }[];
  yDomain?: [number | string, number | string];
  yScale?: 'auto' | 'log';
  yFormatter?: (v: number) => string;
  referenceLines?: { y: number; label: string; color: string }[];
  outageGaps?: { x1: string; x2: string }[];
  yBands?: { y1: number; y2: number; fill: string; opacity: number; label?: string }[];
  rightAxis?: { domain?: [number | string, number | string]; formatter?: (v: number) => string };
  acEvents?: { timestamp: number; action: string; temp: number | null }[];
}) {
  const chartData = buildFullDayChart(series);

  // Inject AC event times into chart data so ReferenceLine can find them
  if (acEvents?.length) {
    const existingTimes = new Set(chartData.map(d => d.time));
    for (const ev of acEvents) {
      const d = new Date(ev.timestamp * 1000);
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      const timeStr = `${hh}:${mm}`;
      if (!existingTimes.has(timeStr)) {
        chartData.push({ time: timeStr });
        existingTimes.add(timeStr);
      }
    }
    chartData.sort((a, b) => (a.time as string).localeCompare(b.time as string));
  }

  const hasRightAxis = rightAxis || lines.some(l => l.axis === 'right');

  return (
    <div className="bg-surface rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h3 className="text-sm font-semibold text-text">{title}</h3>
      </div>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={chartData} margin={{ top: 5, right: hasRightAxis ? 5 : 5, left: -10, bottom: 0 }}>
          <XAxis
            dataKey="time"
            tick={{ fontSize: 10, fill: '#78716c' }}
            tickLine={false}
            axisLine={false}
            ticks={TICK_VALUES}
          />
          <YAxis
            yAxisId="left"
            tick={{ fontSize: 10, fill: '#78716c' }}
            tickLine={false}
            axisLine={false}
            domain={yDomain ?? ['auto', 'auto']}
            scale={yScale === 'log' ? 'log' : 'auto'}
            tickFormatter={yFormatter}
            allowDataOverflow={yScale === 'log'}
          />
          {hasRightAxis && (
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 10, fill: '#78716c' }}
              tickLine={false}
              axisLine={false}
              domain={rightAxis?.domain ?? ['auto', 'auto']}
              tickFormatter={rightAxis?.formatter}
            />
          )}
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 12, border: '1px solid #e7e5e4', background: '#fff' }}
            formatter={(value: any, name: any) => [
              value != null ? `${Number(value).toFixed(1)}` : '—',
              name,
            ]}
            labelFormatter={(label) => `Time: ${label}`}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" iconSize={8} />
          {yBands?.map((band, i) => (
            <ReferenceArea key={`band-${i}`} y1={band.y1} y2={band.y2} fill={band.fill} fillOpacity={band.opacity} ifOverflow="hidden" yAxisId="left" />
          ))}
          {outageGaps?.map((gap, i) => (
            <ReferenceArea key={`gap-${i}`} x1={gap.x1} x2={gap.x2} fill="#ef4444" fillOpacity={0.08} stroke="#ef4444" strokeOpacity={0.2} strokeWidth={0.5} label={{ value: 'Grid Off', fontSize: 9, fill: '#ef4444', position: 'insideTop' }} yAxisId="left" />
          ))}
          {referenceLines?.map(rl => (
            <ReferenceLine key={rl.label} y={rl.y} stroke={rl.color} strokeDasharray="4 4" strokeWidth={1} yAxisId="left">
            </ReferenceLine>
          ))}
          {acEvents?.map((ev, i) => {
            const d = new Date(ev.timestamp * 1000);
            const hh = String(d.getHours()).padStart(2, '0');
            const mm = String(d.getMinutes()).padStart(2, '0');
            const timeStr = `${hh}:${mm}`;
            const isOn = ev.action === 'power_on' || ev.action === 'set_temp';
            const label = ev.action === 'power_off' ? 'AC Off' : `AC ${ev.temp ?? ''}°C`;
            return (
              <ReferenceLine
                key={`ac-${i}`}
                x={timeStr}
                stroke={isOn ? '#3b82f6' : '#6b7280'}
                strokeDasharray="3 3"
                strokeWidth={1.5}
                yAxisId="left"
                label={{ value: label, fontSize: 10, fill: isOn ? '#3b82f6' : '#6b7280', position: i % 2 === 0 ? 'insideTopRight' : 'insideBottomRight', offset: 4 }}
              />
            );
          })}
          {lines.map(l => (
            <Line
              key={l.key}
              yAxisId={l.axis === 'right' ? 'right' : 'left'}
              type="monotone"
              dataKey={l.key}
              name={l.name}
              stroke={l.color}
              strokeWidth={2}
              dot={false}
              connectNulls={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function CurrentValues({ device }: { device: DeviceCurrent | null }) {
  const d = device?.data;
  const vals = [
    { label: 'Battery Temp', key: 'B_T1', unit: '°C' },
    { label: 'Inverter Temp', key: 'AC_T', unit: '°C' },
    { label: 'Grid L1', key: 'G_V_L1', unit: 'V' },
    { label: 'Grid L2', key: 'G_V_L2', unit: 'V' },
    { label: 'Grid L3', key: 'G_V_L3', unit: 'V' },
    { label: 'Frequency', key: 'PG_F1', unit: 'Hz' },
    { label: 'Solar Power', key: 'S_P_T', unit: 'W' },
    { label: 'Battery SoC', key: 'B_left_cap1', unit: '%' },
    { label: 'Total Load', key: 'E_Puse_t1', unit: 'W' },
  ];

  return (
    <div className="bg-surface rounded-2xl p-5">
      <h3 className="text-sm font-semibold text-text mb-3">Current Readings</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {vals.map(v => {
          const raw = d?.[v.key]?.value;
          const val = raw ? parseFloat(raw) : null;
          return (
            <div key={v.key} className="bg-surface-warm rounded-xl p-3">
              <div className="text-[11px] text-text-muted">{v.label}</div>
              <div className="text-lg font-bold text-text">
                {val !== null ? `${val.toFixed(1)}${v.unit}` : '—'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DateSelector({ value, onChange }: { value: string; onChange: (d: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const today = new Date().toISOString().split('T')[0];
  const isToday = value === today;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const shift = (days: number) => {
    const d = new Date(value);
    d.setDate(d.getDate() + days);
    const iso = d.toISOString().split('T')[0];
    if (iso <= today) onChange(iso);
  };

  const displayDate = new Date(value).toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="flex items-center gap-1" ref={ref}>
      <button onClick={() => shift(-1)} className="p-1.5 rounded-full hover:bg-surface-warm transition-colors">
        <ChevronLeft className="w-4 h-4 text-text-muted" />
      </button>
      <div className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 px-4 py-2 bg-surface rounded-full border border-border text-sm text-text hover:bg-surface-warm transition-colors"
        >
          <Calendar className="w-3.5 h-3.5 text-text-muted" />
          <span>{isToday ? `Today, ${displayDate}` : displayDate}</span>
        </button>
        {open && (
          <div className="absolute right-0 top-full mt-2 bg-surface rounded-xl border border-border shadow-lg p-3 z-50">
            <input
              type="date"
              value={value}
              max={today}
              onChange={(e) => { onChange(e.target.value); setOpen(false); }}
              className="text-sm bg-surface-warm rounded-lg px-3 py-2 border border-border text-text"
            />
          </div>
        )}
      </div>
      <button
        onClick={() => shift(1)}
        disabled={isToday}
        className={`p-1.5 rounded-full transition-colors ${isToday ? 'opacity-30' : 'hover:bg-surface-warm'}`}
      >
        <ChevronRight className="w-4 h-4 text-text-muted" />
      </button>
    </div>
  );
}

export function DevicePage() {
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);

  const { data: tempSeries } = usePolling(() => api.device.chart(date, TEMP_PARAMS), 60_000, [date]);
  const { data: acEvents } = usePolling(() => api.ac.events(date), 60_000, [date]);
  const { data: voltageSeries } = usePolling(() => api.device.chart(date, VOLTAGE_PARAMS), 60_000, [date]);
  const { data: pvVoltageSeries } = usePolling(() => api.device.chart(date, PV_VOLTAGE_PARAMS), 60_000, [date]);
  const { data: pvPowerSeries } = usePolling(() => api.device.chart(date, PV_POWER_PARAMS), 60_000, [date]);
  const { data: batterySeries } = usePolling(() => api.device.chart(date, BATTERY_PARAMS), 60_000, [date]);
  const { data: bmsSeries } = usePolling(() => api.device.chart(date, BMS_PARAMS), 60_000, [date]);
  const { data: loadSeries } = usePolling(() => api.device.chart(date, LOAD_PARAMS), 60_000, [date]);
  const { data: gridFreqSeries } = usePolling(() => api.device.chart(date, GRID_FREQ_PARAMS), 60_000, [date]);
  const { data: gridPowerSeries } = usePolling(() => api.device.chart(date, GRID_POWER_PARAMS), 60_000, [date]);
  const { data: ctSeries } = usePolling(() => api.device.chart(date, CT_PARAMS), 60_000, [date]);
  const { data: device } = usePolling(() => api.device.current(), 10_000);

  const outageGapsData = detectOutageGaps(voltageSeries ?? []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-text">Device</h2>
        <DateSelector value={date} onChange={setDate} />
      </div>

      <CurrentValues device={device} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <DeviceChart
        title="Temperature (24h)"
        icon={<Thermometer className="w-4 h-4 text-text-muted" />}
        series={tempSeries ?? []}
        lines={[
          { key: 'B_T1', color: '#16a34a', name: 'Battery' },
          { key: 'AC_T', color: '#dc2626', name: 'Inverter' },
        ]}
        yDomain={[0, 60]}
        yFormatter={(v) => `${v}°C`}
        yBands={[
          { y1: 0, y2: 30, fill: '#22c55e', opacity: 0.06 },
          { y1: 30, y2: 40, fill: '#eab308', opacity: 0.06 },
          { y1: 40, y2: 50, fill: '#f97316', opacity: 0.08 },
          { y1: 50, y2: 60, fill: '#ef4444', opacity: 0.10 },
        ]}
        referenceLines={[
          { y: 30, label: '', color: '#22c55e' },
          { y: 40, label: '', color: '#eab308' },
          { y: 50, label: '', color: '#ef4444' },
        ]}
        acEvents={acEvents ?? undefined}
      />

      <DeviceChart
        title="Grid Voltage (24h)"
        icon={<Zap className="w-4 h-4 text-text-muted" />}
        series={voltageSeries ?? []}
        lines={[
          { key: 'G_V_L1', color: '#f97316', name: 'L1' },
          { key: 'G_V_L2', color: '#3b82f6', name: 'L2' },
          { key: 'G_V_L3', color: '#22c55e', name: 'L3' },
        ]}
        yDomain={[200, 260]}
        yFormatter={(v) => `${v}V`}
        referenceLines={[
          { y: 220, label: 'Low', color: '#ef4444' },
          { y: 250, label: 'High', color: '#ef4444' },
        ]}
        outageGaps={outageGapsData}
      />

      {/* ── Grid Frequency ── */}
      <DeviceChart
        title="Grid Frequency (24h)"
        icon={<Activity className="w-4 h-4 text-text-muted" />}
        series={gridFreqSeries ?? []}
        lines={[
          { key: 'PG_F1', color: '#8b5cf6', name: 'Frequency' },
        ]}
        yDomain={[49.5, 50.5]}
        yFormatter={(v) => `${v}Hz`}
        referenceLines={[
          { y: 49.8, label: '', color: '#ef4444' },
          { y: 50.2, label: '', color: '#ef4444' },
        ]}
        yBands={[
          { y1: 49.5, y2: 49.8, fill: '#ef4444', opacity: 0.06 },
          { y1: 49.8, y2: 50.2, fill: '#22c55e', opacity: 0.06 },
          { y1: 50.2, y2: 50.5, fill: '#ef4444', opacity: 0.06 },
        ]}
        outageGaps={outageGapsData}
      />

      {/* ── Grid Power per Phase ── */}
      <DeviceChart
        title="Grid Power per Phase (24h)"
        icon={<Zap className="w-4 h-4 text-text-muted" />}
        series={gridPowerSeries ?? []}
        lines={[
          { key: 'G_P_L1', color: '#f97316', name: 'L1' },
          { key: 'G_P_L2', color: '#3b82f6', name: 'L2' },
          { key: 'G_P_L3', color: '#22c55e', name: 'L3' },
          { key: 'PG_Pt1', color: '#78716c', name: 'Total' },
        ]}
        yFormatter={(v) => `${v}W`}
      />

      {/* ── CT Power ── */}
      <DeviceChart
        title="External CT Power (24h)"
        icon={<Gauge className="w-4 h-4 text-text-muted" />}
        series={ctSeries ?? []}
        lines={[
          { key: 'CT1_P_E', color: '#f97316', name: 'CT1' },
          { key: 'CT2_P_E', color: '#3b82f6', name: 'CT2' },
          { key: 'CT3_P_E', color: '#22c55e', name: 'CT3' },
          { key: 'CT_T_E', color: '#78716c', name: 'Total' },
        ]}
        yFormatter={(v) => `${v}W`}
      />

      {/* ── PV String Voltages ── */}
      <DeviceChart
        title="PV String Voltage (24h)"
        icon={<Sun className="w-4 h-4 text-text-muted" />}
        series={pvVoltageSeries ?? []}
        lines={[
          { key: 'DV1', color: '#eab308', name: 'String 1' },
          { key: 'DV2', color: '#f97316', name: 'String 2' },
        ]}
        yFormatter={(v) => `${v}V`}
      />

      {/* ── PV Power ── */}
      <DeviceChart
        title="PV Power & Inverter Output (24h)"
        icon={<Sun className="w-4 h-4 text-text-muted" />}
        series={pvPowerSeries ?? []}
        lines={[
          { key: 'DP1', color: '#eab308', name: 'PV1 Power' },
          { key: 'DP2', color: '#f97316', name: 'PV2 Power' },
          { key: 'S_P_T', color: '#16a34a', name: 'Total Solar' },
          { key: 'INV_O_P_T', color: '#3b82f6', name: 'Inverter Output' },
        ]}
        yFormatter={(v) => `${v}W`}
      />

      {/* ── Battery ── */}
      <DeviceChart
        title="Battery Power & SoC (24h)"
        icon={<Battery className="w-4 h-4 text-text-muted" />}
        series={batterySeries ?? []}
        lines={[
          { key: 'B_P1', color: '#f97316', name: 'Power (W)' },
          { key: 'B_left_cap1', color: '#3b82f6', name: 'SoC (%)', axis: 'right' },
        ]}
        yFormatter={(v) => `${v}W`}
        rightAxis={{ domain: [0, 100], formatter: (v) => `${v}%` }}
      />

      {/* ── BMS ── */}
      <DeviceChart
        title="BMS Data (24h)"
        icon={<Battery className="w-4 h-4 text-text-muted" />}
        series={bmsSeries ?? []}
        lines={[
          { key: 'BMS_B_V1', color: '#22c55e', name: 'Voltage (V)' },
          { key: 'BMS_B_C1', color: '#f97316', name: 'Current (A)' },
          { key: 'BMST', color: '#ef4444', name: 'Temp (°C)' },
          { key: 'BMS_SOC', color: '#3b82f6', name: 'SoC (%)', axis: 'right' },
        ]}
        rightAxis={{ domain: [0, 100], formatter: (v) => `${v}%` }}
      />

      {/* ── Load per Phase ── */}
      <DeviceChart
        title="Load per Phase (24h)"
        icon={<Home className="w-4 h-4 text-text-muted" />}
        series={loadSeries ?? []}
        lines={[
          { key: 'C_P_L1', color: '#f97316', name: 'Phase A' },
          { key: 'C_P_L2', color: '#3b82f6', name: 'Phase B' },
          { key: 'C_P_L3', color: '#22c55e', name: 'Phase C' },
          { key: 'E_Puse_t1', color: '#78716c', name: 'Total' },
        ]}
        yFormatter={(v) => `${v}W`}
      />

      </div>

      {/* ── Device Info ── */}
      <DeviceInfo device={device} />
    </div>
  );
}

function DeviceInfo({ device }: { device: DeviceCurrent | null }) {
  const d = device?.data;
  if (!d) return null;

  const sections = [
    {
      title: 'Inverter',
      items: [
        { label: 'SN', key: 'SN1' },
        { label: 'Type', key: 'INV_MOD1' },
        { label: 'Rated Power', key: 'Pr1' },
        { label: 'Protocol', key: 'PTCv1' },
        { label: 'Firmware (MAIN)', key: 'MAIN' },
        { label: 'Firmware (HMI)', key: 'HMI' },
      ],
    },
    {
      title: 'Battery',
      items: [
        { label: 'Type', key: 'B_TYP1' },
        { label: 'Manufacturer', key: 'BAT_FAC' },
        { label: 'Rated Capacity', key: 'BRC' },
        { label: 'Li-Battery FW', key: 'LBVN' },
      ],
    },
  ];

  return (
    <div className="bg-surface rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Info className="w-4 h-4 text-text-muted" />
        <h3 className="text-sm font-semibold text-text">Device Information</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sections.map(section => (
          <div key={section.title}>
            <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">{section.title}</h4>
            <div className="space-y-1">
              {section.items.map(item => {
                const val = d[item.key];
                return (
                  <div key={item.key} className="flex justify-between text-xs">
                    <span className="text-text-muted">{item.label}</span>
                    <span className="text-text font-medium">
                      {val ? `${val.value}${val.unit ? ` ${val.unit}` : ''}` : '—'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
