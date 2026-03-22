import React from 'react';

export interface GenerationSource {
  name: string;
  capacity: number;
  dispatched: number;
  marginalCost: number;
  color: string;
  type: string;
}

interface MeritOrderProps {
  data: {
    sources: GenerationSource[];
    totalDemand: number;
    unit?: string;
  };
}

export function MeritOrder({ data }: MeritOrderProps) {
  const { sources, totalDemand, unit = 'MW' } = data;
  // Sort by marginal cost (merit order)
  const sorted = [...sources].sort((a, b) => a.marginalCost - b.marginalCost);
  const totalCapacity = sorted.reduce((s, g) => s + g.capacity, 0);
  const totalDispatched = sorted.reduce((s, g) => s + g.dispatched, 0);

  const width = 280;
  const barHeight = 28;
  const height = sorted.length * (barHeight + 4) + 30;

  return (
    <div>
      <div style={{ fontSize: 10, color: 'var(--fc-node-desc)', marginBottom: 6 }}>
        Demand: <strong>{totalDemand} {unit}</strong> | Dispatched: <strong>{totalDispatched} {unit}</strong>
      </div>
      <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{ display: 'block' }}>
        {sorted.map((src, i) => {
          const y = i * (barHeight + 4);
          const capW = (src.capacity / totalCapacity) * (width - 60);
          const dispW = (src.dispatched / totalCapacity) * (width - 60);

          return (
            <g key={i}>
              {/* Capacity background */}
              <rect x={56} y={y} width={capW} height={barHeight} rx={4} fill={src.color} opacity={0.15} />
              {/* Dispatched foreground */}
              <rect x={56} y={y} width={dispW} height={barHeight} rx={4} fill={src.color} opacity={0.7} />
              {/* Label */}
              <text x={52} y={y + barHeight / 2 + 3} textAnchor="end" fontSize={9} fontWeight={600} fill="var(--fc-node-label, #1a1a1a)">{src.name}</text>
              {/* Value */}
              <text x={58 + dispW} y={y + barHeight / 2 + 3} fontSize={9} fill="var(--fc-node-label, #1a1a1a)" fontFamily="monospace">{src.dispatched} {unit}</text>
            </g>
          );
        })}
        {/* Demand line */}
        <line
          x1={56 + (totalDemand / totalCapacity) * (width - 60)}
          y1={0}
          x2={56 + (totalDemand / totalCapacity) * (width - 60)}
          y2={sorted.length * (barHeight + 4) - 4}
          stroke="#ef4444" strokeWidth={2} strokeDasharray="4 3"
        />
        <text
          x={56 + (totalDemand / totalCapacity) * (width - 60)}
          y={sorted.length * (barHeight + 4) + 12}
          textAnchor="middle" fontSize={9} fill="#ef4444" fontWeight={700}
        >Demand</text>
      </svg>
    </div>
  );
}
