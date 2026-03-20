import React from 'react';
import type { FlowCanvasProps } from './types';
import { FlowNodeRenderer } from './nodes/FlowNodeRenderer';

export function FlowCanvas({ diagram, mode = 'view', className }: FlowCanvasProps) {
  const editable = mode === 'edit';

  // Temporary: stack nodes vertically with fixed spacing for visual verification
  // Will be replaced by dagre auto-layout in Task 6
  const tempPositions = new Map<string, { x: number; y: number }>();
  diagram.nodes.forEach((node, i) => {
    tempPositions.set(node.id, { x: 100, y: i * 120 });
  });

  return (
    <div
      data-testid="flow-canvas"
      className={className}
      style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', background: '#f5f5f5' }}
    >
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
