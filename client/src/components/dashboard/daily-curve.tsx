import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { DailyRecord } from '@/lib/api';
import { unixToTime } from '@/lib/utils';

interface DailyCurveProps {
  records: DailyRecord[];
}

export function DailyCurve({ records }: DailyCurveProps) {
  const chartData = records.map(r => ({
    time: unixToTime(r.timestamp),
    production: (r.generationPower ?? 0) / 1000,
    consumption: (r.usePower ?? 0) / 1000,
    grid: (r.wirePower ?? 0) / 1000,
    soc: r.batterySoc ?? 0,
  }));

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
            interval={Math.floor(chartData.length / 8)}
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#78716c' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${v}kW`}
          />
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 12, border: '1px solid #e7e5e4', background: '#fff' }}
            formatter={(value: number, name: string) => [`${value.toFixed(2)} kW`, name]}
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
          />
          <Area
            type="monotone"
            dataKey="consumption"
            name="Consumption"
            stroke="#f97316"
            fill="url(#gradConsumption)"
            strokeWidth={2}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
