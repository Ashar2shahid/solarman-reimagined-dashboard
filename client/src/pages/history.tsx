import { useState, useRef, useEffect } from 'react';
import { usePolling } from '@/hooks/use-polling';
import { api, type PeriodRecord } from '@/lib/api';
import {
  BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid,
} from 'recharts';
import { formatEnergy } from '@/lib/utils';
import { Zap, TrendingUp, Battery, Leaf, DollarSign, Sun, Calendar, ChevronDown } from 'lucide-react';

type TimeFrame = 'week' | 'month' | 'year' | 'all' | 'custom';

function formatDateRange(from: Date, to: Date): string {
  const sameMonth = from.getMonth() === to.getMonth() && from.getFullYear() === to.getFullYear();
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
  if (sameMonth) {
    return `${from.getDate()} - ${to.toLocaleDateString('en', opts)}`;
  }
  return `${from.toLocaleDateString('en', { day: 'numeric', month: 'short' })} - ${to.toLocaleDateString('en', opts)}`;
}

function TimeFrameSelector({ value, onChange, dateRange, onDateRangeChange }: {
  value: TimeFrame;
  onChange: (v: TimeFrame) => void;
  dateRange: { from: string; to: string };
  onDateRangeChange: (from: string, to: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const presets: { label: string; value: TimeFrame }[] = [
    { label: 'Week', value: 'week' },
    { label: 'Month', value: 'month' },
    { label: 'Year', value: 'year' },
    { label: 'All Time', value: 'all' },
  ];

  const displayLabel = value === 'custom'
    ? formatDateRange(new Date(dateRange.from), new Date(dateRange.to))
    : presets.find(p => p.value === value)?.label ?? '';

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-4 py-2 bg-surface rounded-full border border-border text-sm text-text hover:bg-surface-warm transition-colors"
      >
        <Calendar className="w-3.5 h-3.5 text-text-muted" />
        <span>{displayLabel}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-text-muted transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 bg-surface rounded-xl border border-border shadow-lg p-3 z-50 min-w-[260px]">
          {/* Presets */}
          <div className="flex gap-1 mb-3">
            {presets.map(p => (
              <button
                key={p.value}
                onClick={() => { onChange(p.value); setOpen(false); }}
                className={`text-xs px-3 py-1 rounded-full transition-colors ${
                  value === p.value ? 'bg-text text-surface font-semibold' : 'text-text-muted bg-surface-warm hover:bg-border'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Custom date range */}
          <div className="border-t border-border pt-3">
            <div className="text-[10px] text-text-muted uppercase tracking-wider mb-2">Custom Range</div>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={dateRange.from}
                onChange={(e) => {
                  onDateRangeChange(e.target.value, dateRange.to);
                  onChange('custom');
                }}
                className="text-xs bg-surface-warm rounded-lg px-2 py-1.5 border border-border text-text w-full"
              />
              <span className="text-xs text-text-muted">to</span>
              <input
                type="date"
                value={dateRange.to}
                onChange={(e) => {
                  onDateRangeChange(dateRange.from, e.target.value);
                  onChange('custom');
                }}
                className="text-xs bg-surface-warm rounded-lg px-2 py-1.5 border border-border text-text w-full"
              />
            </div>
            <button
              onClick={() => { onChange('custom'); setOpen(false); }}
              className="mt-2 w-full text-xs py-1.5 rounded-lg bg-text text-surface font-medium hover:opacity-90 transition-opacity"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function useHistoryData(timeFrame: TimeFrame, dateRange: { from: string; to: string }) {
  const now = new Date();
  const { data: monthly } = usePolling(
    () => api.history.monthly(now.getFullYear(), now.getMonth() + 1), 300_000
  );
  const { data: prevMonthly } = usePolling(
    () => api.history.monthly(
      now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear(),
      now.getMonth() === 0 ? 12 : now.getMonth()
    ), 300_000
  );
  const { data: yearly } = usePolling(
    () => api.history.yearly(now.getFullYear()), 300_000
  );
  const { data: lifetime } = usePolling(() => api.history.lifetime(), 300_000);

  let records: PeriodRecord[] = [];
  let labelFn: (r: PeriodRecord) => string = () => '';

  if (timeFrame === 'week') {
    const allDays = [...(prevMonthly?.records ?? []), ...(monthly?.records ?? [])];
    records = allDays.slice(-7);
    labelFn = (r) => new Date(r.year, r.month - 1, r.day).toLocaleDateString('en', { weekday: 'short', day: 'numeric' });
  } else if (timeFrame === 'month') {
    records = monthly?.records ?? [];
    labelFn = (r) => `${r.day}`;
  } else if (timeFrame === 'year') {
    records = yearly?.records ?? [];
    labelFn = (r) => new Date(r.year, r.month - 1).toLocaleDateString('en', { month: 'short' });
  } else if (timeFrame === 'all') {
    records = lifetime?.records ?? [];
    labelFn = (r) => `${r.year}`;
  } else if (timeFrame === 'custom') {
    // Filter all daily data from both months to the custom range
    const allDays = [...(prevMonthly?.records ?? []), ...(monthly?.records ?? [])];
    records = allDays.filter(r => {
      const d = `${r.year}-${String(r.month).padStart(2, '0')}-${String(r.day).padStart(2, '0')}`;
      return d >= dateRange.from && d <= dateRange.to;
    });
    labelFn = (r) => new Date(r.year, r.month - 1, r.day).toLocaleDateString('en', { day: 'numeric', month: 'short' });
  }

  return { records, labelFn, lifetime: lifetime?.records ?? [] };
}

function StatCard({ icon, label, value, sub, color }: {
  icon: React.ReactNode; label: string; value: string; sub?: string; color?: string;
}) {
  return (
    <div className="bg-surface rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs text-text-muted">{label}</span>
      </div>
      <div className={`text-2xl font-bold ${color ?? 'text-text'}`}>{value}</div>
      {sub && <div className="text-[11px] text-text-muted mt-1">{sub}</div>}
    </div>
  );
}

export function HistoryPage() {
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('month');
  const now = new Date();
  const [dateRange, setDateRange] = useState({
    from: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0],
    to: now.toISOString().split('T')[0],
  });
  const { records, labelFn } = useHistoryData(timeFrame, dateRange);
  const { data: lifetime } = usePolling(() => api.history.lifetime(), 300_000);
  const { data: station } = usePolling(() => api.station(), 60_000);
  const lifetimeData = lifetime?.records ?? [];

  const chartData = records.map(r => ({
    label: labelFn(r),
    production: r.generationValue ?? 0,
    consumption: r.useValue ?? 0,
    gridFeed: r.gridValue ?? 0,
    gridBuy: r.buyValue ?? 0,
    charge: r.chargeValue ?? 0,
    discharge: r.dischargeValue ?? 0,
    income: r.incomeValue ?? 0,
    peakHours: r.fullPowerHoursDay ?? 0,
    selfUseRatio: r.generationValue && r.useValue
      ? Math.min(100, ((r.generationValue - (r.gridValue ?? 0)) / r.generationValue) * 100)
      : 0,
    savings: r.incomeValue ?? 0,
    netMetering: (r.gridValue ?? 0) - (r.buyValue ?? 0),
  }));

  const totals = chartData.reduce((acc, d) => ({
    production: acc.production + d.production,
    consumption: acc.consumption + d.consumption,
    gridFeed: acc.gridFeed + d.gridFeed,
    gridBuy: acc.gridBuy + d.gridBuy,
    charge: acc.charge + d.charge,
    discharge: acc.discharge + d.discharge,
    savings: acc.savings + d.savings,
  }), { production: 0, consumption: 0, gridFeed: 0, gridBuy: 0, charge: 0, discharge: 0, savings: 0 });

  const capacity = station?.installedCapacity ?? 12;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-text">History & Analytics</h2>
        <TimeFrameSelector
          value={timeFrame}
          onChange={setTimeFrame}
          dateRange={dateRange}
          onDateRangeChange={(from, to) => setDateRange({ from, to })}
        />
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <StatCard icon={<Sun className="w-4 h-4 text-yellow-500" />} label="Production" value={formatEnergy(totals.production)} color="text-yellow-600" />
        <StatCard icon={<Zap className="w-4 h-4 text-orange-500" />} label="Consumption" value={formatEnergy(totals.consumption)} color="text-orange-600" />
        <StatCard icon={<TrendingUp className="w-4 h-4 text-green-500" />} label="Grid Feed-in" value={formatEnergy(totals.gridFeed)} color="text-green-600" />
        <StatCard icon={<Zap className="w-4 h-4 text-blue-500" />} label="Grid Purchase" value={formatEnergy(totals.gridBuy)} color="text-blue-600" />
        <StatCard icon={<DollarSign className="w-4 h-4 text-emerald-500" />} label="Savings" value={`₹${totals.savings.toFixed(0)}`} color="text-emerald-600" />
        <StatCard icon={<Battery className="w-4 h-4 text-green-500" />} label="Battery Cycles" value={`${(totals.discharge / 15.9).toFixed(1)} cycles`} sub={`${totals.charge.toFixed(0)} / ${totals.discharge.toFixed(0)} kWh (charge/discharge)`} />
      </div>

      {/* Charts — 2 per row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Production vs Consumption */}
        <ChartCard title="Production vs Consumption" icon={<Zap className="w-4 h-4 text-text-muted" />}>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#78716c' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#78716c' }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}kWh`} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [`${Number(v).toFixed(1)} kWh`]} />
              <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" iconSize={8} />
              <Bar dataKey="production" name="Production" fill="#eab308" radius={[3, 3, 0, 0]} />
              <Bar dataKey="consumption" name="Consumption" fill="#f97316" radius={[3, 3, 0, 0]} opacity={0.7} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Grid Feed-in vs Purchase (Net Metering) */}
        <ChartCard title="Grid Feed-in vs Purchase" icon={<TrendingUp className="w-4 h-4 text-text-muted" />}>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#78716c' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#78716c' }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}kWh`} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [`${Number(v).toFixed(1)} kWh`]} />
              <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" iconSize={8} />
              <Bar dataKey="gridFeed" name="Feed-in (Export)" fill="#22c55e" radius={[3, 3, 0, 0]} />
              <Bar dataKey="gridBuy" name="Purchase (Import)" fill="#3b82f6" radius={[3, 3, 0, 0]} opacity={0.7} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Self-Sufficiency Ratio */}
        <ChartCard title="Self-Use Ratio" icon={<Sun className="w-4 h-4 text-text-muted" />}>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="gradSelfUse" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#78716c' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#78716c' }} tickLine={false} axisLine={false} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [`${Number(v).toFixed(1)}%`]} />
              <Area type="monotone" dataKey="selfUseRatio" name="Self-Use Ratio" stroke="#22c55e" fill="url(#gradSelfUse)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Battery Charge vs Discharge */}
        <ChartCard title="Battery Charge vs Discharge" icon={<Battery className="w-4 h-4 text-text-muted" />}>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#78716c' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#78716c' }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}kWh`} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [`${Number(v).toFixed(1)} kWh`]} />
              <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" iconSize={8} />
              <Bar dataKey="charge" name="Charge" fill="#22c55e" radius={[3, 3, 0, 0]} />
              <Bar dataKey="discharge" name="Discharge" fill="#f97316" radius={[3, 3, 0, 0]} opacity={0.7} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Peak Sun Hours / Yield */}
        <ChartCard title="Peak Sun Hours & Yield" icon={<Sun className="w-4 h-4 text-text-muted" />}>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData.map(d => ({ ...d, yield: d.production / capacity }))} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#78716c' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#78716c' }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}h`} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: any, name: any) => [`${Number(v).toFixed(1)} ${String(name).includes('Yield') ? 'kWh/kWp' : 'h'}`]} />
              <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" iconSize={8} />
              <Bar dataKey="peakHours" name="Peak Hours" fill="#eab308" radius={[3, 3, 0, 0]} />
              <Bar dataKey="yield" name="Yield (kWh/kWp)" fill="#f97316" radius={[3, 3, 0, 0]} opacity={0.7} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Savings */}
        <ChartCard title="Electricity Savings" icon={<DollarSign className="w-4 h-4 text-text-muted" />}>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#78716c' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#78716c' }} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v}`} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [`₹${Number(v).toFixed(0)}`]} />
              <Bar dataKey="savings" name="Savings (₹)" fill="#16a34a" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Net Metering */}
        <ChartCard title="Net Metering (Export - Import)" icon={<TrendingUp className="w-4 h-4 text-text-muted" />}>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#78716c' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#78716c' }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}kWh`} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [`${Number(v).toFixed(1)} kWh`]} />
              <Bar dataKey="netMetering" name="Net (Export - Import)" fill="#8b5cf6" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* CO2 & Environmental */}
        <ChartCard title="Environmental Impact" icon={<Leaf className="w-4 h-4 text-text-muted" />}>
          <EnvironmentalCard lifetimeRecords={lifetimeData} />
        </ChartCard>
      </div>
    </div>
  );
}

const tooltipStyle = { fontSize: 12, borderRadius: 12, border: '1px solid #e7e5e4', background: '#fff' };

function ChartCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-surface rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h3 className="text-sm font-semibold text-text">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function EnvironmentalCard({ lifetimeRecords }: { lifetimeRecords: PeriodRecord[] }) {
  // Calculate from our own stored data, not the inflated Solarman API values
  const totalGen = lifetimeRecords.reduce((s, r) => s + (r.generationValue ?? 0), 0);
  const totalIncome = lifetimeRecords.reduce((s, r) => s + (r.incomeValue ?? 0), 0);

  // Standard conversion factors (India grid)
  const co2Kg = totalGen * 0.82;        // kg CO2 per kWh
  const coalKg = totalGen * 0.4;         // kg coal per kWh
  const trees = totalGen / 60;           // ~60 kWh offsets 1 tree/year

  const fmt = (v: number, unit: string) => {
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M ${unit}`;
    if (v >= 1_000) return `${(v / 1_000).toFixed(1)}k ${unit}`;
    return `${v.toFixed(0)} ${unit}`;
  };

  const items = [
    { label: 'Total Generation', value: formatEnergy(totalGen), color: 'text-yellow-600' },
    { label: 'CO₂ Reduced', value: fmt(co2Kg, 'kg'), color: 'text-green-600' },
    { label: 'Coal Saved', value: fmt(coalKg, 'kg'), color: 'text-amber-600' },
    { label: 'Trees Equivalent', value: `${trees.toFixed(0)} trees/yr`, color: 'text-green-600' },
    { label: 'Total Savings', value: `₹${totalIncome >= 100_000 ? (totalIncome / 100_000).toFixed(1) + 'L' : totalIncome.toFixed(0)}`, color: 'text-emerald-600' },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map(item => (
        <div key={item.label} className="bg-surface-warm rounded-xl p-3">
          <div className="text-[11px] text-text-muted">{item.label}</div>
          <div className={`text-lg font-bold ${item.color}`}>{item.value}</div>
        </div>
      ))}
    </div>
  );
}
