import type { RealtimeSnapshot } from '@/lib/api';
import { formatPower } from '@/lib/utils';
import houseImg from '@/assets/Solar-house.png';

interface FlowChartProps {
  data: RealtimeSnapshot | null;
  debug?: boolean;
}

function FlowLine({ points, active, color, reverse }: {
  points: string;
  active: boolean;
  color: string;
  reverse?: boolean;
}) {
  return (
    <>
      {/* Always-visible base line: solid thin when idle, thicker translucent when active */}
      <polyline points={points} fill="none"
        stroke={active ? color : '#c4b9a8'} strokeWidth={active ? 3 : 2} strokeLinecap="round" strokeLinejoin="round"
        opacity={active ? 0.2 : 0.35}
      />
      {/* Animated dashed overlay when active */}
      {active && (
        <polyline points={points} fill="none"
          stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"
          className={reverse ? 'energy-flow-line-reverse' : 'energy-flow-line'}
        />
      )}
    </>
  );
}

export function FlowChart({ data, debug = false }: FlowChartProps) {
  const gen = data?.generationPower ?? 0;
  const use = data?.usePower ?? 0;
  const buy = data?.buyPower ?? 0;
  const gridFeed = data?.gridPower ?? 0;
  const soc = data?.batterySoc ?? 0;
  const charge = data?.chargePower ?? 0;
  const discharge = data?.dischargePower ?? 0;

  const isSelling = data?.wireStatus === 'GRID_CONNECTED';
  const isBuying = data?.wireStatus === 'PURCHASE';
  const isOffGrid = data?.wireStatus === 'STATIC' || (!isSelling && !isBuying);
  const isCharging = data?.batteryStatus === 'CHARGE';
  const isDischarging = data?.batteryStatus === 'DISCHARGE';

  // House image: x=80, y=30, w=400, h=280
  // From debug grid overlay:
  //   Solar panels top-center: (280, 130)
  //   Right windows center: (400, 200)
  //   Left garage battery box: (200, 210)
  //   Foundation bottom center: (320, 280)

  return (
    <svg viewBox="0 35 560 305" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
      {/* House image — shifted left and scaled up, left side crops off */}
      <image href={houseImg} x={0} y={10} width={560} height={390} />

      {/* Debug grid */}
      {debug && Array.from({length: 15}, (_, i) => i * 40).map(x =>
        Array.from({length: 10}, (_, j) => j * 40).map(y => (
          <g key={`${x}-${y}`}>
            <circle cx={x} cy={y} r={2} fill="red" opacity={0.5} />
            <text x={x+3} y={y-2} fontSize="6" fill="red" opacity={0.8}>{x},{y}</text>
          </g>
        ))
      )}

      {/* ═══ SOLAR ═══ */}
      <text x={280} y={50} textAnchor="middle" fontSize="18" fill={gen > 0 ? '#ca8a04' : '#a8a29e'} fontWeight={700}>
        {formatPower(gen)}
      </text>
      <text x={280} y={62} textAnchor="middle" fontSize="9" fill="#78716c" fontWeight={600} letterSpacing={1}>SOLAR</text>
      <FlowLine points="280,72 280,150" active={gen > 0} color="#eab308" />

      {/* ═══ HOME ═══ */}
      <text x={510} y={215} fontSize="18" fill={use > 0 ? '#ea580c' : '#a8a29e'} fontWeight={700} textAnchor="middle">
        {formatPower(use)}
      </text>
      <text x={510} y={228} fontSize="9" fill="#78716c" fontWeight={600} letterSpacing={1} textAnchor="middle">HOME</text>
      <FlowLine points="364,220 480,220" active={use > 0} color="#f97316" />

      {/* ═══ BATTERY ═══ */}
      <text x={35} y={280} fontSize="12" fill={soc > 20 ? '#16a34a' : '#ef4444'} fontWeight={700} textAnchor="start">
        {isCharging ? formatPower(charge) : isDischarging ? formatPower(discharge) : '0W'} · {soc}%
      </text>
      <text x={35} y={294} fontSize="9" fill="#78716c" fontWeight={600} letterSpacing={1} textAnchor="start">BATTERY</text>
      <FlowLine points="110,285 280,248"
        active={isCharging || isDischarging} color="#22c55e"
        reverse={isCharging} />
      {!isCharging && !isDischarging && (
        <FlowLine points="110,285 280,248" active={false} color="#22c55e" />
      )}

      {/* ═══ GRID ═══ */}
      <text x={318} y={325} textAnchor="middle" fontSize="12"
        fill={isOffGrid ? '#a8a29e' : isSelling ? '#16a34a' : '#2563eb'} fontWeight={700}>
        {isOffGrid ? 'OFF' : isSelling ? formatPower(data?.wirePower ?? 0) : formatPower(buy)}
      </text>
      <text x={318} y={338} textAnchor="middle" fontSize="9" fill="#78716c" fontWeight={600} letterSpacing={1}>
        {isOffGrid ? 'OFF-GRID' : isSelling ? 'EXPORTING' : 'GRID'}
      </text>
      <FlowLine points="318,248 318,308"
        active={!isOffGrid && (isSelling || buy > 0)}
        color={isSelling ? '#22c55e' : '#3b82f6'}
        reverse={isBuying} />
      {isOffGrid && (
        <FlowLine points="318,248 318,308" active={false} color="#a8a29e" />
      )}
    </svg>
  );
}
