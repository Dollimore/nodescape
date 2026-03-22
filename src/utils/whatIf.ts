import type { FlowDiagram, FlowNode, FlowEdge } from '../types';

export interface WhatIfState {
  disabledNodes: Set<string>;
}

/** Apply what-if state to a diagram — disabled nodes go offline, their downstream is affected */
export function applyWhatIf(diagram: FlowDiagram, state: WhatIfState): FlowDiagram {
  if (state.disabledNodes.size === 0) return diagram;

  // Find all nodes downstream of disabled nodes that lose their supply
  const affectedNodes = new Set<string>();
  const adjMap = new Map<string, string[]>();
  for (const edge of diagram.edges) {
    const fwd = adjMap.get(edge.source) || [];
    fwd.push(edge.target);
    adjMap.set(edge.source, fwd);
  }

  // BFS from disabled nodes to find cascade
  function cascadeFrom(nodeId: string) {
    const queue = [nodeId];
    while (queue.length > 0) {
      const id = queue.shift()!;
      for (const next of adjMap.get(id) || []) {
        if (!affectedNodes.has(next) && !state.disabledNodes.has(next)) {
          // Check if ALL sources of this node are disabled/affected
          const allSourcesDown = diagram.edges
            .filter(e => e.target === next)
            .every(e => state.disabledNodes.has(e.source) || affectedNodes.has(e.source));

          if (allSourcesDown) {
            affectedNodes.add(next);
            queue.push(next);
          }
        }
      }
    }
  }

  for (const nodeId of state.disabledNodes) {
    cascadeFrom(nodeId);
  }

  return {
    ...diagram,
    nodes: diagram.nodes.map(node => {
      if (state.disabledNodes.has(node.id)) {
        return {
          ...node,
          status: 'offline' as const,
          style: { ...node.style, variant: 'ghost' as const },
          progress: 0,
        };
      }
      if (affectedNodes.has(node.id)) {
        return {
          ...node,
          status: 'warning' as const,
          style: { ...node.style, color: '#f59e0b' },
        };
      }
      return node;
    }),
    edges: diagram.edges.map(edge => {
      const sourceDown = state.disabledNodes.has(edge.source) || affectedNodes.has(edge.source);
      const targetDown = state.disabledNodes.has(edge.target) || affectedNodes.has(edge.target);
      if (sourceDown || targetDown) {
        return {
          ...edge,
          color: '#94a3b8',
          animated: false,
          flowAnimation: false,
          type: 'dashed' as const,
        };
      }
      return edge;
    }),
  };
}

/** Create initial what-if state */
export function createWhatIfState(): WhatIfState {
  return { disabledNodes: new Set() };
}

/** Toggle a node on/off in what-if state */
export function toggleWhatIfNode(state: WhatIfState, nodeId: string): WhatIfState {
  const next = new Set(state.disabledNodes);
  if (next.has(nodeId)) {
    next.delete(nodeId);
  } else {
    next.add(nodeId);
  }
  return { disabledNodes: next };
}
