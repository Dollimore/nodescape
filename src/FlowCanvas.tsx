import React, { useRef, useCallback, useEffect, useMemo } from 'react';
import type { FlowCanvasProps, FlowDiagram, LayoutEdge, LayoutNode } from './types';
import { FlowNodeRenderer } from './nodes/FlowNodeRenderer';
import { EdgeRenderer } from './edges/EdgeRenderer';
import { useAutoLayout } from './layout/useAutoLayout';
import { CanvasView } from './canvas/CanvasView';
import { useDragNode } from './hooks/useDragNode';
import styles from './FlowCanvas.module.css';

/** Get the fixed handle position for a node edge connection */
function getHandlePosition(
  pos: { x: number; y: number },
  size: { width: number; height: number },
  side: 'top' | 'bottom' | 'left' | 'right'
): { x: number; y: number } {
  const cx = pos.x + size.width / 2;
  const cy = pos.y + size.height / 2;
  switch (side) {
    case 'top': return { x: cx, y: pos.y };
    case 'bottom': return { x: cx, y: pos.y + size.height };
    case 'left': return { x: pos.x, y: cy };
    case 'right': return { x: pos.x + size.width, y: cy };
  }
}

/** Determine which handle sides to use based on initial layout positions (locked once) */
function computeHandleSides(
  sourcePos: { x: number; y: number },
  sourceSize: { width: number; height: number },
  targetPos: { x: number; y: number },
  targetSize: { width: number; height: number },
  direction: string
): { sourceSide: 'top' | 'bottom' | 'left' | 'right'; targetSide: 'top' | 'bottom' | 'left' | 'right' } {
  // For TB/BT layouts, default to bottom->top
  // For LR/RL layouts, default to right->left
  if (direction === 'LR' || direction === 'RL') {
    const sourceCX = sourcePos.x + sourceSize.width / 2;
    const targetCX = targetPos.x + targetSize.width / 2;
    if (targetCX >= sourceCX) {
      return { sourceSide: 'right', targetSide: 'left' };
    } else {
      return { sourceSide: 'left', targetSide: 'right' };
    }
  }

  // TB (default) / BT
  const sourceCY = sourcePos.y + sourceSize.height / 2;
  const targetCY = targetPos.y + targetSize.height / 2;
  if (targetCY >= sourceCY) {
    return { sourceSide: 'bottom', targetSide: 'top' };
  } else {
    return { sourceSide: 'top', targetSide: 'bottom' };
  }
}

/** Compute edge points dynamically from current node positions + sizes.
 *  Handle sides are determined from the initial layout positions and stay fixed. */
function computeDynamicEdges(
  edges: FlowDiagram['edges'],
  positions: { [id: string]: { x: number; y: number } },
  layoutNodes: LayoutNode[],
  initialPositions: { [id: string]: { x: number; y: number } },
  direction: string
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

    // Use initial layout positions to lock handle sides (prevents jumping)
    const initSource = initialPositions[edge.source] || sourcePos;
    const initTarget = initialPositions[edge.target] || targetPos;
    const { sourceSide, targetSide } = computeHandleSides(
      initSource, sourceSize, initTarget, targetSize, direction
    );

    const start = getHandlePosition(sourcePos, sourceSize, sourceSide);
    const end = getHandlePosition(targetPos, targetSize, targetSide);

    const midX = (start.x + end.x) / 2;
    const midY = (start.y + end.y) / 2;

    return {
      id: edge.id,
      source: edge.source,
      target: edge.target,
      points: [start, { x: midX, y: midY }, end],
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
  // Handle sides are locked based on initial layout positions to prevent jumping
  const dynamicEdges = useMemo(() => {
    if (!layout) return [];
    return computeDynamicEdges(
      diagram.edges,
      positions,
      layout.nodes,
      layoutPositions,
      diagram.layout?.direction || 'TB'
    );
  }, [diagram.edges, positions, layout?.nodes, layoutPositions, diagram.layout?.direction]);

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
        <EdgeRenderer
          edges={diagram.edges}
          layoutEdges={dynamicEdges}
          defaultRouting={diagram.layout?.routing || 'curved'}
          cornerRadius={diagram.layout?.cornerRadius}
        />
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
