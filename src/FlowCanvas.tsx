import React, { useRef, useCallback, useEffect, useMemo, useImperativeHandle, useState } from 'react';
import type { FlowCanvasProps, FlowDiagram, FlowNode, LayoutEdge, LayoutNode } from './types';
import { ContextMenu } from './contextmenu/ContextMenu';
import { FlowNodeRenderer } from './nodes/FlowNodeRenderer';
import { EdgeRenderer } from './edges/EdgeRenderer';
import { useAutoLayout } from './layout/useAutoLayout';
import { CanvasView } from './canvas/CanvasView';
import { useDragNode } from './hooks/useDragNode';
import { exportDiagram, exportAndDownload } from './export/exportUtils';
import type { ExportOptions } from './export/exportUtils';
import styles from './FlowCanvas.module.css';
import { HelperLines } from './helpers/HelperLines';

export interface FlowCanvasRef {
  exportPng: (options?: ExportOptions) => Promise<string>;
  exportSvg: (options?: ExportOptions) => Promise<string>;
  downloadPng: (options?: ExportOptions) => Promise<void>;
  downloadSvg: (options?: ExportOptions) => Promise<void>;
}

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

/** Minimum distance a line extends straight out from a handle before bending */
const STUB_LENGTH = 30;

/** Get the stub direction vector for a handle side */
function getStubDirection(side: 'top' | 'bottom' | 'left' | 'right'): { dx: number; dy: number } {
  switch (side) {
    case 'top': return { dx: 0, dy: -1 };
    case 'bottom': return { dx: 0, dy: 1 };
    case 'left': return { dx: -1, dy: 0 };
    case 'right': return { dx: 1, dy: 0 };
  }
}

/** Compute edge waypoints dynamically from current node positions + sizes.
 *  For orthogonal routing, generates proper waypoints with stubs and right-angle segments.
 *  Handle sides are locked from the initial layout to prevent jumping. */
function computeDynamicEdges(
  edges: FlowDiagram['edges'],
  positions: { [id: string]: { x: number; y: number } },
  layoutNodes: LayoutNode[],
  initialPositions: { [id: string]: { x: number; y: number } },
  direction: string,
  routing: string
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

    const initSource = initialPositions[edge.source] || sourcePos;
    const initTarget = initialPositions[edge.target] || targetPos;
    const { sourceSide, targetSide } = computeHandleSides(
      initSource, sourceSize, initTarget, targetSize, direction
    );

    const start = getHandlePosition(sourcePos, sourceSize, sourceSide);
    const end = getHandlePosition(targetPos, targetSize, targetSide);

    const edgeRouting = edge.routing || routing;

    if (edgeRouting === 'orthogonal') {
      // Generate orthogonal waypoints: start -> stubOut -> bend(s) -> stubIn -> end
      const srcDir = getStubDirection(sourceSide);
      const tgtDir = getStubDirection(targetSide);

      // Stub points: extend straight out from handle
      const stubOut = { x: start.x + srcDir.dx * STUB_LENGTH, y: start.y + srcDir.dy * STUB_LENGTH };
      const stubIn = { x: end.x + tgtDir.dx * STUB_LENGTH, y: end.y + tgtDir.dy * STUB_LENGTH };

      // Determine if source and target exit/enter on same axis
      const srcIsVertical = sourceSide === 'top' || sourceSide === 'bottom';
      const tgtIsVertical = targetSide === 'top' || targetSide === 'bottom';

      let points: { x: number; y: number }[];

      if (srcIsVertical && tgtIsVertical) {
        // Both vertical (e.g., bottom->top in TB layout)
        // Path: start -> stubOut -> (stubOut.x, midY) -> (stubIn.x, midY) -> stubIn -> end
        const midY = (stubOut.y + stubIn.y) / 2;
        if (Math.abs(start.x - end.x) < 1) {
          // Aligned — straight line
          points = [start, end];
        } else {
          points = [
            start,
            stubOut,
            { x: stubOut.x, y: midY },
            { x: stubIn.x, y: midY },
            stubIn,
            end,
          ];
        }
      } else if (!srcIsVertical && !tgtIsVertical) {
        // Both horizontal (e.g., right->left in LR layout)
        const midX = (stubOut.x + stubIn.x) / 2;
        if (Math.abs(start.y - end.y) < 1) {
          points = [start, end];
        } else {
          points = [
            start,
            stubOut,
            { x: midX, y: stubOut.y },
            { x: midX, y: stubIn.y },
            stubIn,
            end,
          ];
        }
      } else {
        // Mixed: one vertical, one horizontal — single bend
        if (srcIsVertical) {
          // Go vertical from source, then horizontal to target
          points = [
            start,
            stubOut,
            { x: stubOut.x, y: stubIn.y },
            stubIn,
            end,
          ];
        } else {
          // Go horizontal from source, then vertical to target
          points = [
            start,
            stubOut,
            { x: stubIn.x, y: stubOut.y },
            stubIn,
            end,
          ];
        }
      }

      return { id: edge.id, source: edge.source, target: edge.target, points };
    }

    // For curved/straight: just start, midpoint, end
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

export const FlowCanvas = React.forwardRef<FlowCanvasRef, FlowCanvasProps>(
  function FlowCanvas({ diagram, mode = 'view', className, onDiagramChange, background, minimap, theme, onNodeClick, nodeRenderers, onContextMenu, contextMenu }: FlowCanvasProps, ref) {
  const editable = mode === 'edit';

  const [contextMenuState, setContextMenuState] = useState<{
    x: number; y: number; nodeId: string; node: FlowNode;
  } | null>(null);
  const nodeRefs = useRef(new Map<string, HTMLElement | null>());
  const contentRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({
    exportPng: (options?: ExportOptions) =>
      exportDiagram(contentRef.current!, { ...options, format: 'png' }),
    exportSvg: (options?: ExportOptions) =>
      exportDiagram(contentRef.current!, { ...options, format: 'svg' }),
    downloadPng: (options?: ExportOptions) =>
      exportAndDownload(contentRef.current!, { ...options, format: 'png' }),
    downloadSvg: (options?: ExportOptions) =>
      exportAndDownload(contentRef.current!, { ...options, format: 'svg' }),
  }));

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

  const { positions, updatePositions, onDragStart, onDragMove, onDragEnd, isDragging } = useDragNode(
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
      diagram.layout?.direction || 'TB',
      diagram.layout?.routing || 'curved'
    );
  }, [diagram.edges, positions, layout?.nodes, layoutPositions, diagram.layout?.direction, diagram.layout?.routing]);

  // Compute alignment helper lines when dragging in edit mode
  const helperLines = useMemo(() => {
    if (!isDragging || !layout) return [];

    const nodeSizes = new Map(layout.nodes.map((n) => [n.id, { width: n.width, height: n.height }]));

    // Identify the node being dragged: its position deviates from the layout position
    let draggingId: string | null = null;
    for (const id of Object.keys(positions)) {
      const lp = layoutPositions[id];
      const cp = positions[id];
      if (lp && cp && (Math.abs(cp.x - lp.x) > 0.5 || Math.abs(cp.y - lp.y) > 0.5)) {
        draggingId = id;
        break;
      }
    }
    if (!draggingId) return [];

    const dragPos = positions[draggingId];
    const dragSize = nodeSizes.get(draggingId);
    if (!dragPos || !dragSize) return [];

    const lines: { type: 'horizontal' | 'vertical'; position: number }[] = [];
    const dragCenterX = dragPos.x + dragSize.width / 2;
    const dragCenterY = dragPos.y + dragSize.height / 2;
    const dragRight = dragPos.x + dragSize.width;
    const dragBottom = dragPos.y + dragSize.height;

    for (const id of Object.keys(positions)) {
      if (id === draggingId) continue;
      const other = positions[id];
      const otherSize = nodeSizes.get(id);
      if (!other || !otherSize) continue;

      const otherCenterX = other.x + otherSize.width / 2;
      const otherCenterY = other.y + otherSize.height / 2;
      const otherRight = other.x + otherSize.width;
      const otherBottom = other.y + otherSize.height;

      const THRESHOLD = 8;

      // Vertical guide lines (X alignment)
      if (Math.abs(dragPos.x - other.x) < THRESHOLD) {
        lines.push({ type: 'vertical', position: other.x });
      } else if (Math.abs(dragCenterX - otherCenterX) < THRESHOLD) {
        lines.push({ type: 'vertical', position: otherCenterX });
      } else if (Math.abs(dragRight - otherRight) < THRESHOLD) {
        lines.push({ type: 'vertical', position: otherRight });
      }

      // Horizontal guide lines (Y alignment)
      if (Math.abs(dragPos.y - other.y) < THRESHOLD) {
        lines.push({ type: 'horizontal', position: other.y });
      } else if (Math.abs(dragCenterY - otherCenterY) < THRESHOLD) {
        lines.push({ type: 'horizontal', position: otherCenterY });
      } else if (Math.abs(dragBottom - otherBottom) < THRESHOLD) {
        lines.push({ type: 'horizontal', position: otherBottom });
      }
    }

    return lines;
  }, [isDragging, positions, layout, layoutPositions]);

  return (
    <div className={`${styles.root} ${theme === 'dark' ? styles.dark : ''}`}>
    <CanvasView
      className={className}
      onDragMove={editable ? onDragMove : undefined}
      onDragEnd={editable ? onDragEnd : undefined}
      fitView={true}
      contentWidth={layout?.width}
      contentHeight={layout?.height}
      background={background}
      minimapEnabled={!!minimap}
      minimapConfig={typeof minimap === 'object' ? minimap : undefined}
      layoutNodes={layout?.nodes}
      layoutWidth={layout?.width}
      layoutHeight={layout?.height}
      contentRef={contentRef}
    >
      {layout && (
        <EdgeRenderer
          edges={diagram.edges}
          layoutEdges={dynamicEdges}
          defaultRouting={diagram.layout?.routing || 'curved'}
          cornerRadius={diagram.layout?.cornerRadius}
        />
      )}
      {editable && <HelperLines lines={helperLines} />}
      {diagram.nodes.map((node) => (
        <FlowNodeRenderer
          key={node.id}
          node={node}
          editable={editable}
          position={positions[node.id] || { x: 0, y: 0 }}
          onDragStart={editable ? onDragStart : undefined}
          isDragging={isDragging}
          onClick={onNodeClick ? () => onNodeClick(node.id, node) : undefined}
          customRenderers={nodeRenderers}
          ref={(el) => setNodeRef(node.id, el)}
          onNodeContextMenu={(nodeId, e) => {
            e.preventDefault();
            if (onContextMenu) {
              onContextMenu(nodeId, diagram.nodes.find(n => n.id === nodeId)!, { x: e.clientX, y: e.clientY });
            }
            if (contextMenu) {
              setContextMenuState({
                x: e.clientX,
                y: e.clientY,
                nodeId,
                node: diagram.nodes.find(n => n.id === nodeId)!,
              });
            }
          }}
        />
      ))}
    </CanvasView>
    {contextMenuState && (
      <ContextMenu
        x={contextMenuState.x}
        y={contextMenuState.y}
        onClose={() => setContextMenuState(null)}
        items={(() => {
          const { nodeId, node } = contextMenuState;
          if (typeof contextMenu === 'object' && contextMenu.items) {
            return contextMenu.items.map(item => ({
              label: item.label,
              onClick: () => item.action(nodeId, node),
            }));
          }
          // Default items when contextMenu={true}
          const defaultItems: { label: string; onClick: () => void }[] = [
            {
              label: 'Duplicate',
              onClick: () => console.log('Duplicate node:', nodeId, node),
            },
            {
              label: 'Delete',
              onClick: () => console.log('Delete node:', nodeId, node),
            },
          ];
          if (node.sections && node.sections.length > 0) {
            defaultItems.push({
              label: node.collapsed ? 'Expand' : 'Collapse',
              onClick: () => console.log(node.collapsed ? 'Expand' : 'Collapse', 'node:', nodeId, node),
            });
          }
          return defaultItems;
        })()}
      />
    )}
    </div>
  );
});
