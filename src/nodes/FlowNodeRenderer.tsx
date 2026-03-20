import React from 'react';
import type { FlowNode } from '../types';
import { DefaultNode } from './DefaultNode';
import { DecisionNode } from './DecisionNode';
import { StartEndNode } from './StartEndNode';

interface FlowNodeRendererProps {
  node: FlowNode;
  editable: boolean;
  position: { x: number; y: number };
  onDragStart?: (nodeId: string, e: React.MouseEvent) => void;
  isDragging?: boolean;
}

export const FlowNodeRenderer = React.forwardRef<HTMLDivElement, FlowNodeRendererProps>(
  function FlowNodeRenderer({ node, editable, position, onDragStart, isDragging }, ref) {
    const style: React.CSSProperties = {
      position: 'absolute',
      transform: `translate(${position.x}px, ${position.y}px)`,
      transition: isDragging ? undefined : 'transform 0.3s ease',
    };

    const handleMouseDown = (e: React.MouseEvent) => {
      if (editable && onDragStart) {
        onDragStart(node.id, e);
      }
    };

    const NodeComponent = getNodeComponent(node.type);

    return (
      <div ref={ref} style={style} onMouseDown={handleMouseDown} data-node-draggable={editable || undefined}>
        <NodeComponent node={node} editable={editable} />
      </div>
    );
  }
);

function getNodeComponent(type?: FlowNode['type']) {
  switch (type) {
    case 'decision':
      return DecisionNode;
    case 'start':
    case 'end':
      return StartEndNode;
    default:
      return DefaultNode;
  }
}
