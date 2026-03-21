import type { FlowDiagram } from '../types';

export interface HeatmapOptions {
  metric: 'progress' | 'custom';
  customValues?: Record<string, number>;
  colors?: { low: string; mid: string; high: string; critical: string };
  thresholds?: { mid: number; high: number; critical: number };
}

const DEFAULT_COLORS = {
  low: '#22c55e',
  mid: '#f59e0b',
  high: '#ef4444',
  critical: '#7f1d1d',
};

const DEFAULT_THRESHOLDS = { mid: 50, high: 75, critical: 90 };

function getHeatColor(value: number, colors: typeof DEFAULT_COLORS, thresholds: typeof DEFAULT_THRESHOLDS): string {
  if (value >= thresholds.critical) return colors.critical;
  if (value >= thresholds.high) return colors.high;
  if (value >= thresholds.mid) return colors.mid;
  return colors.low;
}

export function applyHeatmap(diagram: FlowDiagram, options: HeatmapOptions): FlowDiagram {
  const colors = { ...DEFAULT_COLORS, ...options.colors };
  const thresholds = { ...DEFAULT_THRESHOLDS, ...options.thresholds };

  return {
    ...diagram,
    nodes: diagram.nodes.map(node => {
      let value: number | undefined;
      if (options.metric === 'progress') {
        value = node.progress;
      } else if (options.customValues) {
        value = options.customValues[node.id];
      }
      if (value === undefined) return node;

      return {
        ...node,
        style: {
          ...node.style,
          color: getHeatColor(value, colors, thresholds),
        },
      };
    }),
  };
}
