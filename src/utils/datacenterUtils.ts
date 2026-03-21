import type { FlowDiagram } from '../types';

export interface PUEResult {
  pue: number;
  totalIT: number;
  totalFacility: number;
  cooling: number;
  lighting: number;
  other: number;
}

/** Calculate PUE from node data */
export function calculatePUE(diagram: FlowDiagram): PUEResult {
  let totalIT = 0;
  let cooling = 0;
  let other = 0;

  for (const node of diagram.nodes) {
    const power = parseFloat(node.flowRate?.match(/[\d.]+/)?.[0] || '0');
    if (!power) continue;

    const icon = typeof node.icon === 'string' ? node.icon : '';
    if (['server-rack', 'network-switch', 'firewall', 'router', 'load-balancer'].includes(icon)) {
      totalIT += power;
    } else if (['chiller', 'crah'].includes(icon)) {
      cooling += power;
    } else if (['ups-unit', 'pdu-rack'].includes(icon)) {
      other += power * 0.05; // ~5% UPS/PDU losses
    }
  }

  const lighting = totalIT * 0.02; // estimate 2%
  const totalFacility = totalIT + cooling + other + lighting;
  const pue = totalIT > 0 ? totalFacility / totalIT : 0;

  return { pue, totalIT, totalFacility, cooling, lighting, other };
}

/** Generate redundancy path info */
export function analyzeRedundancy(diagram: FlowDiagram): {
  singlePoints: string[];
  redundantPaths: string[][];
} {
  // Find nodes with only one incoming edge (single point of failure)
  const incomingCount = new Map<string, number>();
  for (const edge of diagram.edges) {
    incomingCount.set(edge.target, (incomingCount.get(edge.target) || 0) + 1);
  }

  const singlePoints = diagram.nodes
    .filter(n => n.type !== 'start' && n.type !== 'group' && n.type !== 'netlabel')
    .filter(n => (incomingCount.get(n.id) || 0) === 1)
    .map(n => n.id);

  // Find nodes with multiple paths (A/B feeds)
  const redundantPaths = diagram.nodes
    .filter(n => (incomingCount.get(n.id) || 0) >= 2)
    .map(n => {
      const feeds = diagram.edges.filter(e => e.target === n.id).map(e => e.source);
      return [n.id, ...feeds];
    });

  return { singlePoints, redundantPaths };
}
