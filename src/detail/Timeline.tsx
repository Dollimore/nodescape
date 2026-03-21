import React from 'react';

interface TimelineProps {
  data: Array<{
    time: string;
    event: string;
    status?: 'success' | 'warning' | 'error' | 'info';
  }>;
}

const statusColors: Record<string, string> = {
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
};

export function Timeline({ data }: TimelineProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {data.map((item, i) => (
        <div key={i} style={{ display: 'flex', gap: 10, paddingBottom: 12, position: 'relative' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 16 }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: statusColors[item.status || 'info'],
              flexShrink: 0, marginTop: 4,
            }} />
            {i < data.length - 1 && (
              <div style={{ width: 1, flex: 1, background: 'var(--fc-node-section-border, #f0f0f0)', marginTop: 4 }} />
            )}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: 'var(--fc-node-desc, #888)', fontFamily: 'monospace' }}>{item.time}</div>
            <div style={{ fontSize: 12, color: 'var(--fc-node-label, #1a1a1a)', marginTop: 2 }}>{item.event}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
