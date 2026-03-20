import React, { useRef, useCallback, useEffect, useMemo } from 'react';
import type { FlowCanvasProps, FlowDiagram, LayoutEdge, LayoutNode } from './types';
import { FlowNodeRenderer } from './nodes/FlowNodeRenderer';
import { EdgeRenderer } from './edges/EdgeRenderer';
import { useAutoLayout } from './layout/useAutoLayout';
import { CanvasView } from './canvas/CanvasView';
import { useDragNode } from './hooks/useDragNode';
import styles from './FlowCanvas.module.css';

/** Compute edge points dynamically from current node positions + sizes */
function computeDynamicEdges(
  edges: FlowDiagram['edges'],
  positions: { [id: string]: { x: number; y: number } },
  layoutNodes: LayoutNode[]
): LayoutEdge[] {
  const nodeSizes = new Map(layoutNodes.map((n) => [n.id, { width: n.width, height: n.height }]));

  return edges.map((edge) => {
    const sourcePos = positions[edge.source];
    const targetPos = positions[edge.target];
    const sourceSize = nodeSizes.get(edge.source);
    const targetSize = nodeSizes.get(edge.target);

    if (!sourcePos || !targetPos || !sourceSize || !targetSize) {
      return { id: edge.id, source: edge.source, target: edge.target, points: [] };
    }

    const sourceCenterX = sourcePos.x + sourceSize.width / 2;
    const sourceCenterY = sourcePos.y + sourceSize.height / 2;
    const targetCenterX = targetPos.x + targetSize.width / 2;
    const targetCenterY = targetPos.y + targetSize.height / 2;

    // Determine exit/entry points based on relative positions
    const dx = targetCenterX - sourceCenterX;
    const dy = targetCenterY - sourceCenterY;

    let startX: number, startY: number, endX: number, endY: number;

    if (Math.abs(dy) > Math.abs(dx)) {
      // Vertical connection
      if (dy > 0) {
        // Target is below source
        startX = sourceCenterX;
        startY = sourcePos.y + sourceSize.height;
        endX = targetCenterX;
        endY = targetPos.y;
      } else {
        // Target is above source
        startX = sourceCenterX;
        startY = sourcePos.y;
        endX = targetCenterX;
        endY = targetPos.y + targetSize.height;
      }
    } else {
      // Horizontal connection
      if (dx > 0) {
        startX = sourcePos.x + sourceSize.width;
        startY = sourceCenterY;
        endX = targetPos.x;
        endY = targetCenterY;
      } else {
        startX = sourcePos.x;
        startY = sourceCenterY;
        endX = targetPos.x + targetSize.width;
        endY = targetCenterY;
      }
    }

    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;

    return {
      id: edge.id,
      source: edge.source,
      target: edge.target,
      points: [
        { x: startX, y: startY },
        { x: midX, y: midY },
        { x: endX, y: endY },
      ],
    };
  });
}

export function FlowCanvas({ diagram, mode = 'view', className, onDiagramChange }: FlowCanvasProps) {
  const editable = mode === 'edit';
  const nodeRefs = useRef(new Map<string, HTMLElement | null>());

  const setNodeRef = useCallback((id: string, el: HTMLElement | null) => {
    nodeRefs.current.set(id, el);
  }, []);

  const layout = useAutoLayout(diagram, nodeRefs.current);

  const layoutPositions: { [id: string]: { x: number; y: number } } = {};
  for (const n of layout?.nodes || []) {
    layoutPositions[n.id] = { x: n.x, y: n.y };
  }

  const handlePositionChange = useCallback(
    (nodePositions: { [id: string]: { x: number; y: number } }) => {
      if (onDiagramChange) {
        onDiagramChange({
          ...diagram,
          _positions: nodePositions,
        } as FlowDiagram);
      }
    },
    [diagram, onDiagramChange]
  );

  const { positions, updatePositions, onDragStart, onDragMove, onDragEnd } = useDragNode(
    layoutPositions,
    1,
    handlePositionChange
  );

  useEffect(() => {
    updatePositions(layoutPositions);
  }, [layout]);

  // Recompute edges dynamically whenever positions change
  const dynamicEdges = useMemo(() => {
    if (!layout) return [];
    return computeDynamicEdges(diagram.edges, positions, layout.nodes);
  }, [diagram.edges, positions, layout?.nodes]);

  return (
    <div className={styles.root}>
    <CanvasView
      className={className}
      onDragMove={editable ? onDragMove : undefined}
      onDragEnd={editable ? onDragEnd : undefined}
      fitView={true}
      contentWidth={layout?.width}
      contentHeight={layout?.height}
    >
      {layout && (
        <EdgeRenderer edges={diagram.edges} layoutEdges={dynamicEdges} />
      )}
      {diagram.nodes.map((node) => (
        <FlowNodeRenderer
          key={node.id}
          node={node}
          editable={editable}
          position={positions[node.id] || { x: 0, y: 0 }}
          onDragStart={editable ? onDragStart : undefined}
          ref={(el) => setNodeRef(node.id, el)}
        />
      ))}
    </CanvasView>
    </div>
  );
}
