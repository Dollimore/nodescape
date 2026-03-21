import React from 'react';

interface KeyValueTableProps {
  data: Record<string, string | number> | Array<{ key: string; value: string | number }>;
}

export function KeyValueTable({ data }: KeyValueTableProps) {
  const entries = Array.isArray(data) ? data : Object.entries(data).map(([key, value]) => ({ key, value }));

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
      <tbody>
        {entries.map((entry, i) => (
          <tr key={i} style={{ borderBottom: '1px solid var(--fc-node-section-border, #f0f0f0)' }}>
            <td style={{ padding: '6px 8px 6px 0', color: 'var(--fc-node-desc, #888)', fontWeight: 600, fontSize: 12 }}>{entry.key}</td>
            <td style={{ padding: '6px 0', color: 'var(--fc-node-label, #1a1a1a)', textAlign: 'right', fontFamily: 'monospace' }}>{entry.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
