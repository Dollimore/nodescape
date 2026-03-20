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
}

export function FlowNodeRenderer({ node, editable, position, onDragStart }: FlowNodeRendererProps) {
  const style: React.CSSProperties = {
    position: 'absolute',
    transform: `translate(${position.x}px, ${position.y}px)`,
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (editable && onDragStart) {
      onDragStart(node.id, e);
    }
  };

  const NodeComponent = getNodeComponent(node.type);

  return (
    <div style={style} onMouseDown={handleMouseDown}>
      <NodeComponent node={node} editable={editable} />
    </div>
  );
}

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
