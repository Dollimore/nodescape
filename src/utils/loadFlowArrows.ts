import type { FlowDiagram } from '../types';

/** Auto-set edge thickness based on parsed annotation/flowRate values */
export function applyLoadFlowArrows(diagram: FlowDiagram, maxThickness: number = 6): FlowDiagram {
  // Parse all edge power values
  const edgePowers: Map<string, number> = new Map();
  let maxPower = 0;

  for (const edge of diagram.edges) {
    const text = edge.annotation || edge.label || '';
    const match = text.match(/([\d.]+)\s*(MW|GW|kW|W)/i);
    if (match) {
      let power = parseFloat(match[1]);
      const unit = match[2].toLowerCase();
      if (unit === 'gw') power *= 1000;
      if (unit === 'kw') power /= 1000;
      edgePowers.set(edge.id, power);
      maxPower = Math.max(maxPower, power);
    }
  }

  if (maxPower === 0) return diagram;

  return {
    ...diagram,
    edges: diagram.edges.map(edge => {
      const power = edgePowers.get(edge.id);
      if (power === undefined || edge.thickness) return edge;
      const thickness = 1 + (power / maxPower) * (maxThickness - 1);
      return { ...edge, thickness: Math.round(thickness * 2) / 2 };
    }),
  };
}
