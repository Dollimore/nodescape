import type { FlowDiagram, FlowNode, FlowEdge } from '../types';

export interface ContingencyResult {
  removedNodeId: string;
  removedNodeLabel: string;
  affectedNodes: string[];
  disconnectedNodes: string[];
  remainingCapacity: number;
  lostCapacity: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

/** Parse numeric value from flowRate string */
function parseRate(rate?: string): number {
  if (!rate) return 0;
  const match = rate.match(/([\d.]+)/);
  return match ? parseFloat(match[1]) : 0;
}

/** Perform N-1 contingency analysis — what happens if each node is removed? */
export function analyzeContingencies(diagram: FlowDiagram): ContingencyResult[] {
  const results: ContingencyResult[] = [];
  const totalCapacity = diagram.nodes.reduce((sum, n) => sum + parseRate(n.flowRate), 0);

  for (const node of diagram.nodes) {
    if (node.type === 'group' || node.type === 'netlabel') continue;

    // Remove this node and its edges
    const remainingNodes = diagram.nodes.filter(n => n.id !== node.id);
    const remainingEdges = diagram.edges.filter(e => e.source !== node.id && e.target !== node.id);

    // Find connected components via BFS from any remaining node
    const connected = new Set<string>();
    const rootNodes = remainingNodes.filter(n => n.type !== 'group' && n.type !== 'netlabel');
    if (rootNodes.length > 0) {
      const queue = [rootNodes[0].id];
      const adjMap = new Map<string, string[]>();
      for (const edge of remainingEdges) {
        const fwd = adjMap.get(edge.source) || [];
        fwd.push(edge.target);
        adjMap.set(edge.source, fwd);
        const rev = adjMap.get(edge.target) || [];
        rev.push(edge.source);
        adjMap.set(edge.target, rev);
      }
      while (queue.length > 0) {
        const id = queue.shift()!;
        if (connected.has(id)) continue;
        connected.add(id);
        for (const neighbor of adjMap.get(id) || []) {
          if (!connected.has(neighbor)) queue.push(neighbor);
        }
      }
    }

    const disconnectedNodes = rootNodes
      .filter(n => !connected.has(n.id))
      .map(n => n.id);

    // Directly affected — nodes that had edges to/from removed node
    const affectedNodes = diagram.edges
      .filter(e => e.source === node.id || e.target === node.id)
      .map(e => e.source === node.id ? e.target : e.source)
      .filter(id => id !== node.id);

    const lostCapacity = parseRate(node.flowRate);
    const remainingCapacity = totalCapacity - lostCapacity;

    const lostPct = totalCapacity > 0 ? (lostCapacity / totalCapacity) * 100 : 0;
    const severity: ContingencyResult['severity'] =
      disconnectedNodes.length > 0 ? 'critical' :
      lostPct > 30 ? 'high' :
      lostPct > 10 ? 'medium' : 'low';

    results.push({
      removedNodeId: node.id,
      removedNodeLabel: node.label,
      affectedNodes,
      disconnectedNodes,
      remainingCapacity,
      lostCapacity,
      severity,
    });
  }

  return results;
}

/** Highlight affected nodes/edges for a specific contingency */
export function applyContingencyHighlight(
  diagram: FlowDiagram,
  contingency: ContingencyResult
): FlowDiagram {
  return {
    ...diagram,
    nodes: diagram.nodes.map(node => {
      if (node.id === contingency.removedNodeId) {
        return { ...node, style: { ...node.style, color: '#ef4444', variant: 'filled' as const }, status: 'error' as const };
      }
      if (contingency.disconnectedNodes.includes(node.id)) {
        return { ...node, style: { ...node.style, color: '#f59e0b' }, status: 'warning' as const };
      }
      if (contingency.affectedNodes.includes(node.id)) {
        return { ...node, style: { ...node.style, color: '#f59e0b' } };
      }
      return node;
    }),
    edges: diagram.edges.map(edge => {
      if (edge.source === contingency.removedNodeId || edge.target === contingency.removedNodeId) {
        return { ...edge, color: '#ef4444', type: 'dashed' as const };
      }
      return edge;
    }),
  };
}
