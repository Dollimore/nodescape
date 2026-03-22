import React, { useState } from 'react';

export interface LoadProfileData {
  daily?: { hour: number; load: number }[];
  weekly?: { day: string; load: number }[];
  monthly?: { month: string; load: number }[];
  peakLoad?: number;
  minLoad?: number;
  avgLoad?: number;
  unit?: string;
}

interface LoadProfileProps {
  data: LoadProfileData;
}

export function LoadProfile({ data }: LoadProfileProps) {
  const [view, setView] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const unit = data.unit || 'MW';

  const series = view === 'daily' ? data.daily
    : view === 'weekly' ? data.weekly?.map(d => ({ hour: 0, ...d }))
    : data.monthly?.map(d => ({ hour: 0, ...d }));

  if (!series || series.length === 0) return null;

  const values = series.map(s => s.load);
  const max = Math.max(...values) * 1.1;
  const width = 280;
  const height = 100;
  const padX = 8;
  const padY = 8;
  const barW = Math.min(16, (width - padX * 2) / series.length - 2);

  return (
    <div>
      <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
        {data.daily && <button onClick={() => setView('daily')} style={{
          fontSize: 10, fontWeight: view === 'daily' ? 700 : 500, padding: '2px 8px', borderRadius: 4,
          border: '1px solid var(--fc-node-border, #e0e0e0)', cursor: 'pointer',
          background: view === 'daily' ? '#3b82f6' : 'transparent', color: view === 'daily' ? '#fff' : 'var(--fc-node-desc)',
        }}>Daily</button>}
        {data.weekly && <button onClick={() => setView('weekly')} style={{
          fontSize: 10, fontWeight: view === 'weekly' ? 700 : 500, padding: '2px 8px', borderRadius: 4,
          border: '1px solid var(--fc-node-border, #e0e0e0)', cursor: 'pointer',
          background: view === 'weekly' ? '#3b82f6' : 'transparent', color: view === 'weekly' ? '#fff' : 'var(--fc-node-desc)',
        }}>Weekly</button>}
        {data.monthly && <button onClick={() => setView('monthly')} style={{
          fontSize: 10, fontWeight: view === 'monthly' ? 700 : 500, padding: '2px 8px', borderRadius: 4,
          border: '1px solid var(--fc-node-border, #e0e0e0)', cursor: 'pointer',
          background: view === 'monthly' ? '#3b82f6' : 'transparent', color: view === 'monthly' ? '#fff' : 'var(--fc-node-desc)',
        }}>Monthly</button>}
      </div>

      <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{ display: 'block' }}>
        {series.map((s, i) => {
          const x = padX + i * ((width - padX * 2) / series.length) + 1;
          const barH = (s.load / max) * (height - padY * 2);
          const y = height - padY - barH;
          const label = 'day' in s ? (s as any).day : 'month' in s ? (s as any).month : `${(s as any).hour}h`;
          return (
            <g key={i}>
              <rect x={x} y={y} width={barW} height={barH} rx={2} fill="#3b82f6" opacity={0.7} />
              <text x={x + barW / 2} y={height - 1} textAnchor="middle" fontSize={7} fill="var(--fc-node-desc, #888)">{label}</text>
            </g>
          );
        })}
      </svg>

      {(data.peakLoad || data.avgLoad || data.minLoad) && (
        <div style={{ display: 'flex', gap: 12, fontSize: 10, color: 'var(--fc-node-desc)', marginTop: 4 }}>
          {data.peakLoad && <span>Peak: <strong>{data.peakLoad} {unit}</strong></span>}
          {data.avgLoad && <span>Avg: <strong>{data.avgLoad} {unit}</strong></span>}
          {data.minLoad && <span>Min: <strong>{data.minLoad} {unit}</strong></span>}
        </div>
      )}
    </div>
  );
}
