import React, { useRef, useCallback, useEffect, useMemo, useImperativeHandle, useState } from 'react';
import type { FlowCanvasProps, FlowDiagram, FlowNode, FlowEdge } from './types';
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
import { DragDropSidebar } from './sidebar/DragDropSidebar';
import { ThemeToggle } from './controls/ThemeToggle';
import { computeDynamicEdges } from './edges/computeEdges';

export interface FlowCanvasRef {
  exportPng: (options?: ExportOptions) => Promise<string>;
  exportSvg: (options?: ExportOptions) => Promise<string>;
  downloadPng: (options?: ExportOptions) => Promise<void>;
  downloadSvg: (options?: ExportOptions) => Promise<void>;
}

/** Filter out nodes and edges that are downstream of a collapsed node */
function getVisibleNodesAndEdges(diagram: FlowDiagram): { nodes: FlowNode[]; edges: FlowEdge[] } {
  const collapsedNodeIds = new Set(
    diagram.nodes.filter(n => n.branchCollapsed).map(n => n.id)
  );

  if (collapsedNodeIds.size === 0) {
    return { nodes: diagram.nodes, edges: diagram.edges };
  }

  // Find all nodes downstream of collapsed nodes
  const hiddenNodeIds = new Set<string>();

  function hideDownstream(nodeId: string) {
    for (const edge of diagram.edges) {
      if (edge.source === nodeId && !collapsedNodeIds.has(edge.target)) {
        hiddenNodeIds.add(edge.target);
        hideDownstream(edge.target);
      }
    }
  }

  for (const nodeId of collapsedNodeIds) {
    hideDownstream(nodeId);
  }

  const visibleNodes = diagram.nodes.filter(n => !hiddenNodeIds.has(n.id));
  const visibleEdges = diagram.edges.filter(e => !hiddenNodeIds.has(e.source) && !hiddenNodeIds.has(e.target));

  return { nodes: visibleNodes, edges: visibleEdges };
}


export const FlowCanvas = React.forwardRef<FlowCanvasRef, FlowCanvasProps>(
  function FlowCanvas({ diagram, mode = 'view', className, onDiagramChange, background, minimap, theme, onNodeClick, nodeRenderers, onContextMenu, contextMenu, onNodeCollapse, sidebar, onNodeDrop, themeToggle, onThemeChange, zoomControls, onUndo, onRedo, canUndo, canRedo, onSelectionChange, onNodesDelete, onNodesCopy, onNodesPaste, onEdgeCreate, onNodeLabelChange, contextualZoom }: FlowCanvasProps, ref) {
  const editable = mode === 'edit';

  const [currentScale, setCurrentScale] = useState(1);
  const detailLevel: 'minimal' | 'compact' | 'full' = !contextualZoom
    ? 'full'
    : currentScale < 0.3
    ? 'minimal'
    : currentScale < 0.6
    ? 'compact'
    : 'full';

  const [internalTheme, setInternalTheme] = useState<'light' | 'dark'>(theme || 'light');
  const activeTheme = theme !== undefined && !themeToggle ? theme : internalTheme;

  useEffect(() => {
    if (theme !== undefined) setInternalTheme(theme);
  }, [theme]);

  const handleThemeChange = useCallback((newTheme: 'light' | 'dark') => {
    setInternalTheme(newTheme);
    if (onThemeChange) onThemeChange(newTheme);
  }, [onThemeChange]);

  const [contextMenuState, setContextMenuState] = useState<{
    x: number; y: number; nodeId: string; node: FlowNode;
  } | null>(null);

  const [selectedNodeIds, setSelectedNodeIds] = useState<Set<string>>(new Set());

  const handleDelete = useCallback(() => {
    if (selectedNodeIds.size > 0 && onNodesDelete) {
      onNodesDelete(Array.from(selectedNodeIds));
      setSelectedNodeIds(new Set());
    }
  }, [selectedNodeIds, onNodesDelete]);

  useEffect(() => {
    if (onSelectionChange) {
      onSelectionChange(Array.from(selectedNodeIds));
    }
  }, [selectedNodeIds, onSelectionChange]);

  // Copy/paste handlers
  const handleCopy = useCallback(() => {
    if (onNodesCopy) {
      const nodes = diagram.nodes.filter(n => selectedNodeIds.has(n.id));
      if (nodes.length > 0) onNodesCopy(nodes);
    }
  }, [diagram.nodes, onNodesCopy, selectedNodeIds]);

  const handlePaste = useCallback(() => {
    if (onNodesPaste) {
      onNodesPaste({ x: 100, y: 100 });
    }
  }, [onNodesPaste]);

  // Connection drag state for drawing edges between handles
  const [connectionDrag, setConnectionDrag] = useState<{
    sourceId: string;
    sourcePoint: { x: number; y: number };
    currentPoint: { x: number; y: number };
  } | null>(null);

  const handleHandleDrag = useCallback((nodeId: string, _side: string, e: React.MouseEvent) => {
    setConnectionDrag({
      sourceId: nodeId,
      sourcePoint: { x: e.clientX, y: e.clientY },
      currentPoint: { x: e.clientX, y: e.clientY },
    });
  }, []);

  const handleConnectionMouseMove = useCallback((e: React.MouseEvent) => {
    if (connectionDrag) {
      setConnectionDrag(prev => prev ? { ...prev, currentPoint: { x: e.clientX, y: e.clientY } } : null);
    }
  }, [connectionDrag]);

  const handleConnectionMouseUp = useCallback((e: React.MouseEvent) => {
    if (!connectionDrag) return;
    const el = document.elementFromPoint(e.clientX, e.clientY);
    if (el) {
      // Walk up to find a node container with data-testid="node-<id>"
      let target: Element | null = el;
      while (target) {
        const testId = target.getAttribute('data-testid');
        if (testId && testId.startsWith('node-')) {
          const targetId = testId.slice('node-'.length);
          if (targetId !== connectionDrag.sourceId && onEdgeCreate) {
            onEdgeCreate(connectionDrag.sourceId, targetId);
          }
          break;
        }
        target = target.parentElement;
      }
    }
    setConnectionDrag(null);
  }, [connectionDrag, onEdgeCreate]);

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

  // Filter nodes/edges based on collapsed branches before passing to layout
  const { nodes: visibleNodes, edges: visibleEdges } = useMemo(
    () => getVisibleNodesAndEdges(diagram),
    [diagram]
  );

  const visibleDiagram = useMemo(
    () => ({ ...diagram, nodes: visibleNodes, edges: visibleEdges }),
    [diagram, visibleNodes, visibleEdges]
  );

  const [layoutVersion, setLayoutVersion] = useState(0);
  const triggerRelayout = useCallback(() => {
    setLayoutVersion(v => v + 1);
  }, []);

  const layout = useAutoLayout(visibleDiagram, nodeRefs.current, layoutVersion);

  const layoutPositions: { [id: string]: { x: number; y: number } } = {};
  const nodeSizesMap = new Map<string, { width: number; height: number }>();
  for (const n of layout?.nodes || []) {
    layoutPositions[n.id] = { x: n.x, y: n.y };
    nodeSizesMap.set(n.id, { width: n.width, height: n.height });
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

  // Build group -> children map for group dragging
  const groupChildren = useMemo(() => {
    const map: { [groupId: string]: string[] } = {};
    for (const node of diagram.nodes) {
      if (node.parentId) {
        if (!map[node.parentId]) map[node.parentId] = [];
        map[node.parentId].push(node.id);
      }
    }
    return map;
  }, [diagram.nodes]);

  const { positions, updatePositions, onDragStart, onDragMove, onDragEnd, isDragging } = useDragNode(
    layoutPositions,
    1,
    handlePositionChange,
    groupChildren
  );

  useEffect(() => {
    updatePositions(layoutPositions);
  }, [layout]);

  // Recompute edges dynamically whenever positions change
  // Handle sides are locked based on initial layout positions to prevent jumping
  const dynamicEdges = useMemo(() => {
    if (!layout) return [];
    return computeDynamicEdges(
      visibleEdges,
      positions,
      layout.nodes,
      layoutPositions,
      diagram.layout?.direction || 'TB',
      diagram.layout?.routing || 'curved',
      visibleNodes
    );
  }, [visibleEdges, positions, layout?.nodes, layoutPositions, diagram.layout?.direction, diagram.layout?.routing, layoutVersion]);

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

  // Compute overlapping node IDs for visual feedback during drag
  const overlappingNodeIds = useMemo(() => {
    if (!isDragging || !layout) return new Set<string>();

    const nodeSizes = new Map(layout.nodes.map(n => [n.id, { width: n.width, height: n.height }]));
    const overlapping = new Set<string>();

    const nodeIds = Object.keys(positions);
    for (let i = 0; i < nodeIds.length; i++) {
      for (let j = i + 1; j < nodeIds.length; j++) {
        const a = nodeIds[i];
        const b = nodeIds[j];
        const posA = positions[a];
        const posB = positions[b];
        const sizeA = nodeSizes.get(a);
        const sizeB = nodeSizes.get(b);
        if (!posA || !posB || !sizeA || !sizeB) continue;

        // Skip group nodes
        const nodeA = diagram.nodes.find(n => n.id === a);
        const nodeB = diagram.nodes.find(n => n.id === b);
        if (nodeA?.type === 'group' || nodeB?.type === 'group') continue;
        // Skip parent-child pairs
        if (nodeA?.parentId === b || nodeB?.parentId === a) continue;

        if (
          posA.x < posB.x + sizeB.width &&
          posA.x + sizeA.width > posB.x &&
          posA.y < posB.y + sizeB.height &&
          posA.y + sizeA.height > posB.y
        ) {
          overlapping.add(a);
          overlapping.add(b);
        }
      }
    }

    return overlapping;
  }, [isDragging, positions, layout, diagram.nodes]);

  // Build a set of node IDs that have outgoing edges (used for collapse menu items)
  const nodesWithOutgoingEdges = useMemo(() => {
    const set = new Set<string>();
    for (const edge of diagram.edges) {
      set.add(edge.source);
    }
    return set;
  }, [diagram.edges]);

  const handleLassoSelect = useCallback((nodeIds: string[]) => {
    setSelectedNodeIds(prev => {
      const next = new Set(prev);
      for (const id of nodeIds) next.add(id);
      return next;
    });
  }, []);

  const handleCanvasDrop = useCallback((e: React.DragEvent) => {
    const data = e.dataTransfer.getData('application/drawing-mvp-node');
    if (!data || !onNodeDrop) return;
    e.preventDefault();
    const template = JSON.parse(data);
    const rect = e.currentTarget.getBoundingClientRect();
    onNodeDrop(template, { x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, [onNodeDrop]);

  return (
    <div className={`${styles.root} ${activeTheme === 'dark' ? styles.dark : ''}`}>
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
      onDrop={handleCanvasDrop}
      onDragOver={(e) => e.preventDefault()}
      zoomControls={!!zoomControls}
      onUndo={onUndo}
      onRedo={onRedo}
      canUndo={canUndo}
      canRedo={canRedo}
      onBackgroundClick={() => setSelectedNodeIds(new Set())}
      onDelete={editable ? handleDelete : undefined}
      onCopy={editable ? handleCopy : undefined}
      onPaste={editable ? handlePaste : undefined}
      onConnectionMouseMove={editable ? handleConnectionMouseMove : undefined}
      onConnectionMouseUp={editable ? handleConnectionMouseUp : undefined}
      onLassoSelect={editable ? handleLassoSelect : undefined}
      onZoomChange={contextualZoom ? setCurrentScale : undefined}
    >
      {layout && (
        <EdgeRenderer
          edges={visibleEdges}
          layoutEdges={dynamicEdges}
          defaultRouting={diagram.layout?.routing || 'curved'}
          cornerRadius={diagram.layout?.cornerRadius}
          isDragging={isDragging}
        />
      )}
      {editable && <HelperLines lines={helperLines} />}
      {connectionDrag && (
        <svg style={{ position: 'fixed', top: 0, left: 0, width: 1, height: 1, overflow: 'visible', pointerEvents: 'none', zIndex: 9999 }}>
          <line
            x1={connectionDrag.sourcePoint.x}
            y1={connectionDrag.sourcePoint.y}
            x2={connectionDrag.currentPoint.x}
            y2={connectionDrag.currentPoint.y}
            stroke="#3b82f6"
            strokeWidth={2}
            strokeDasharray="6 4"
          />
        </svg>
      )}
      {[...visibleNodes].sort((a, b) => {
        // Render group nodes first so they appear behind child nodes
        if (a.type === 'group' && b.type !== 'group') return -1;
        if (a.type !== 'group' && b.type === 'group') return 1;
        return 0;
      }).map((node) => (
        <FlowNodeRenderer
          key={node.id}
          node={node}
          editable={editable}
          position={positions[node.id] || { x: 0, y: 0 }}
          size={nodeSizesMap.get(node.id)}
          detailLevel={detailLevel}
          onDragStart={editable ? onDragStart : undefined}
          isDragging={isDragging}
          onClick={onNodeClick ? () => onNodeClick(node.id, node) : undefined}
          onNodeSelect={(nodeId, e) => {
            if (e.shiftKey) {
              setSelectedNodeIds(prev => {
                const next = new Set(prev);
                if (next.has(nodeId)) next.delete(nodeId);
                else next.add(nodeId);
                return next;
              });
            } else {
              setSelectedNodeIds(new Set([nodeId]));
            }
          }}
          isSelected={selectedNodeIds.has(node.id)}
          isOverlapping={overlappingNodeIds.has(node.id)}
          customRenderers={nodeRenderers}
          onRelayout={triggerRelayout}
          onHandleDrag={editable ? handleHandleDrag : undefined}
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
          onLabelChange={onNodeLabelChange}
        />
      ))}
    </CanvasView>
    {themeToggle && (
      <ThemeToggle theme={activeTheme} onChange={handleThemeChange} />
    )}
    {sidebar && sidebar.length > 0 && (
      <DragDropSidebar templates={sidebar} />
    )}
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
          // Collapse / Expand Branch — only for nodes that have outgoing edges
          if (nodesWithOutgoingEdges.has(nodeId)) {
            defaultItems.push({
              label: node.branchCollapsed ? 'Expand Branch' : 'Collapse Branch',
              onClick: () => {
                if (onNodeCollapse) {
                  onNodeCollapse(nodeId, !node.branchCollapsed);
                }
                setContextMenuState(null);
              },
            });
          }
          return defaultItems;
        })()}
      />
    )}
    </div>
  );
});
