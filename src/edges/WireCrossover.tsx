import React from 'react';

interface WireCrossoverProps {
  x: number;
  y: number;
  size?: number;
  orientation?: 'horizontal' | 'vertical';
  color?: string;
}

// A small semicircle hop indicating a wire crossing without connection.
// Place this manually at intersection points in custom renderers.
export function WireCrossover({ x, y, size = 8, orientation = 'horizontal', color }: WireCrossoverProps) {
  const style = { stroke: color || 'var(--fc-edge)', fill: 'var(--fc-bg)', strokeWidth: 1.5 };

  if (orientation === 'horizontal') {
    // Hop goes over a horizontal wire (semicircle arches upward)
    return (
      <path
        d={`M ${x - size} ${y} A ${size} ${size} 0 0 1 ${x + size} ${y}`}
        style={style}
      />
    );
  } else {
    // Hop goes over a vertical wire (semicircle arches rightward)
    return (
      <path
        d={`M ${x} ${y - size} A ${size} ${size} 0 0 1 ${x} ${y + size}`}
        style={style}
      />
    );
  }
}
