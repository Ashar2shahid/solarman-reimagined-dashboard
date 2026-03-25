import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { DailyRecord } from '@/lib/api';

interface DailyCurveProps {
  records: DailyRecord[];
}

export function DailyCurve({ records }: DailyCurveProps) {
  // Build a full 24-hour axis (every 5 min = 288 slots)
  const hourLabels: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 5) {
      hourLabels.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }
  }

  // Index actual records by HH:MM
  const dataByTime = new Map<string, DailyRecord>();
  for (const r of records) {
    const d = new Date(r.timestamp * 1000);
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(Math.floor(d.getMinutes() / 5) * 5).padStart(2, '0');
    dataByTime.set(`${hh}:${mm}`, r);
  }

  const chartData = hourLabels.map(time => {
    const r = dataByTime.get(time);
    return {
      time,
      production: r ? (r.generationPower ?? 0) / 1000 : null,
      consumption: r ? (r.usePower ?? 0) / 1000 : null,
    };
  });

  // Show ticks every 3 hours
  const tickValues = ['00:00', '03:00', '06:00', '09:00', '12:00', '15:00', '18:00', '21:00', '24:00'];

  return (
    <div className="bg-surface rounded-2xl p-5">
      <h3 className="text-sm font-semibold text-text mb-4">24-Hour Curve</h3>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="gradSolar" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#eab308" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#eab308" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradConsumption" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f97316" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#f97316" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="time"
            tick={{ fontSize: 10, fill: '#78716c' }}
            tickLine={false}
            axisLine={false}
            ticks={tickValues}
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#78716c' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${v}kW`}
          />
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 12, border: '1px solid #e7e5e4', background: '#fff' }}
            formatter={(value: number | null, name: string) => [value !== null ? `${value.toFixed(2)} kW` : '—', name]}
          />
          <Legend
            wrapperStyle={{ fontSize: 11 }}
            iconType="circle"
            iconSize={8}
          />
          <Area
            type="monotone"
            dataKey="production"
            name="Production"
            stroke="#eab308"
            fill="url(#gradSolar)"
            strokeWidth={2}
            dot={false}
            connectNulls={false}
          />
          <Area
            type="monotone"
            dataKey="consumption"
            name="Consumption"
            stroke="#f97316"
            fill="url(#gradConsumption)"
            strokeWidth={2}
            dot={false}
            connectNulls={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
