import type { FlowDiagram, FlowNode, FlowEdge } from '../types';

export interface PowerFlowResult {
  diagram: FlowDiagram;
  totalGeneration: number;
  totalLoad: number;
  totalLosses: number;
  warnings: string[];
}

export interface PowerFlowOptions {
  /** Loss percentage per edge (default 0.5%) */
  lossPerEdge?: number;
  /** Unit label (default "MW") */
  unit?: string;
  /** Node IDs that are generators (sources) — identified by flowRate or explicitly */
  generatorIds?: string[];
  /** Node IDs that are loads (sinks) */
  loadIds?: string[];
}

/** Parse a numeric value from a flowRate string like "1200 MW" or "2.4A" */
function parseFlowRate(rate: string | undefined): number {
  if (!rate) return 0;
  const match = rate.match(/([\d.]+)/);
  return match ? parseFloat(match[1]) : 0;
}

/** Determine if a node is a generator (source of power) */
function isGenerator(node: FlowNode, generatorIds?: string[]): boolean {
  if (generatorIds?.includes(node.id)) return true;
  if (node.type === 'start') return true;
  if (node.icon === 'generator' || node.icon === 'voltage-source') return true;
  return false;
}

/** Determine if a node is a load (consumer of power) */
function isLoad(node: FlowNode, loadIds?: string[]): boolean {
  if (loadIds?.includes(node.id)) return true;
  if (node.type === 'end') return true;
  if (node.icon === 'motor' || node.icon === 'speaker') return true;
  return false;
}

/**
 * Compute a simplified power flow through the diagram.
 *
 * Strategy:
 * 1. Identify generator nodes and their output (from flowRate)
 * 2. Identify load nodes and their consumption (from flowRate)
 * 3. Walk edges from generators toward loads, applying losses per edge
 * 4. Annotate edges with computed flow values
 * 5. Update node progress bars based on utilization
 */
export function computePowerFlow(
  diagram: FlowDiagram,
  options: PowerFlowOptions = {}
): PowerFlowResult {
  const {
    lossPerEdge = 0.5,
    unit = 'MW',
    generatorIds,
    loadIds,
  } = options;

  const warnings: string[] = [];

  // Calculate totals
  let totalGeneration = 0;
  let totalLoad = 0;

  const generators = diagram.nodes.filter(n => isGenerator(n, generatorIds));
  const loads = diagram.nodes.filter(n => isLoad(n, loadIds));

  for (const gen of generators) {
    totalGeneration += parseFlowRate(gen.flowRate);
  }
  for (const load of loads) {
    totalLoad += parseFlowRate(load.flowRate);
  }

  // Build adjacency map
  const outEdges = new Map<string, FlowEdge[]>();
  for (const edge of diagram.edges) {
    const existing = outEdges.get(edge.source) || [];
    existing.push(edge);
    outEdges.set(edge.source, existing);
  }

  // Walk from each generator and compute flow on edges
  const edgeFlows = new Map<string, number>();
  const visited = new Set<string>();
  let totalLosses = 0;

  function walkNode(nodeId: string, incomingPower: number) {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);

    const edges = outEdges.get(nodeId) || [];
    if (edges.length === 0) return;

    // Split power evenly among outgoing edges
    const powerPerEdge = incomingPower / edges.length;

    for (const edge of edges) {
      const loss = powerPerEdge * (lossPerEdge / 100);
      const delivered = powerPerEdge - loss;
      totalLosses += loss;
      edgeFlows.set(edge.id, powerPerEdge);
      walkNode(edge.target, delivered);
    }
  }

  for (const gen of generators) {
    const power = parseFlowRate(gen.flowRate);
    walkNode(gen.id, power);
  }

  // Check balance
  if (totalGeneration > 0 && totalLoad > 0) {
    const balance = totalGeneration - totalLoad - totalLosses;
    if (Math.abs(balance) > totalGeneration * 0.05) {
      warnings.push(`Power imbalance: ${balance.toFixed(1)} ${unit} (generation=${totalGeneration.toFixed(1)}, load=${totalLoad.toFixed(1)}, losses=${totalLosses.toFixed(1)})`);
    }
  }

  // Annotate edges with computed flow
  const annotatedEdges = diagram.edges.map(edge => {
    const flow = edgeFlows.get(edge.id);
    if (flow === undefined) return edge;
    return {
      ...edge,
      annotation: edge.annotation || `${flow.toFixed(1)} ${unit}`,
    };
  });

  // Annotate generator nodes with utilization
  const maxGen = Math.max(...generators.map(g => parseFlowRate(g.flowRate)), 1);
  const annotatedNodes = diagram.nodes.map(node => {
    if (isGenerator(node, generatorIds) && node.flowRate) {
      const power = parseFlowRate(node.flowRate);
      return {
        ...node,
        progress: node.progress ?? Math.round((power / maxGen) * 100),
      };
    }
    return node;
  });

  return {
    diagram: { ...diagram, nodes: annotatedNodes, edges: annotatedEdges },
    totalGeneration,
    totalLoad,
    totalLosses,
    warnings,
  };
}

/** Generate a summary section that can be added to a SCADA/control node */
export function powerFlowSummary(result: PowerFlowResult, unit: string = 'MW'): Array<{ heading: string; content: string }> {
  return [
    { heading: 'Total Generation', content: `${result.totalGeneration.toFixed(1)} ${unit}` },
    { heading: 'Total Load', content: `${result.totalLoad.toFixed(1)} ${unit}` },
    { heading: 'Transmission Losses', content: `${result.totalLosses.toFixed(1)} ${unit} (${((result.totalLosses / result.totalGeneration) * 100).toFixed(1)}%)` },
    ...(result.warnings.length > 0 ? [{ heading: 'Warnings', content: result.warnings.join('; ') }] : []),
  ];
}
