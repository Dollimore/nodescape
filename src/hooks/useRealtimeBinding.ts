import { useState, useEffect, useCallback, useRef } from 'react';
import type { FlowDiagram, FlowNode } from '../types';

export interface NodeDataUpdate {
  nodeId: string;
  data: Partial<Pick<FlowNode, 'status' | 'progress' | 'flowRate' | 'description' | 'label'>>;
}

export interface RealtimeBindingOptions {
  /** Polling interval in ms for the data source. 0 = manual updates only */
  pollInterval?: number;
  /** Data source function that returns node updates */
  dataSource?: () => Promise<NodeDataUpdate[]> | NodeDataUpdate[];
}

/** Hook that merges real-time data updates into a diagram */
export function useRealtimeBinding(
  baseDiagram: FlowDiagram,
  options: RealtimeBindingOptions = {}
): {
  diagram: FlowDiagram;
  updateNodes: (updates: NodeDataUpdate[]) => void;
  updateNode: (nodeId: string, data: NodeDataUpdate['data']) => void;
} {
  const [overrides, setOverrides] = useState<Map<string, NodeDataUpdate['data']>>(new Map());
  const intervalRef = useRef<number | null>(null);

  const updateNodes = useCallback((updates: NodeDataUpdate[]) => {
    setOverrides(prev => {
      const next = new Map(prev);
      for (const update of updates) {
        const existing = next.get(update.nodeId) || {};
        next.set(update.nodeId, { ...existing, ...update.data });
      }
      return next;
    });
  }, []);

  const updateNode = useCallback((nodeId: string, data: NodeDataUpdate['data']) => {
    updateNodes([{ nodeId, data }]);
  }, [updateNodes]);

  // Polling
  useEffect(() => {
    if (!options.dataSource || !options.pollInterval) return;

    const poll = async () => {
      const updates = await options.dataSource!();
      updateNodes(updates);
    };

    intervalRef.current = window.setInterval(poll, options.pollInterval);
    poll(); // Initial fetch

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [options.dataSource, options.pollInterval, updateNodes]);

  // Merge overrides into the base diagram
  const diagram: FlowDiagram = {
    ...baseDiagram,
    nodes: baseDiagram.nodes.map(node => {
      const override = overrides.get(node.id);
      if (!override) return node;
      return { ...node, ...override };
    }),
  };

  return { diagram, updateNodes, updateNode };
}
