import { ArrowUpRight } from 'lucide-react';
import type { RealtimeSnapshot } from '@/lib/api';
import { formatPower } from '@/lib/utils';

interface BatteryCardProps {
  data: RealtimeSnapshot | null;
}

export function BatteryCard({ data }: BatteryCardProps) {
  const soc = data?.batterySoc ?? 0;
  const status = data?.batteryStatus ?? 'STATIC';
  const charge = data?.chargePower ?? 0;
  const discharge = data?.dischargePower ?? 0;

  const statusLabel = status === 'CHARGE' ? 'Charging' : status === 'DISCHARGE' ? 'Discharging' : 'Idle';
  const power = status === 'CHARGE' ? charge : status === 'DISCHARGE' ? discharge : 0;
  const socColor = soc > 50 ? 'bg-battery' : soc > 20 ? 'bg-solar' : 'bg-red-500';

  return (
    <div className="bg-surface rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-text-muted">Battery Status</span>
        <ArrowUpRight className="w-4 h-4 text-text-muted" />
      </div>

      <div className="mt-3">
        <div className="flex items-center gap-2 text-xs text-text-muted mb-3">
          <span className={`w-2 h-2 rounded-full ${status === 'CHARGE' ? 'bg-battery' : status === 'DISCHARGE' ? 'bg-consumption' : 'bg-text-muted'}`} />
          <span>{statusLabel}{power > 0 ? ` · ${formatPower(power)}` : ''}</span>
        </div>

        {/* Horizontal battery bar */}
        <div className="relative h-10 bg-surface-warm rounded-xl overflow-hidden">
          <div
            className={`h-full ${socColor} rounded-xl transition-all duration-700 flex items-center justify-center`}
            style={{ width: `${soc}%` }}
          >
            <span className="text-white text-sm font-bold">{soc}%</span>
          </div>
        </div>
      </div>

      <div className="flex justify-between text-[11px] text-text-muted mt-3">
        <span>Charged: {(data?.chargeValue ?? 0).toFixed(1)} kWh</span>
        <span>Discharged: {(data?.dischargeValue ?? 0).toFixed(1)} kWh</span>
      </div>
    </div>
  );
}
