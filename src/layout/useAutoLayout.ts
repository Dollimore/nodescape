import { useEffect, useRef, useState } from 'react';
import * as dagre from 'dagre';
import type { FlowDiagram, LayoutResult, LayoutNode, LayoutEdge } from '../types';

const DEFAULT_NODE_WIDTH = 192; // 6 * 32
const DEFAULT_NODE_HEIGHT = 64;  // 2 * 32

export function useAutoLayout(
  diagram: FlowDiagram,
  nodeRefs: Map<string, HTMLElement | null>
): LayoutResult | null {
  const [layout, setLayout] = useState<LayoutResult | null>(null);
  const computedRef = useRef(false);

  useEffect(() => {
    const rafId = requestAnimationFrame(() => {
      const result = computeLayout(diagram, nodeRefs);
      setLayout(result);
      computedRef.current = true;
    });
    return () => cancelAnimationFrame(rafId);
  }, [diagram, nodeRefs]);

  return layout;
}

export function computeLayout(
  diagram: FlowDiagram,
  nodeRefs: Map<string, HTMLElement | null>
): LayoutResult {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));

  const direction = diagram.layout?.direction || 'TB';
  const nodeSpacing = diagram.layout?.nodeSpacing ?? 64;  // 2 * 32
  const rankSpacing = diagram.layout?.rankSpacing ?? 96;  // 3 * 32

  g.setGraph({
    rankdir: direction,
    nodesep: nodeSpacing,
    ranksep: rankSpacing,
    marginx: 32,
    marginy: 32,
  });

  // Visual grid lines are every 32px. Node edges must land ON these lines.
  const GRID = 32;
  const snapUp = (v: number) => Math.ceil(v / GRID) * GRID;

  for (const node of diagram.nodes) {
    if (node.type === 'group') continue; // groups are positioned after layout
    const el = nodeRefs.get(node.id);
    const rawW = el ? el.offsetWidth : DEFAULT_NODE_WIDTH;
    const rawH = el ? el.offsetHeight : DEFAULT_NODE_HEIGHT;
    // Snap dimensions up to nearest grid unit so nodes align with the grid
    g.setNode(node.id, { width: snapUp(rawW), height: snapUp(rawH) });
  }

  for (const edge of diagram.edges) {
    g.setEdge(edge.source, edge.target, { id: edge.id });
  }

  dagre.layout(g);

  const snapTo = (v: number) => Math.round(v / GRID) * GRID;

  const layoutNodes: LayoutNode[] = diagram.nodes
    .filter((node) => node.type !== 'group')
    .map((node) => {
      const dagreNode = g.node(node.id);
      return {
        id: node.id,
        x: snapTo(dagreNode.x - dagreNode.width / 2),
        y: snapTo(dagreNode.y - dagreNode.height / 2),
        width: dagreNode.width,
        height: dagreNode.height,
      };
    });

  // Compute group node positions from children bounding boxes
  for (const node of diagram.nodes) {
    if (node.type !== 'group') continue;
    const children = diagram.nodes.filter(n => n.parentId === node.id);
    const childLayouts = layoutNodes.filter(ln => children.some(c => c.id === ln.id));

    if (childLayouts.length === 0) {
      layoutNodes.push({ id: node.id, x: 0, y: 0, width: 192, height: 96 }); // 6*32, 3*32
      continue;
    }

    const padding = GRID;
    const headerHeight = GRID; // one grid unit for header
    const minX = snapTo(Math.min(...childLayouts.map(c => c.x)) - padding);
    const minY = snapTo(Math.min(...childLayouts.map(c => c.y)) - padding - headerHeight);
    const maxX = Math.max(...childLayouts.map(c => c.x + c.width)) + padding;
    const maxY = Math.max(...childLayouts.map(c => c.y + c.height)) + padding;

    layoutNodes.push({
      id: node.id,
      x: minX,
      y: minY,
      width: snapUp(maxX - minX),
      height: snapUp(maxY - minY),
    });
  }

  const layoutEdges: LayoutEdge[] = diagram.edges.map((edge) => {
    const dagreEdge = g.edge(edge.source, edge.target);
    return {
      id: edge.id,
      source: edge.source,
      target: edge.target,
      points: dagreEdge?.points || [],
    };
  });

  const graphInfo = g.graph();

  return {
    nodes: layoutNodes,
    edges: layoutEdges,
    width: graphInfo.width || 0,
    height: graphInfo.height || 0,
  };
}
