import type { FlowDiagram, FlowNode } from '../types';

export interface ReactorStatus {
  thermalPower: number;
  electricalOutput: number;
  efficiency: number;
  controlRodPosition: number; // 0-100%
  coolantTemp: { inlet: number; outlet: number };
  pressureBar: number;
  neutronFlux: 'low' | 'normal' | 'high' | 'critical';
  safetySystemsActive: string[];
}

/** Apply radiation zone coloring to nodes based on proximity to reactor */
export function applyRadiationZones(
  diagram: FlowDiagram,
  reactorNodeId: string,
  options?: {
    colors?: { high: string; medium: string; low: string; clean: string };
  }
): FlowDiagram {
  const colors = {
    high: '#ef4444',
    medium: '#f59e0b',
    low: '#22c55e',
    clean: '#3b82f6',
    ...options?.colors,
  };

  // Build adjacency and compute distance from reactor
  const adjMap = new Map<string, string[]>();
  for (const edge of diagram.edges) {
    const fwd = adjMap.get(edge.source) || [];
    fwd.push(edge.target);
    adjMap.set(edge.source, fwd);
    const rev = adjMap.get(edge.target) || [];
    rev.push(edge.source);
    adjMap.set(edge.target, rev);
  }

  // BFS from reactor
  const distances = new Map<string, number>();
  const queue: Array<{ id: string; dist: number }> = [{ id: reactorNodeId, dist: 0 }];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const { id, dist } = queue.shift()!;
    if (visited.has(id)) continue;
    visited.add(id);
    distances.set(id, dist);
    for (const neighbor of adjMap.get(id) || []) {
      if (!visited.has(neighbor)) {
        queue.push({ id: neighbor, dist: dist + 1 });
      }
    }
  }

  return {
    ...diagram,
    nodes: diagram.nodes.map(node => {
      if (node.type === 'group' || node.type === 'netlabel') return node;
      const dist = distances.get(node.id);
      if (dist === undefined) return node;

      let zoneColor: string;
      if (dist === 0) zoneColor = colors.high;
      else if (dist <= 2) zoneColor = colors.medium;
      else if (dist <= 4) zoneColor = colors.low;
      else zoneColor = colors.clean;

      return {
        ...node,
        style: { ...node.style, color: zoneColor },
      };
    }),
  };
}

/** Generate reactor status summary sections */
export function reactorStatusSections(status: ReactorStatus): Array<{ heading: string; content: string }> {
  const fluxColors: Record<string, string> = {
    low: 'Low',
    normal: 'Normal',
    high: '**High**',
    critical: '**CRITICAL**',
  };

  return [
    { heading: 'Thermal Power', content: `${status.thermalPower} MWt` },
    { heading: 'Electrical Output', content: `${status.electricalOutput} MWe (${status.efficiency.toFixed(1)}% eff.)` },
    { heading: 'Control Rods', content: `${status.controlRodPosition}% inserted` },
    { heading: 'Coolant', content: `Inlet **${status.coolantTemp.inlet}C** / Outlet **${status.coolantTemp.outlet}C**` },
    { heading: 'Pressure', content: `${status.pressureBar} bar` },
    { heading: 'Neutron Flux', content: fluxColors[status.neutronFlux] },
    { heading: 'Safety Systems', content: status.safetySystemsActive.join(', ') },
  ];
}
