import React from 'react';

interface MiniChartProps {
  data: {
    type?: 'bar' | 'line';
    values: number[];
    labels?: string[];
    color?: string;
    height?: number;
  };
}

export function MiniChart({ data }: MiniChartProps) {
  const { type = 'bar', values, labels, color = '#3b82f6', height = 100 } = data;
  const max = Math.max(...values, 1);
  const width = 280;
  const barWidth = Math.min(24, (width - 20) / values.length - 4);
  const padding = 20;

  if (type === 'line') {
    const points = values.map((v, i) => {
      const x = padding + (i / (values.length - 1)) * (width - padding * 2);
      const y = height - padding - (v / max) * (height - padding * 2);
      return `${x},${y}`;
    }).join(' ');

    return (
      <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{ display: 'block' }}>
        <polyline points={points} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        {values.map((v, i) => {
          const x = padding + (i / (values.length - 1)) * (width - padding * 2);
          const y = height - padding - (v / max) * (height - padding * 2);
          return <circle key={i} cx={x} cy={y} r={3} fill={color} />;
        })}
        {labels && labels.map((label, i) => {
          const x = padding + (i / (values.length - 1)) * (width - padding * 2);
          return <text key={i} x={x} y={height - 4} textAnchor="middle" fontSize={9} fill="var(--fc-node-desc, #888)">{label}</text>;
        })}
      </svg>
    );
  }

  // Bar chart
  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{ display: 'block' }}>
      {values.map((v, i) => {
        const x = padding + i * ((width - padding * 2) / values.length) + 2;
        const barH = (v / max) * (height - padding * 2);
        const y = height - padding - barH;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barWidth} height={barH} rx={3} fill={color} opacity={0.8} />
            {labels && labels[i] && <text x={x + barWidth / 2} y={height - 4} textAnchor="middle" fontSize={9} fill="var(--fc-node-desc, #888)">{labels[i]}</text>}
          </g>
        );
      })}
    </svg>
  );
}
