import React, { useRef } from 'react';
import type { ComponentType } from 'react';
import type { FlowNode, CustomNodeProps } from '../types';
import { DefaultNode } from './DefaultNode';
import { DecisionNode } from './DecisionNode';
import { StartEndNode } from './StartEndNode';
import { GroupNode } from './GroupNode';
import { BusNode } from './BusNode';
import { NetLabelNode } from './NetLabelNode';
import { SingleLineNode } from './SingleLineNode';

interface FlowNodeRendererProps {
  node: FlowNode;
  editable: boolean;
  position: { x: number; y: number };
  size?: { width: number; height: number };
  onDragStart?: (nodeId: string, e: React.MouseEvent) => void;
  isDragging?: boolean;
  onClick?: () => void;
  onNodeSelect?: (nodeId: string, e: React.MouseEvent) => void;
  isSelected?: boolean;
  customRenderers?: Record<string, ComponentType<CustomNodeProps>>;
  onNodeContextMenu?: (nodeId: string, e: React.MouseEvent) => void;
  onRelayout?: () => void;
  onHandleDrag?: (nodeId: string, side: string, e: React.MouseEvent) => void;
  onLabelChange?: (nodeId: string, newLabel: string) => void;
  isOverlapping?: boolean;
  detailLevel?: 'minimal' | 'compact' | 'full';
  displayMode?: 'standard' | 'single-line';
}

export const FlowNodeRenderer = React.forwardRef<HTMLDivElement, FlowNodeRendererProps>(
  function FlowNodeRenderer({ node, editable, position, size, onDragStart, isDragging, onClick, onNodeSelect, isSelected, isOverlapping, customRenderers, onNodeContextMenu, onRelayout, onHandleDrag, onLabelChange, detailLevel = 'full', displayMode = 'standard' }, ref) {
    const startPos = useRef<{ x: number; y: number } | null>(null);

    const style: React.CSSProperties = {
      position: 'absolute',
      transform: `translate(${position.x}px, ${position.y}px)`,
      transition: isDragging ? undefined : 'transform 0.3s ease',
      cursor: onClick && !editable ? 'pointer' : undefined,
      // Force grid-snapped width; groups use fixed height, others use min-height for collapse
      ...(size ? {
        width: size.width,
        ...(node.type === 'group' ? { height: size.height } : { minHeight: size.height }),
      } : {}),
      ...(isSelected ? { outline: '2px solid #3b82f6', outlineOffset: '2px' } : {}),
      ...(isOverlapping && !isSelected ? { outline: '2px solid #ef4444', outlineOffset: '1px' } : {}),
    };

    const handleMouseDown = (e: React.MouseEvent) => {
      startPos.current = { x: e.clientX, y: e.clientY };
      if (editable && onDragStart) {
        onDragStart(node.id, e);
      }
    };

    const handleMouseUp = (e: React.MouseEvent) => {
      if (startPos.current) {
        const dx = Math.abs(e.clientX - startPos.current.x);
        const dy = Math.abs(e.clientY - startPos.current.y);
        // Only fire click/select if mouse didn't move (not a drag)
        if (dx < 5 && dy < 5) {
          if (onNodeSelect) {
            onNodeSelect(node.id, e);
          }
          if (onClick) {
            onClick();
          }
        }
      }
      startPos.current = null;
    };

    const NodeComponent =
      (node.type && customRenderers?.[node.type]) ||
      (displayMode === 'single-line' && node.type !== 'group' && node.type !== 'netlabel' && node.type !== 'bus'
        ? SingleLineNode
        : getNodeComponent(node.type));

    const handleContextMenu = (e: React.MouseEvent) => {
      if (onNodeContextMenu) {
        e.preventDefault();
        onNodeContextMenu(node.id, e);
      }
    };

    const nodeContent = <NodeComponent node={node} editable={editable} onCollapseToggle={onRelayout ? () => onRelayout() : undefined} onHandleDrag={onHandleDrag} {...(NodeComponent === DefaultNode ? { onLabelChange, detailLevel } : {})} />;

    return (
      <div ref={ref} style={style} onMouseDown={handleMouseDown} onMouseUp={handleMouseUp} onContextMenu={handleContextMenu} data-node-draggable={editable || undefined} data-node-id={node.id}>
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
