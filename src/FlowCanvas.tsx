import React, { useRef, useCallback } from 'react';
import type { FlowCanvasProps } from './types';
import { FlowNodeRenderer } from './nodes/FlowNodeRenderer';
import { EdgeRenderer } from './edges/EdgeRenderer';
import { useAutoLayout } from './layout/useAutoLayout';
import { CanvasView } from './canvas/CanvasView';

export function FlowCanvas({ diagram, mode = 'view', className }: FlowCanvasProps) {
  const editable = mode === 'edit';
  const nodeRefs = useRef(new Map<string, HTMLElement | null>());

  const setNodeRef = useCallback((id: string, el: HTMLElement | null) => {
    nodeRefs.current.set(id, el);
  }, []);

  const layout = useAutoLayout(diagram, nodeRefs.current);

  const nodePositions = new Map(
    (layout?.nodes || []).map((n) => [n.id, { x: n.x, y: n.y }])
  );

  return (
    <CanvasView className={className}>
      {layout && (
        <EdgeRenderer edges={diagram.edges} layoutEdges={layout.edges} />
      )}
      {diagram.nodes.map((node) => (
        <FlowNodeRenderer
          key={node.id}
          node={node}
          editable={editable}
          position={nodePositions.get(node.id) || { x: 0, y: 0 }}
          ref={(el) => setNodeRef(node.id, el)}
        />
      ))}
    </CanvasView>
  );
}
