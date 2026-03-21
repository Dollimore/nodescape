import type { FlowDiagram, FlowEdge } from '../types';

export interface VoltageLevel {
  label: string;
  color: string;
  minVoltage?: number;
  maxVoltage?: number;
}

export const DEFAULT_VOLTAGE_LEVELS: VoltageLevel[] = [
  { label: 'HV', color: '#ef4444', minVoltage: 1000 },         // Red — high voltage
  { label: 'MV', color: '#f59e0b', minVoltage: 100, maxVoltage: 999 }, // Amber — medium voltage
  { label: 'LV', color: '#3b82f6', minVoltage: 10, maxVoltage: 99 },   // Blue — low voltage
  { label: 'Signal', color: '#22c55e', minVoltage: 0, maxVoltage: 9 },  // Green — signal level
  { label: 'Ground', color: '#94a3b8' },                        // Gray — ground
];

/** Apply automatic coloring to edges based on voltage annotations */
export function applyVoltageColoring(
  diagram: FlowDiagram,
  levels: VoltageLevel[] = DEFAULT_VOLTAGE_LEVELS
): FlowDiagram {
  const coloredEdges: FlowEdge[] = diagram.edges.map(edge => {
    if (edge.color) return edge; // Don't override explicit colors

    // Try to parse voltage from annotation
    const annotation = edge.annotation || edge.label || '';
    const voltageMatch = annotation.match(/([\d.]+)\s*(kV|V|mV)/i);

    if (!voltageMatch) return edge;

    let voltage = parseFloat(voltageMatch[1]);
    const unit = voltageMatch[2].toLowerCase();
    if (unit === 'kv') voltage *= 1000;
    if (unit === 'mv') voltage /= 1000;

    const level = levels.find(l => {
      if (l.minVoltage !== undefined && l.maxVoltage !== undefined) {
        return voltage >= l.minVoltage && voltage <= l.maxVoltage;
      }
      if (l.minVoltage !== undefined) return voltage >= l.minVoltage;
      return false;
    });

    return level ? { ...edge, color: level.color } : edge;
  });

  return { ...diagram, edges: coloredEdges };
}

/** Apply wire thickness based on current values in annotations */
export function applyCurrentThickness(
  diagram: FlowDiagram,
  baseThickness: number = 1.5,
  maxThickness: number = 6
): FlowDiagram {
  const edges: FlowEdge[] = diagram.edges.map(edge => {
    if (edge.thickness) return edge;

    const annotation = edge.annotation || '';
    const currentMatch = annotation.match(/([\d.]+)\s*(A|mA|kA)/i);

    if (!currentMatch) return edge;

    let current = parseFloat(currentMatch[1]);
    const unit = currentMatch[2].toLowerCase();
    if (unit === 'ka') current *= 1000;
    if (unit === 'ma') current /= 1000;

    // Scale thickness logarithmically
    const thickness = Math.min(maxThickness, baseThickness + Math.log10(current + 1) * 2);

    return { ...edge, thickness };
  });

  return { ...diagram, edges };
}
