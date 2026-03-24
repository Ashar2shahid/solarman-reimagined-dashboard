import { useState } from 'react';
import { useRealtime } from '@/hooks/use-realtime';
import { usePolling } from '@/hooks/use-polling';
import { api, type DeviceCurrent, type RealtimeSnapshot, type DailyRecord } from '@/lib/api';
import { formatEnergy } from '@/lib/utils';
import { FlowChart } from '@/components/dashboard/flow-chart';
import { DailyCurve } from '@/components/dashboard/daily-curve';
import { BatteryCard } from '@/components/dashboard/battery-card';
import { WeatherCard } from '@/components/dashboard/weather-card';
import { Thermometer, ArrowUpRight } from 'lucide-react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { PeriodRecord } from '@/lib/api';

function getStaleColor(timestamp: number | null | undefined): string {
  if (!timestamp) return 'text-text-muted';
  const mins = (Date.now() / 1000 - timestamp) / 60;
  if (mins < 5) return 'text-text-muted';      // grey — fresh
  if (mins < 10) return 'text-yellow-600';      // yellow — slightly stale
  if (mins < 30) return 'text-orange-500';      // orange — getting old
  return 'text-red-500';                        // red — very stale
}

export function Dashboard() {
  const { data: realtime } = useRealtime(10_000);
  const { data: station } = usePolling(() => api.station(), 10_000);
  const { data: energySaved } = usePolling(() => api.energySaved(), 60_000);
  const { data: device } = usePolling(() => api.device.current(), 10_000);
  const { data: weather } = usePolling(() => api.weather(), 300_000);

  const today = new Date().toISOString().split('T')[0];
  const { data: daily } = usePolling(() => api.history.daily(today), 60_000);
  const now = new Date();
  const { data: monthly } = usePolling(
    () => api.history.monthly(now.getFullYear(), now.getMonth() + 1), 300_000
  );

  return (
    <div className="space-y-6">
      {/* ── Hero: Title + House + Sidebar Cards ── */}
      {/* Mobile: stacked. Desktop: 3-column grid */}
      <div className="flex flex-col lg:grid lg:grid-cols-12 gap-4 lg:items-start">
        {/* Left: Title + CO2 */}
        <div className="lg:col-span-3 pt-2">
          <div className="flex justify-between items-start lg:block">
            <div>
              <div className={`text-xs mb-1 font-medium ${getStaleColor(realtime?.timestamp)}`}>
                {realtime?.timestamp
                  ? `Last updated: ${new Date(realtime.timestamp * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}`
                  : 'Connecting...'}
              </div>
              <h1 className="text-2xl lg:text-3xl font-bold text-text leading-tight">{station?.name ?? 'Solar Panel'}</h1>
              <h1 className="text-2xl lg:text-3xl font-bold text-text leading-tight">management</h1>
            </div>
            <div className="text-right lg:hidden text-xs text-text-muted">
              <div>{station?.installedCapacity ? `${station.installedCapacity} kWp` : ''}</div>
              <div>{station?.locationAddress}</div>
            </div>
          </div>

          {/* Temperature Card — hidden on mobile */}
          <TemperatureCard device={device} className="hidden lg:block mt-6" />
        </div>

        {/* Center: House Energy Flow — full width on mobile */}
        <div className="lg:col-span-6">
          <FlowChart data={realtime} />
        </div>

        {/* Right: Battery + info — full width on mobile */}
        <div className="lg:col-span-3 pt-0 lg:pt-2">
          <div className="hidden lg:block text-right text-xs text-text-muted mb-1">
            {station?.installedCapacity ? `${station.installedCapacity} kWp` : ''}
          </div>
          <div className="hidden lg:block text-right text-xs text-text-muted">{station?.locationAddress}</div>

          <div className="lg:mt-6">
            <BatteryCard data={realtime} />
          </div>
        </div>
      </div>

      {/* Temperature card — mobile only */}
      <TemperatureCard device={device} className="lg:hidden" />

      {/* ── Bottom Cards Row ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Energy Balance — left */}
        <EnergyBalanceCard
          generated={realtime?.generationValue ?? 0}
          consumed={realtime?.useValue ?? 0}
        />

        {/* Energy Overview — center, with mini chart */}
        <EnergyOverviewCard
          realtime={realtime}
          dailyRecords={daily?.records ?? []}
          monthlyRecords={monthly?.records ?? []}
        />

        {/* Weather — right */}
        <WeatherCard weather={weather ?? []} />
      </div>

      {/* ── 24hr Curve ── */}
      <DailyCurve records={daily?.records ?? []} />
    </div>
  );
}

function EnergyOverviewCard({ realtime, dailyRecords, monthlyRecords }: {
  realtime: RealtimeSnapshot | null;
  dailyRecords: DailyRecord[];
  monthlyRecords: PeriodRecord[];
}) {
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('day');

  let chartData: { label: string; production: number; consumed: number }[] = [];
  let totalProduction = 0;
  let totalConsumed = 0;

  if (period === 'day') {
    // Use 24hr curve data, group by hour
    const hourMap = new Map<string, { production: number; consumed: number; count: number }>();
    for (const r of dailyRecords) {
      const hour = new Date(r.timestamp * 1000).toLocaleTimeString('en', { hour: '2-digit', hour12: true });
      const entry = hourMap.get(hour) ?? { production: 0, consumed: 0, count: 0 };
      entry.production += (r.generationPower ?? 0) / 1000;
      entry.consumed += (r.usePower ?? 0) / 1000;
      entry.count++;
      hourMap.set(hour, entry);
    }
    chartData = Array.from(hourMap.entries()).map(([label, v]) => ({
      label,
      production: v.count ? v.production / v.count : 0,
      consumed: v.count ? v.consumed / v.count : 0,
    }));
    totalProduction = realtime?.generationValue ?? 0;
    totalConsumed = realtime?.useValue ?? 0;
  } else if (period === 'week') {
    chartData = monthlyRecords.slice(-7).map(r => ({
      label: new Date(r.year, r.month - 1, r.day).toLocaleDateString('en', { weekday: 'short' }),
      production: r.generationValue ?? 0,
      consumed: r.useValue ?? 0,
    }));
    totalProduction = chartData.reduce((s, d) => s + d.production, 0);
    totalConsumed = chartData.reduce((s, d) => s + d.consumed, 0);
  } else {
    chartData = monthlyRecords.map(r => ({
      label: `${r.day}`,
      production: r.generationValue ?? 0,
      consumed: r.useValue ?? 0,
    }));
    totalProduction = chartData.reduce((s, d) => s + d.production, 0);
    totalConsumed = chartData.reduce((s, d) => s + d.consumed, 0);
  }

  return (
    <div className="bg-surface rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-text-muted">Energy Overview</span>
        <div className="flex gap-1">
          {(['day', 'week', 'month'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`text-[10px] px-2 py-0.5 rounded capitalize transition-colors ${
                period === p ? 'bg-text text-surface font-semibold' : 'text-text-muted bg-surface-warm'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="text-3xl font-bold text-text mt-2">
        {formatEnergy(totalProduction)}
      </div>

      {/* Mini area chart */}
      <div className="mt-2" style={{ height: 80 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gradProd" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f97316" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#f97316" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#78716c' }} tickLine={false} axisLine={false}
              interval={period === 'day' ? 3 : period === 'month' ? 4 : 0} />
            <Tooltip
              contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e7e5e4', background: '#fff', padding: '4px 8px' }}
              formatter={(value: number) => [`${value.toFixed(1)} ${period === 'day' ? 'kW' : 'kWh'}`]}
            />
            <Area type="monotone" dataKey="production" stroke="#f97316" fill="url(#gradProd)" strokeWidth={2} dot={false} />
            <Area type="monotone" dataKey="consumed" stroke="#a8a29e" fill="none" strokeWidth={1.5} dot={false} strokeDasharray="4 3" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex justify-between text-[11px] text-text-muted mt-1">
        <span>Production: <strong className="text-text">{formatEnergy(totalProduction)}</strong></span>
        <span>Consumed: <strong className="text-text">{formatEnergy(totalConsumed)}</strong></span>
      </div>
    </div>
  );
}

function TemperatureCard({ device, className = '' }: { device: DeviceCurrent | null; className?: string }) {
  const batteryTemp = device?.data?.['B_T1']?.value;
  const inverterTemp = device?.data?.['AC_T']?.value;

  const getTempColor = (temp: number) => {
    if (temp < 30) return 'text-emerald-600';
    if (temp < 40) return 'text-amber-500';
    if (temp < 50) return 'text-orange-600';
    return 'text-red-600';
  };

  const bt = batteryTemp ? parseFloat(batteryTemp) : null;
  const it = inverterTemp ? parseFloat(inverterTemp) : null;

  return (
    <div className={`bg-surface rounded-2xl p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-text-muted">Temperature</span>
        <Thermometer className="w-3.5 h-3.5 text-text-muted" />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-text-muted">Battery</span>
          <span className={`text-lg font-bold ${bt ? getTempColor(bt) : 'text-text-muted'}`}>
            {bt ? `${bt}°C` : '—'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-text-muted">Inverter</span>
          <span className={`text-lg font-bold ${it ? getTempColor(it) : 'text-text-muted'}`}>
            {it ? `${it}°C` : '—'}
          </span>
        </div>
      </div>
    </div>
  );
}

function EnergyBalanceCard({ generated, consumed }: { generated: number; consumed: number }) {
  const total = generated + consumed || 1;
  const ratio = generated / total;
  const angle = ratio * 180;
  const r = 50;
  const cx = 60, cy = 60;

  const arc = (startAngle: number, endAngle: number) => {
    const s = (startAngle - 90) * (Math.PI / 180);
    const e = (endAngle - 90) * (Math.PI / 180);
    const x1 = cx + r * Math.cos(s);
    const y1 = cy + r * Math.sin(s);
    const x2 = cx + r * Math.cos(e);
    const y2 = cy + r * Math.sin(e);
    const large = endAngle - startAngle > 180 ? 1 : 0;
    return `M${x1},${y1} A${r},${r} 0 ${large} 1 ${x2},${y2}`;
  };

  return (
    <div className="bg-surface rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-text-muted">Energy Balance</span>
        <ArrowUpRight className="w-4 h-4 text-text-muted" />
      </div>
      <div className="flex justify-start gap-4 text-[11px] text-text-muted mt-1">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-sm bg-primary" /> Generated
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-sm bg-gray-200" /> Consumed
        </span>
      </div>
      <div className="flex items-center justify-center py-3">
        <svg width={120} height={70} viewBox="0 0 120 70">
          <path d={arc(-90, 90)} fill="none" stroke="#e7e5e4" strokeWidth={8} strokeLinecap="round" />
          <path d={arc(-90, -90 + angle)} fill="none" stroke="#f97316" strokeWidth={8} strokeLinecap="round" />
        </svg>
      </div>
      <div className="flex justify-center gap-6 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-primary" />
          <strong className="text-text">{formatEnergy(generated)}</strong>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-gray-300" />
          <strong className="text-text">{formatEnergy(consumed)}</strong>
        </span>
      </div>
    </div>
  );
}
