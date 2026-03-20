import React from 'react';
import type { FlowCanvasProps, LayoutEdge } from './types';
import { FlowNodeRenderer } from './nodes/FlowNodeRenderer';
import { EdgeRenderer } from './edges/EdgeRenderer';

export function FlowCanvas({ diagram, mode = 'view', className }: FlowCanvasProps) {
  const editable = mode === 'edit';

  // Temporary: stack nodes vertically for visual verification
  // Will be replaced by dagre auto-layout in Task 6
  const tempPositions = new Map<string, { x: number; y: number }>();
  diagram.nodes.forEach((node, i) => {
    tempPositions.set(node.id, { x: 200, y: i * 120 + 20 });
  });

  // Temporary edge layout: straight lines between node centers
  const tempEdgeLayouts: LayoutEdge[] = diagram.edges.map((edge) => {
    const sourcePos = tempPositions.get(edge.source) || { x: 0, y: 0 };
    const targetPos = tempPositions.get(edge.target) || { x: 0, y: 0 };
    return {
      id: edge.id,
      source: edge.source,
      target: edge.target,
      points: [
        { x: sourcePos.x + 80, y: sourcePos.y + 50 },
        { x: targetPos.x + 80, y: targetPos.y },
      ],
    };
  });

  return (
    <div
      data-testid="flow-canvas"
      className={className}
      style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', background: '#f5f5f5' }}
    >
      <EdgeRenderer edges={diagram.edges} layoutEdges={tempEdgeLayouts} />
      {diagram.nodes.map((node) => (
        <FlowNodeRenderer
          key={node.id}
          node={node}
          editable={editable}
          position={tempPositions.get(node.id)!}
        />
      ))}
    </div>
  );
}
