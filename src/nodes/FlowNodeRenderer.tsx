import React, { useRef } from 'react';
import type { ComponentType } from 'react';
import type { FlowNode, CustomNodeProps } from '../types';
import { DefaultNode } from './DefaultNode';
import { DecisionNode } from './DecisionNode';
import { StartEndNode } from './StartEndNode';
import { GroupNode } from './GroupNode';
import { BusNode } from './BusNode';
import { NetLabelNode } from './NetLabelNode';

interface FlowNodeRendererProps {
  node: FlowNode;
  editable: boolean;
  position: { x: number; y: number };
  size?: { width: number; height: number };
  onDragStart?: (nodeId: string, e: React.MouseEvent) => void;
  isDragging?: boolean;
  onClick?: () => void;
  customRenderers?: Record<string, ComponentType<CustomNodeProps>>;
  onNodeContextMenu?: (nodeId: string, e: React.MouseEvent) => void;
  onRelayout?: () => void;
}

export const FlowNodeRenderer = React.forwardRef<HTMLDivElement, FlowNodeRendererProps>(
  function FlowNodeRenderer({ node, editable, position, size, onDragStart, isDragging, onClick, customRenderers, onNodeContextMenu, onRelayout }, ref) {
    const startPos = useRef<{ x: number; y: number } | null>(null);

    const style: React.CSSProperties = {
      position: 'absolute',
      transform: `translate(${position.x}px, ${position.y}px)`,
      transition: isDragging ? undefined : 'transform 0.3s ease',
      cursor: onClick && !editable ? 'pointer' : undefined,
      // Force grid-snapped width; height is min-height so collapse can shrink
      ...(size ? { width: size.width, minHeight: size.height } : {}),
    };

    const handleMouseDown = (e: React.MouseEvent) => {
      startPos.current = { x: e.clientX, y: e.clientY };
      if (editable && onDragStart) {
        onDragStart(node.id, e);
      }
    };

    const handleMouseUp = (e: React.MouseEvent) => {
      if (startPos.current && onClick) {
        const dx = Math.abs(e.clientX - startPos.current.x);
        const dy = Math.abs(e.clientY - startPos.current.y);
        // Only fire click if mouse didn't move (not a drag)
        if (dx < 5 && dy < 5) {
          onClick();
        }
      }
      startPos.current = null;
    };

    const NodeComponent =
      (node.type && customRenderers?.[node.type]) || getNodeComponent(node.type);

    const handleContextMenu = (e: React.MouseEvent) => {
      if (onNodeContextMenu) {
        e.preventDefault();
        onNodeContextMenu(node.id, e);
      }
    };

    const nodeContent = <NodeComponent node={node} editable={editable} onCollapseToggle={onRelayout ? () => onRelayout() : undefined} />;

    return (
      <div ref={ref} style={style} onMouseDown={handleMouseDown} onMouseUp={handleMouseUp} onContextMenu={handleContextMenu} data-node-draggable={editable || undefined}>
        {node.rotation ? (
          <div style={{ transform: `rotate(${node.rotation}deg)` }}>
            {nodeContent}
          </div>
        ) : (
          nodeContent
        )}
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
    case 'group':
      return GroupNode;
    case 'bus':
      return BusNode;
    case 'netlabel':
      return NetLabelNode;
    default:
      return DefaultNode;
  }
}
