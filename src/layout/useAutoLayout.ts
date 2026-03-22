import { useEffect, useRef, useState } from 'react';
import * as dagre from 'dagre';
import type { FlowDiagram, LayoutResult, LayoutNode, LayoutEdge } from '../types';

const DEFAULT_NODE_WIDTH = 192; // 24 * 8
const DEFAULT_NODE_HEIGHT = 64;  // 8 * 8

export function useAutoLayout(
  diagram: FlowDiagram,
  nodeRefs: Map<string, HTMLElement | null>,
  layoutVersion: number = 0
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
  }, [diagram, nodeRefs, layoutVersion]);

  return layout;
}

export function computeLayout(
  diagram: FlowDiagram,
  nodeRefs: Map<string, HTMLElement | null>
): LayoutResult {
  const g = new dagre.graphlib.Graph({ compound: true });
  g.setDefaultEdgeLabel(() => ({}));

  const direction = diagram.layout?.direction || 'TB';
  const nodeSpacing = diagram.layout?.nodeSpacing ?? 96;  // 12 * 8
  const rankSpacing = diagram.layout?.rankSpacing ?? 104; // 13 * 8

  g.setGraph({
    rankdir: direction,
    nodesep: nodeSpacing,
    ranksep: rankSpacing,
    marginx: 48, // 6 * 8
    marginy: 48,
  });

  // Universal 8px grid. All dimensions and positions are multiples of 8.
  const GRID = 8;
  const snapUp = (v: number) => Math.ceil(v / GRID) * GRID;

  // Add group nodes to dagre as compound parents
  for (const node of diagram.nodes) {
    if (node.type === 'group') {
      g.setNode(node.id, { clusterLabelPos: 'top' });
    }
  }

  for (const node of diagram.nodes) {
    if (node.type === 'group') continue;
    const el = nodeRefs.get(node.id);
    let rawW = el ? el.offsetWidth : DEFAULT_NODE_WIDTH;
    let rawH = el ? el.offsetHeight : DEFAULT_NODE_HEIGHT;
    if (node.rotation === 90 || node.rotation === 270) {
      [rawW, rawH] = [rawH, rawW];
    }
    g.setNode(node.id, { width: snapUp(rawW), height: snapUp(rawH) });
    // Set parent-child relationship for compound layout
    if (node.parentId && diagram.nodes.some(n => n.id === node.parentId && n.type === 'group')) {
      g.setParent(node.id, node.parentId);
    }
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

    const padding = GRID * 6; // 48px padding around children
    const headerHeight = GRID * 5; // 40px for group label
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
