import React from 'react';
import type { FlowCanvasProps } from './types';

export function FlowCanvas({ diagram, className }: FlowCanvasProps) {
  return (
    <div data-testid="flow-canvas" className={className} style={{ width: '100%', height: '100%', background: '#f5f5f5' }}>
      <p>FlowCanvas: {diagram.nodes.length} nodes, {diagram.edges.length} edges</p>
    </div>
  );
}
