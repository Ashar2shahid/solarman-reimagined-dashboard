import { Zap, ArrowUpRight, Calendar, Leaf } from 'lucide-react';
import type { RealtimeSnapshot, StationInfo, EnergySaved } from '@/lib/api';
import { formatEnergy, formatPower } from '@/lib/utils';

interface StatsCardsProps {
  realtime: RealtimeSnapshot | null;
  station: StationInfo | null;
  energySaved: EnergySaved | null;
}

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  color: string;
}) {
  return (
    <div className="bg-surface rounded-2xl p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-text-muted">{label}</span>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
      </div>
      <div>
        <div className="text-2xl font-bold text-text">{value}</div>
        {sub && <div className="text-xs text-text-muted mt-1">{sub}</div>}
      </div>
    </div>
  );
}

export function StatsCards({ realtime, station, energySaved }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        icon={Zap}
        label="Production Today"
        value={formatEnergy(realtime?.generationValue)}
        sub={`Now: ${formatPower(realtime?.generationPower)}`}
        color="bg-solar"
      />
      <StatCard
        icon={ArrowUpRight}
        label="Grid Feed-in"
        value={formatEnergy(realtime?.gridValue)}
        sub={`Month: ${formatEnergy(station?.gridMonth)}`}
        color="bg-grid"
      />
      <StatCard
        icon={Calendar}
        label="Consumption Today"
        value={formatEnergy(realtime?.useValue)}
        sub={`Now: ${formatPower(realtime?.usePower)}`}
        color="bg-consumption"
      />
      <StatCard
        icon={Leaf}
        label="CO₂ Prevented"
        value={energySaved?.co2Reduced ? `${(energySaved.co2Reduced / 1000).toFixed(1)}kT` : '—'}
        sub={energySaved?.treesPlanted ? `${Math.round(energySaved.treesPlanted).toLocaleString()} trees` : undefined}
        color="bg-battery"
      />
    </div>
  );
}
