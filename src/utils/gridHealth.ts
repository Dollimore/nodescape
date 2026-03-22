import type { FlowDiagram } from '../types';

export interface GridHealthMetrics {
  [nodeId: string]: {
    voltage?: number;    // per-unit (1.0 = nominal)
    frequency?: number;  // Hz
    loading?: number;    // percentage
  };
}

export function applyGridHealthOverlay(
  diagram: FlowDiagram,
  metrics: GridHealthMetrics
): FlowDiagram {
  return {
    ...diagram,
    nodes: diagram.nodes.map(node => {
      const m = metrics[node.id];
      if (!m) return node;

      let healthColor: string;
      let healthStatus: 'online' | 'warning' | 'error' = 'online';

      // Voltage check (per-unit)
      if (m.voltage !== undefined) {
        if (m.voltage < 0.9 || m.voltage > 1.1) {
          healthColor = '#ef4444'; healthStatus = 'error';
        } else if (m.voltage < 0.95 || m.voltage > 1.05) {
          healthColor = '#f59e0b'; healthStatus = 'warning';
        } else {
          healthColor = '#22c55e';
        }
      }
      // Frequency check
      else if (m.frequency !== undefined) {
        const dev = Math.abs(m.frequency - 50);
        if (dev > 0.5) {
          healthColor = '#ef4444'; healthStatus = 'error';
        } else if (dev > 0.2) {
          healthColor = '#f59e0b'; healthStatus = 'warning';
        } else {
          healthColor = '#22c55e';
        }
      }
      // Loading check
      else if (m.loading !== undefined) {
        if (m.loading > 100) {
          healthColor = '#ef4444'; healthStatus = 'error';
        } else if (m.loading > 80) {
          healthColor = '#f59e0b'; healthStatus = 'warning';
        } else {
          healthColor = '#22c55e';
        }
        return { ...node, style: { ...node.style, color: healthColor! }, status: healthStatus, progress: m.loading };
      }
      else {
        return node;
      }

      return { ...node, style: { ...node.style, color: healthColor! }, status: healthStatus };
    }),
  };
}
