import React from 'react';

export interface TrendPoint {
  time: string;
  value: number;
}

interface TrendChartProps {
  data: {
    series: TrendPoint[];
    label?: string;
    unit?: string;
    color?: string;
    setpoint?: number;
    minRange?: number;
    maxRange?: number;
  };
}

export function TrendChart({ data }: TrendChartProps) {
  const { series, label, unit = '', color = '#3b82f6', setpoint, minRange, maxRange } = data;
  if (!series || !series.length) return null;

  const values = series.map(p => p.value);
  const min = minRange ?? Math.min(...values) * 0.95;
  const max = maxRange ?? Math.max(...values) * 1.05;
  const range = max - min || 1;

  const width = 280;
  const height = 120;
  const padX = 32;
  const padY = 16;
  const chartW = width - padX * 2;
  const chartH = height - padY * 2;

  const points = series.map((p, i) => {
    const x = padX + (i / (series.length - 1)) * chartW;
    const y = padY + chartH - ((p.value - min) / range) * chartH;
    return { x, y, ...p };
  });

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  // Area fill
  const areaD = pathD + ` L ${points[points.length - 1].x} ${padY + chartH} L ${points[0].x} ${padY + chartH} Z`;

  return (
    <div>
      {label && <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--fc-node-desc)', marginBottom: 4 }}>{label} {unit && `(${unit})`}</div>}
      <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{ display: 'block' }}>
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map(frac => {
          const y = padY + chartH * (1 - frac);
          const val = min + range * frac;
          return (
            <g key={frac}>
              <line x1={padX} y1={y} x2={width - padX} y2={y} stroke="var(--fc-node-section-border, #f0f0f0)" strokeWidth={1} />
              <text x={padX - 4} y={y + 3} textAnchor="end" fontSize={8} fill="var(--fc-node-desc, #888)">{val.toFixed(0)}</text>
            </g>
          );
        })}

        {/* Setpoint line */}
        {setpoint !== undefined && (
          <line
            x1={padX} y1={padY + chartH - ((setpoint - min) / range) * chartH}
            x2={width - padX} y2={padY + chartH - ((setpoint - min) / range) * chartH}
            stroke="#ef4444" strokeWidth={1} strokeDasharray="4 3"
          />
        )}

        {/* Area */}
        <path d={areaD} fill={color} opacity={0.08} />

        {/* Line */}
        <path d={pathD} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

        {/* Points */}
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={2.5} fill={color} />
        ))}

        {/* Time labels */}
        {series.filter((_, i) => i % Math.max(1, Math.floor(series.length / 5)) === 0 || i === series.length - 1).map((p, i) => {
          const idx = series.indexOf(p);
          const x = padX + (idx / (series.length - 1)) * chartW;
          return <text key={i} x={x} y={height - 2} textAnchor="middle" fontSize={8} fill="var(--fc-node-desc, #888)">{p.time}</text>;
        })}
      </svg>
    </div>
  );
}
