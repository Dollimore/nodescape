import type { FlowDiagram } from '../types';

export interface DiagramStats {
  nodeCount: number;
  edgeCount: number;
  groupCount: number;
  maxDepth: number;
  isolatedNodes: string[];
  leafNodes: string[];
  rootNodes: string[];
}

/** Analyze diagram structure */
export function analyzeDiagram(diagram: FlowDiagram): DiagramStats {
  const sourceSet = new Set(diagram.edges.map(e => e.source));
  const targetSet = new Set(diagram.edges.map(e => e.target));
  const connectedNodes = new Set([...sourceSet, ...targetSet]);

  const nonGroupNodes = diagram.nodes.filter(n => n.type !== 'group');

  const isolatedNodes = nonGroupNodes
    .filter(n => !connectedNodes.has(n.id))
    .map(n => n.id);

  const leafNodes = nonGroupNodes
    .filter(n => !sourceSet.has(n.id) && targetSet.has(n.id))
    .map(n => n.id);

  const rootNodes = nonGroupNodes
    .filter(n => sourceSet.has(n.id) && !targetSet.has(n.id))
    .map(n => n.id);

  // Compute max depth via BFS from root nodes
  const adjMap = new Map<string, string[]>();
  for (const edge of diagram.edges) {
    const existing = adjMap.get(edge.source) || [];
    existing.push(edge.target);
    adjMap.set(edge.source, existing);
  }

  let maxDepth = 0;
  for (const root of rootNodes) {
    const queue: Array<{ id: string; depth: number }> = [{ id: root, depth: 0 }];
    const visited = new Set<string>();
    while (queue.length > 0) {
      const { id, depth } = queue.shift()!;
      if (visited.has(id)) continue;
      visited.add(id);
      maxDepth = Math.max(maxDepth, depth);
      for (const next of adjMap.get(id) || []) {
        queue.push({ id: next, depth: depth + 1 });
      }
    }
  }

  return {
    nodeCount: nonGroupNodes.length,
    edgeCount: diagram.edges.length,
    groupCount: diagram.nodes.filter(n => n.type === 'group').length,
    maxDepth,
    isolatedNodes,
    leafNodes,
    rootNodes,
  };
}
